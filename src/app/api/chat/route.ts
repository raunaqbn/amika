import { streamText, tool } from 'ai';
import { getModel, systemPrompt } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { getUserId } from '@/lib/auth';
import { z } from 'zod';
import { formatInterestsForAI, parseInterests } from '@/lib/interests';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Geocode a location string to GPS coordinates for more precise SerpAPI searches
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_PLACES_API_KEY) {
    console.log('[geocodeLocation] No Google API key configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      address: location,
      key: GOOGLE_PLACES_API_KEY,
    });

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    );

    if (!response.ok) {
      console.error('[geocodeLocation] Google Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log('[geocodeLocation] Resolved location:', location, '→', { lat, lng });
      return { lat, lng };
    }

    console.log('[geocodeLocation] No results for:', location);
    return null;
  } catch (error) {
    console.error('[geocodeLocation] Error:', error);
    return null;
  }
}

interface SerpAPIEvent {
  title: string;
  date?: {
    start_date?: string;
    when?: string;
  };
  address?: string[];
  link?: string;
  description?: string;
  venue?: {
    name?: string;
    rating?: number;
    reviews?: number;
    link?: string;
  };
  thumbnail?: string;
}

interface SerpAPIResponse {
  events_results?: SerpAPIEvent[];
  error?: string;
}

interface SerpAPIShowtime {
  time: string[];
  type?: string;
}

interface SerpAPITheater {
  name: string;
  link?: string;
  address?: string;
  showing?: SerpAPIShowtime[];
  distance?: string;
}

interface SerpAPIMovie {
  name: string;
  link?: string;
  description?: string;
  duration?: string;
  genre?: string[];
  rating?: string;
  theaters?: SerpAPITheater[];
}

interface SerpAPIShowtimesResponse {
  showtimes?: SerpAPIMovie[];
  error?: string;
}

async function searchMovies(query: string, location: string): Promise<{
  movies: Array<{
    name: string;
    description: string;
    duration: string;
    genre: string;
    rating: string;
    theaters: Array<{
      name: string;
      address: string;
      showtimes: string[];
    }>;
  }>;
  searchQuery: string;
  location: string;
  source: string;
}> {
  console.log('[searchMovies] Starting search:', { query, location, hasApiKey: !!SERPAPI_KEY });

  if (!SERPAPI_KEY) {
    console.log('[searchMovies] No API key configured');
    return {
      searchQuery: query,
      location,
      source: 'suggestions',
      movies: [],
    };
  }

  try {
    // First, geocode the location to get precise GPS coordinates
    const coords = await geocodeLocation(location);

    const params = new URLSearchParams({
      engine: 'google_showtimes',
      q: query || 'movies',
      api_key: SERPAPI_KEY,
      hl: 'en',
    });

    // Use GPS coordinates if available for more precise results
    if (coords) {
      params.set('location', `${coords.lat},${coords.lng}`);
      console.log('[searchMovies] Using GPS coordinates:', `${coords.lat},${coords.lng}`);
    } else {
      params.set('location', location);
      console.log('[searchMovies] Falling back to location string:', location);
    }

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log('[searchMovies] Fetching:', url.replace(SERPAPI_KEY, 'REDACTED'));

    const response = await fetch(url);
    console.log('[searchMovies] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[searchMovies] SerpAPI error:', response.status, errorText);
      return {
        searchQuery: query,
        location,
        source: 'error',
        movies: [],
      };
    }

    const data: SerpAPIShowtimesResponse = await response.json();
    console.log('[searchMovies] Response data keys:', Object.keys(data));
    console.log('[searchMovies] Showtimes count:', data.showtimes?.length || 0);

    if (data.error) {
      console.error('[searchMovies] SerpAPI returned error:', data.error);
      return {
        searchQuery: query,
        location,
        source: 'error',
        movies: [],
      };
    }

    const movies = (data.showtimes || []).slice(0, 8).map((movie) => ({
      name: movie.name,
      description: movie.description || '',
      duration: movie.duration || '',
      genre: movie.genre?.join(', ') || '',
      rating: movie.rating || '',
      theaters: (movie.theaters || []).slice(0, 3).map((theater) => ({
        name: theater.name,
        address: theater.address || '',
        showtimes: theater.showing?.flatMap((s) => s.time) || [],
      })),
    }));

    console.log('[searchMovies] Processed movies count:', movies.length);
    return {
      searchQuery: query,
      location,
      source: 'google_showtimes',
      movies,
    };
  } catch (error) {
    console.error('[searchMovies] Error:', error);
    return {
      searchQuery: query,
      location,
      source: 'error',
      movies: [],
    };
  }
}

async function searchGoogleEvents(query: string, location?: string): Promise<{
  events: Array<{
    title: string;
    date: string;
    location: string;
    description: string;
    link?: string;
    venue?: string;
  }>;
  searchQuery: string;
  source: string;
}> {
  const searchQuery = location ? `${query} in ${location}` : query;

  if (!SERPAPI_KEY) {
    // Fallback when no API key is configured
    return {
      searchQuery,
      source: 'suggestions',
      events: [],
    };
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_events',
      q: searchQuery,
      api_key: SERPAPI_KEY,
      hl: 'en',
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      console.error('SerpAPI error:', response.status);
      return {
        searchQuery,
        source: 'error',
        events: [],
      };
    }

    const data: SerpAPIResponse = await response.json();

    if (data.error) {
      console.error('SerpAPI returned error:', data.error);
      return {
        searchQuery,
        source: 'error',
        events: [],
      };
    }

    const events = (data.events_results || []).slice(0, 10).map((event) => ({
      title: event.title,
      date: event.date?.when || event.date?.start_date || 'Date TBD',
      location: event.address?.join(', ') || 'Location TBD',
      description: event.description || '',
      link: event.link,
      venue: event.venue?.name,
    }));

    return {
      searchQuery,
      source: 'google_events',
      events,
    };
  } catch (error) {
    console.error('Error fetching events from SerpAPI:', error);
    return {
      searchQuery,
      source: 'error',
      events: [],
    };
  }
}

// Google Local search for restaurants, bars, cafes, activities
interface SerpAPILocalResult {
  position?: number;
  title: string;
  place_id?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  type?: string;
  types?: string[];
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  description?: string;
  thumbnail?: string;
}

interface SerpAPILocalResponse {
  local_results?: SerpAPILocalResult[];
  error?: string;
}

async function searchLocalPlaces(query: string, location: string): Promise<{
  places: Array<{
    name: string;
    rating: number | null;
    reviews: number | null;
    price: string;
    type: string;
    address: string;
    phone: string;
    website: string;
    hours: string;
  }>;
  searchQuery: string;
  location: string;
  source: string;
}> {
  console.log('[searchLocalPlaces] Starting search:', { query, location, hasApiKey: !!SERPAPI_KEY });

  if (!SERPAPI_KEY) {
    console.log('[searchLocalPlaces] No API key configured');
    return {
      searchQuery: query,
      location,
      source: 'suggestions',
      places: [],
    };
  }

  try {
    // First, geocode the location to get precise GPS coordinates
    const coords = await geocodeLocation(location);

    const params = new URLSearchParams({
      engine: 'google_local',
      q: query,
      api_key: SERPAPI_KEY,
      hl: 'en',
    });

    // Use GPS coordinates if available for more precise results
    // Otherwise fall back to location string
    if (coords) {
      // ll parameter format: "@lat,lng,zoom" - zoom 14 is good for local searches
      params.set('ll', `@${coords.lat},${coords.lng},14z`);
      console.log('[searchLocalPlaces] Using GPS coordinates:', `@${coords.lat},${coords.lng},14z`);
    } else {
      params.set('location', location);
      console.log('[searchLocalPlaces] Falling back to location string:', location);
    }

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log('[searchLocalPlaces] Fetching:', url.replace(SERPAPI_KEY, 'REDACTED'));

    const response = await fetch(url);
    console.log('[searchLocalPlaces] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[searchLocalPlaces] SerpAPI error:', response.status, errorText);
      return {
        searchQuery: query,
        location,
        source: 'error',
        places: [],
      };
    }

    const data: SerpAPILocalResponse = await response.json();
    console.log('[searchLocalPlaces] Response data keys:', Object.keys(data));
    console.log('[searchLocalPlaces] Local results count:', data.local_results?.length || 0);

    if (data.error) {
      console.error('[searchLocalPlaces] SerpAPI returned error:', data.error);
      return {
        searchQuery: query,
        location,
        source: 'error',
        places: [],
      };
    }

    const places = (data.local_results || []).slice(0, 10).map((place) => ({
      name: place.title,
      rating: place.rating || null,
      reviews: place.reviews || null,
      price: place.price || '',
      type: place.type || place.types?.join(', ') || '',
      address: place.address || '',
      phone: place.phone || '',
      website: place.website || '',
      hours: place.hours || '',
    }));

    console.log('[searchLocalPlaces] Processed places count:', places.length);
    return {
      searchQuery: query,
      location,
      source: 'google_local',
      places,
    };
  } catch (error) {
    console.error('[searchLocalPlaces] Error:', error);
    return {
      searchQuery: query,
      location,
      source: 'error',
      places: [],
    };
  }
}

// Yelp search for businesses with reviews
interface SerpAPIYelpCategory {
  title: string;
  link?: string;
}

interface SerpAPIYelpResult {
  position?: number;
  title: string;
  link?: string;
  rating?: number;
  reviews?: number;
  price?: string;
  categories?: SerpAPIYelpCategory[];
  neighborhoods?: string | string[];
  snippet?: string;
  phone?: string;
}

interface SerpAPIYelpResponse {
  organic_results?: SerpAPIYelpResult[];
  error?: string;
}

async function searchYelp(query: string, location: string): Promise<{
  businesses: Array<{
    name: string;
    rating: number | null;
    reviews: number | null;
    price: string;
    categories: string;
    neighborhood: string;
    snippet: string;
    phone: string;
    link: string;
  }>;
  searchQuery: string;
  location: string;
  source: string;
}> {
  console.log('[searchYelp] Starting search:', { query, location, hasApiKey: !!SERPAPI_KEY });

  if (!SERPAPI_KEY) {
    console.log('[searchYelp] No API key configured');
    return {
      searchQuery: query,
      location,
      source: 'suggestions',
      businesses: [],
    };
  }

  try {
    // Geocode for more precise location (Yelp works well with city names but coordinates are more precise)
    const coords = await geocodeLocation(location);

    const params = new URLSearchParams({
      engine: 'yelp',
      find_desc: query,
      api_key: SERPAPI_KEY,
    });

    // Yelp's find_loc works with both location names and coordinates
    if (coords) {
      params.set('find_loc', `${coords.lat},${coords.lng}`);
      console.log('[searchYelp] Using GPS coordinates:', `${coords.lat},${coords.lng}`);
    } else {
      params.set('find_loc', location);
      console.log('[searchYelp] Falling back to location string:', location);
    }

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log('[searchYelp] Fetching:', url.replace(SERPAPI_KEY, 'REDACTED'));

    const response = await fetch(url);
    console.log('[searchYelp] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[searchYelp] SerpAPI Yelp error:', response.status, errorText);
      return {
        searchQuery: query,
        location,
        source: 'error',
        businesses: [],
      };
    }

    const data: SerpAPIYelpResponse = await response.json();
    console.log('[searchYelp] Response data keys:', Object.keys(data));
    console.log('[searchYelp] Organic results count:', data.organic_results?.length || 0);

    if (data.error) {
      console.error('[searchYelp] SerpAPI Yelp returned error:', data.error);
      return {
        searchQuery: query,
        location,
        source: 'error',
        businesses: [],
      };
    }

    const businesses = (data.organic_results || []).slice(0, 10).map((biz) => {
      // Handle categories - can be array of objects or strings
      let categoriesStr = '';
      if (biz.categories) {
        categoriesStr = biz.categories.map(c => typeof c === 'string' ? c : c.title).join(', ');
      }

      // Handle neighborhoods - can be string or array
      let neighborhoodStr = '';
      if (biz.neighborhoods) {
        neighborhoodStr = Array.isArray(biz.neighborhoods)
          ? biz.neighborhoods.join(', ')
          : biz.neighborhoods;
      }

      return {
        name: biz.title,
        rating: biz.rating || null,
        reviews: biz.reviews || null,
        price: biz.price || '',
        categories: categoriesStr,
        neighborhood: neighborhoodStr,
        snippet: biz.snippet || '',
        phone: biz.phone || '',
        link: biz.link || '',
      };
    });

    console.log('[searchYelp] Processed businesses count:', businesses.length);
    return {
      searchQuery: query,
      location,
      source: 'yelp',
      businesses,
    };
  } catch (error) {
    console.error('[searchYelp] Error fetching from Yelp via SerpAPI:', error);
    return {
      searchQuery: query,
      location,
      source: 'error',
      businesses: [],
    };
  }
}

// Weather lookup for outdoor planning
interface OpenWeatherResponse {
  weather?: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main?: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  wind?: {
    speed: number;
  };
  name?: string;
  cod?: number | string;
  message?: string;
}

interface WeatherForecastDay {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
  wind: {
    speed: number;
  };
  dt_txt: string;
}

interface OpenWeatherForecastResponse {
  list?: WeatherForecastDay[];
  city?: {
    name: string;
  };
  cod?: number | string;
  message?: string;
}

async function getWeather(location: string): Promise<{
  current: {
    location: string;
    temperature: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    condition: string;
    description: string;
  } | null;
  forecast: Array<{
    date: string;
    temperature: number;
    condition: string;
    description: string;
  }>;
  source: string;
}> {
  if (!OPENWEATHER_API_KEY) {
    return {
      current: null,
      forecast: [],
      source: 'not_configured',
    };
  }

  try {
    // Get current weather
    const currentParams = new URLSearchParams({
      q: location,
      appid: OPENWEATHER_API_KEY,
      units: 'imperial',
    });

    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?${currentParams.toString()}`
    );

    if (!currentResponse.ok) {
      console.error('OpenWeather current error:', currentResponse.status);
      return {
        current: null,
        forecast: [],
        source: 'error',
      };
    }

    const currentData: OpenWeatherResponse = await currentResponse.json();

    if (currentData.cod && currentData.cod !== 200) {
      console.error('OpenWeather returned error:', currentData.message);
      return {
        current: null,
        forecast: [],
        source: 'error',
      };
    }

    // Get 5-day forecast
    const forecastParams = new URLSearchParams({
      q: location,
      appid: OPENWEATHER_API_KEY,
      units: 'imperial',
    });

    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?${forecastParams.toString()}`
    );

    let forecast: Array<{
      date: string;
      temperature: number;
      condition: string;
      description: string;
    }> = [];

    if (forecastResponse.ok) {
      const forecastData: OpenWeatherForecastResponse = await forecastResponse.json();
      // Get one forecast per day (noon)
      const dailyForecasts = (forecastData.list || []).filter((item) =>
        item.dt_txt.includes('12:00:00')
      );
      forecast = dailyForecasts.slice(0, 5).map((day) => ({
        date: new Date(day.dt * 1000).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        temperature: Math.round(day.main.temp),
        condition: day.weather[0]?.main || '',
        description: day.weather[0]?.description || '',
      }));
    }

    return {
      current: {
        location: currentData.name || location,
        temperature: Math.round(currentData.main?.temp || 0),
        feelsLike: Math.round(currentData.main?.feels_like || 0),
        humidity: currentData.main?.humidity || 0,
        windSpeed: Math.round(currentData.wind?.speed || 0),
        condition: currentData.weather?.[0]?.main || '',
        description: currentData.weather?.[0]?.description || '',
      },
      forecast,
      source: 'openweather',
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return {
      current: null,
      forecast: [],
      source: 'error',
    };
  }
}

function ensureApiKeyConfigured() {
  const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();

  if (
    (provider === 'google' || provider === 'gemini') &&
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ) {
    throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY for Gemini provider');
  }

  if (
    (provider === 'anthropic' || provider === 'claude') &&
    !process.env.ANTHROPIC_API_KEY
  ) {
    throw new Error('Missing ANTHROPIC_API_KEY for Anthropic provider');
  }

  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY for OpenAI provider');
  }
}

async function buildContextualPrompt(userId: string): Promise<string> {
  try {
    // Fetch friends with memories for this user
    const friends = await prisma.friend.findMany({
      userId,
      include: { memories: { orderBy: { createdAt: 'desc' } } },
    });

    // Fetch diary notes for this user
    const diaryNotes = await prisma.diaryNote.findMany({ userId });

    // Build context string
    let contextPrompt = '\n\n---CONTEXTUAL INFORMATION---\n';

    if (friends.length > 0) {
      contextPrompt += '\n## Friends and Relationships:\n';
      for (const friend of friends) {
        contextPrompt += `\n### ${friend.name}\n`;
        if (friend.birthday) {
          contextPrompt += `- Birthday: ${friend.birthday.toLocaleDateString()}\n`;
        }
        if (friend.howWeMet) {
          contextPrompt += `- How we met: ${friend.howWeMet}\n`;
        }
        if (friend.lastContact) {
          contextPrompt += `- Last contact: ${formatDistanceToNow(friend.lastContact, { addSuffix: true })}\n`;
        }
        if (friend.notes) {
          contextPrompt += `- Notes: ${friend.notes}\n`;
        }
        // Include interests for activity suggestions
        if ('interests' in friend && friend.interests) {
          const interestsList = parseInterests(friend.interests as string);
          if (interestsList.length > 0) {
            contextPrompt += `- Interests: ${formatInterestsForAI(interestsList)}\n`;
          }
        }

        if ('memories' in friend && Array.isArray(friend.memories) && friend.memories.length > 0) {
          contextPrompt += `- Memories:\n`;
          for (const memory of friend.memories.slice(0, 10)) {
            contextPrompt += `  * ${memory.content} (${formatDistanceToNow(memory.createdAt, { addSuffix: true })})\n`;
          }
        }
      }
    }

    if (diaryNotes.length > 0) {
      contextPrompt += '\n## Recent Diary Entries:\n';
      const recentNotes = diaryNotes.slice(0, 20);
      for (const note of recentNotes) {
        contextPrompt += `\n### ${note.title || 'Untitled'} (${formatDistanceToNow(note.createdAt, { addSuffix: true })})\n`;
        contextPrompt += `${note.content.substring(0, 500)}${note.content.length > 500 ? '...' : ''}\n`;

        if ('friends' in note && Array.isArray(note.friends) && note.friends.length > 0) {
          const friendNames = note.friends.map((f: any) => f.name).join(', ');
          contextPrompt += `Tagged friends: ${friendNames}\n`;
        }
      }
    }

    contextPrompt += '\n---END CONTEXTUAL INFORMATION---\n\n';
    contextPrompt += 'Use this contextual information to provide more personalized and informed responses. You can reference specific friends, memories, and diary entries when relevant to the conversation. Help the user recall important details and provide context-aware suggestions.\n';

    return contextPrompt;
  } catch (error) {
    console.error('Error building contextual prompt:', error);
    return '';
  }
}

// Build context for tagged friends
async function buildTaggedFriendsContext(userId: string, friendIds: string[]): Promise<string> {
  if (!friendIds || friendIds.length === 0) return '';

  try {
    const friends = await prisma.friend.findMany({
      userId,
      include: { memories: { orderBy: { createdAt: 'desc' } } },
    });

    const taggedFriends = friends.filter((f: { id: string }) => friendIds.includes(f.id));
    if (taggedFriends.length === 0) return '';

    let context = '\n\n---TAGGED FRIENDS CONTEXT---\n';
    context += 'The user has tagged the following friends in their message. Use their profiles to provide personalized suggestions:\n';

    for (const friend of taggedFriends as any[]) {
      context += `\n### ${friend.name}\n`;
      if (friend.birthday) {
        context += `- Birthday: ${friend.birthday.toLocaleDateString()}\n`;
      }
      if (friend.howWeMet) {
        context += `- How they met: ${friend.howWeMet}\n`;
      }
      if (friend.notes) {
        context += `- Notes: ${friend.notes}\n`;
      }
      if (friend.interests) {
        const interestsList = parseInterests(friend.interests as string);
        if (interestsList.length > 0) {
          context += `- Interests: ${formatInterestsForAI(interestsList)}\n`;
        }
      }
      if (friend.lastContact) {
        context += `- Last contact: ${formatDistanceToNow(friend.lastContact, { addSuffix: true })}\n`;
      }
      if (friend.memories && friend.memories.length > 0) {
        context += `- Recent memories:\n`;
        for (const memory of friend.memories.slice(0, 5)) {
          context += `  * ${memory.content}\n`;
        }
      }
    }

    context += '\nConsider these friends\' interests and preferences when making suggestions.\n';
    context += '---END TAGGED FRIENDS CONTEXT---\n';

    return context;
  } catch (error) {
    console.error('Error building tagged friends context:', error);
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { messages, sessionId, friendContext, taggedFriendIds, chatTranscript, mentionsAmika } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request body: messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    ensureApiKeyConfigured();

    // Build enhanced system prompt with contextual information for this user
    const contextualInfo = await buildContextualPrompt(userId);
    let enhancedSystemPrompt = systemPrompt + contextualInfo;

    // If friend context is provided (from Find Events dialog), add it to help personalize suggestions
    if (friendContext && typeof friendContext === 'string' && friendContext.trim()) {
      enhancedSystemPrompt += `\n\n---PLANNING CONTEXT---\nThe user is planning activities with specific friends. Use their interests and notes to suggest relevant activities:\n${friendContext}\n\nWhen suggesting activities, consider these friends' interests and preferences. Prioritize suggestions that would appeal to them based on the notes provided.\n---END PLANNING CONTEXT---\n`;
    }

    // Add context for tagged friends (@friend mentions)
    if (taggedFriendIds && Array.isArray(taggedFriendIds) && taggedFriendIds.length > 0) {
      const taggedFriendsContext = await buildTaggedFriendsContext(userId, taggedFriendIds);
      enhancedSystemPrompt += taggedFriendsContext;
    }

    // If @amika is mentioned and chat transcript is provided, include it for context
    if (mentionsAmika && chatTranscript && Array.isArray(chatTranscript) && chatTranscript.length > 0) {
      enhancedSystemPrompt += '\n\n---CONVERSATION CONTEXT---\n';
      enhancedSystemPrompt += 'The user has mentioned you (@amika) in their message. Here is the full conversation history for context:\n\n';
      for (const msg of chatTranscript) {
        const role = msg.role === 'user' ? 'User' : 'Amika';
        enhancedSystemPrompt += `${role}: ${msg.content}\n\n`;
      }
      enhancedSystemPrompt += 'Use this conversation history to provide relevant and contextual responses.\n';
      enhancedSystemPrompt += '---END CONVERSATION CONTEXT---\n';
    }

    // Store chat transcript if sessionId is provided
    if (sessionId) {
      try {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          await prisma.chatTranscript.create({
            data: {
              userId,
              sessionId,
              role: latestMessage.role,
              content: latestMessage.content,
            },
          });
        }
      } catch (error) {
        console.error('Error storing chat transcript:', error);
        // Continue even if storing fails
      }
    }

    const result = await streamText({
      // @ts-expect-error - AI SDK providers return different model types (V1/V3) but all work with streamText
      model: getModel(),
      system: enhancedSystemPrompt,
      messages,
      tools: {
        searchEvents: tool({
          description: 'Search for local events, activities, concerts, festivals, or things to do in a specific area. Use this when the user asks about events, activities, or things to do. Always try to use this tool when the user is looking for events or activities.',
          parameters: z.object({
            query: z.string().describe('The search query for events (e.g., "concerts", "outdoor activities", "art exhibitions", "food festivals")'),
            location: z.string().optional().describe('The location to search for events (e.g., "San Francisco", "New York", "Los Angeles")'),
          }),
          execute: async ({ query, location }) => {
            const result = await searchGoogleEvents(query, location);

            if (result.source === 'google_events' && result.events.length > 0) {
              return {
                searchQuery: result.searchQuery,
                source: 'Google Events',
                events: result.events,
                note: 'Here are real events I found. You can add any of these to your calendar!',
              };
            }

            // Fallback when no API key or no results
            return {
              searchQuery: result.searchQuery,
              source: 'suggestions',
              events: [],
              note: 'I couldn\'t find specific events, but here are some suggestions for finding events:',
              suggestions: [
                'Check Eventbrite for local events and festivals',
                'Look at Meetup.com for group activities',
                'Search Facebook Events for community gatherings',
                'Visit local venue websites for concerts and shows',
              ],
            };
          },
        }),
        searchMovies: tool({
          description: 'Search for movies playing in theaters near a location. Use this when the user asks about movies, films, showtimes, or wants to go to the cinema/theater. This returns currently playing movies with showtimes at nearby theaters.',
          parameters: z.object({
            query: z.string().optional().describe('Optional search query for specific movies or genres (e.g., "A24 movies", "horror", "comedy"). Leave empty to see all movies playing.'),
            location: z.string().describe('The location to search for movie theaters (e.g., "Campbell, CA", "San Francisco", "Los Angeles")'),
          }),
          execute: async ({ query, location }) => {
            const result = await searchMovies(query || '', location);

            if (result.source === 'google_showtimes' && result.movies.length > 0) {
              return {
                searchQuery: result.searchQuery,
                location: result.location,
                source: 'Google Showtimes',
                movies: result.movies,
                note: 'Here are movies currently playing near you with showtimes!',
              };
            }

            // Fallback when no API key or no results
            return {
              searchQuery: result.searchQuery,
              location: result.location,
              source: 'suggestions',
              movies: [],
              note: 'I couldn\'t find specific showtimes, but here are some suggestions for finding movies:',
              suggestions: [
                'Check Fandango for local showtimes',
                'Visit AMC, Regal, or Cinemark websites',
                'Look for independent theaters like Landmark or Alamo Drafthouse',
                'Check Google for "movies near me"',
              ],
            };
          },
        }),
        searchPlaces: tool({
          description: 'Search for local places like parks, bowling alleys, movie theaters, gyms, museums, or other activity venues using Google Local. DO NOT use this for restaurants, bars, cafes, or food - use searchYelpReviews instead for all food and dining queries.',
          parameters: z.object({
            query: z.string().describe('What to search for (e.g., "bowling alleys", "hiking trails", "museums", "gyms", "parks")'),
            location: z.string().describe('The location to search in (e.g., "Campbell, CA", "San Francisco", "Downtown San Jose")'),
          }),
          execute: async ({ query, location }) => {
            const result = await searchLocalPlaces(query, location);

            if (result.source === 'google_local' && result.places.length > 0) {
              return {
                searchQuery: result.searchQuery,
                location: result.location,
                source: 'Google Local',
                places: result.places,
                note: 'Here are some places I found that match your search!',
              };
            }

            return {
              searchQuery: result.searchQuery,
              location: result.location,
              source: 'suggestions',
              places: [],
              note: 'I couldn\'t find specific places, but try searching on Google Maps or Yelp.',
            };
          },
        }),
        searchYelpReviews: tool({
          description: 'ALWAYS use this tool for restaurants, bars, cafes, food, and dining recommendations. Search Yelp for businesses with detailed reviews, ratings, and snippets. This is the PRIMARY tool for any food-related or restaurant queries.',
          parameters: z.object({
            query: z.string().describe('What to search for (e.g., "indian restaurants", "best pizza", "sushi", "cocktail bars", "coffee shops", "brunch spots", "happy hour")'),
            location: z.string().describe('The location to search in (e.g., "San Jose, CA", "Campbell, CA", "San Francisco")'),
          }),
          execute: async ({ query, location }) => {
            const result = await searchYelp(query, location);

            if (result.source === 'yelp' && result.businesses.length > 0) {
              return {
                searchQuery: result.searchQuery,
                location: result.location,
                source: 'Yelp',
                businesses: result.businesses,
                note: 'Here are Yelp-reviewed businesses matching your search!',
              };
            }

            return {
              searchQuery: result.searchQuery,
              location: result.location,
              source: 'suggestions',
              businesses: [],
              note: 'I couldn\'t find Yelp results, but try searching directly on Yelp.com.',
            };
          },
        }),
        getWeather: tool({
          description: 'Get current weather and 5-day forecast for a location. Use this when planning outdoor activities, or when the user asks about weather conditions.',
          parameters: z.object({
            location: z.string().describe('The city or location to get weather for (e.g., "San Francisco", "Campbell, CA", "New York")'),
          }),
          execute: async ({ location }) => {
            const result = await getWeather(location);

            if (result.source === 'openweather' && result.current) {
              return {
                location: result.current.location,
                source: 'OpenWeather',
                current: {
                  temperature: `${result.current.temperature}°F`,
                  feelsLike: `${result.current.feelsLike}°F`,
                  humidity: `${result.current.humidity}%`,
                  windSpeed: `${result.current.windSpeed} mph`,
                  condition: result.current.condition,
                  description: result.current.description,
                },
                forecast: result.forecast.map((day) => ({
                  date: day.date,
                  temperature: `${day.temperature}°F`,
                  condition: day.condition,
                  description: day.description,
                })),
                note: 'Here\'s the current weather and forecast to help you plan!',
              };
            }

            if (result.source === 'not_configured') {
              return {
                location,
                source: 'not_configured',
                note: 'Weather API is not configured. Check weather.com or your phone\'s weather app for current conditions.',
              };
            }

            return {
              location,
              source: 'error',
              note: 'I couldn\'t fetch weather data. Try checking weather.com or Google for current conditions.',
            };
          },
        }),
      },
      maxSteps: 3,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error('Chat streaming error:', error);
        return error instanceof Error ? error.message : 'Unknown streaming error';
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Missing ') ? 400 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
