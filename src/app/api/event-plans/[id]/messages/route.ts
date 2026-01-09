import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { streamText, tool } from 'ai';
import { getModel } from '@/lib/ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Geocode a location string to GPS coordinates for more precise SerpAPI searches
async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_PLACES_API_KEY) {
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
      return null;
    }

    const data = await response.json();

    if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
}

// GET /api/event-plans/[id]/messages - Get messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || undefined;
    const since = searchParams.get('since');

    const messages = await prisma.eventPlanMessage.findMany(id, userId, {
      context,
      since: since ? new Date(since) : undefined,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/event-plans/[id]/messages - Send message (detect @amika for AI response)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, context = 'general' } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Save the user's message
    const userMessage = await prisma.eventPlanMessage.create(id, {
      content,
      context,
      role: 'user',
    }, userId);

    // Check if the message mentions @amika or @Amika
    const mentionsAmika = /@amika/i.test(content);

    if (mentionsAmika) {
      // Get event plan context for AI
      const eventPlan = await prisma.eventPlanSession.findById(id, userId);
      if (!eventPlan) {
        return NextResponse.json({ userMessage });
      }

      // Build AI context
      const collaboratorNames = eventPlan.collaborators.map((c: any) => c.friendName).join(', ');
      const candidatesList = eventPlan.candidates.map((c: any) => c.title).join(', ');
      const eventPlanContext = `
Event Plan: ${eventPlan.title}
${eventPlan.description ? `Description: ${eventPlan.description}` : ''}
Event Date: ${eventPlan.eventDate ? eventPlan.eventDate.toLocaleDateString() : 'Not yet decided'}
Event Time: ${eventPlan.eventTime || 'Not yet decided'}
Event Candidates: ${candidatesList || 'None added yet'}
Collaborators: ${collaboratorNames || 'Just the organizer'}
Current section: ${context}
      `.trim();

      const systemPrompt = `You are Amika, a helpful AI assistant helping plan a group event. You're friendly, concise, and practical.

${eventPlanContext}

Help the group with their event planning by:
- Suggesting events based on their interests
- Helping decide on dates and times
- Recommending venues and experiences
- Providing practical tips
- Being inclusive of all collaborators' preferences

Keep responses concise and actionable. If suggesting events or venues, format them with **bold** titles so they can be recognized.`;

      try {
        // Generate AI response
        const result = await streamText({
          model: getModel() as any,
          system: systemPrompt,
          messages: [{ role: 'user', content: content.replace(/@amika/gi, '').trim() }],
          tools: SERPAPI_KEY ? {
            searchEvents: tool({
              description: 'Search for events, activities, concerts, festivals happening in a location',
              parameters: z.object({
                query: z.string().describe('Search query for events'),
                location: z.string().describe('City or location to search in'),
              }),
              execute: async ({ query, location }) => {
                try {
                  const searchQuery = `${query} ${location}`;
                  const response = await fetch(
                    `https://serpapi.com/search.json?engine=google_events&q=${encodeURIComponent(searchQuery)}&api_key=${SERPAPI_KEY}`
                  );
                  const data = await response.json();
                  return {
                    events: data.events_results?.slice(0, 5).map((e: any) => ({
                      title: e.title,
                      date: e.date?.start_date,
                      venue: e.venue?.name,
                      address: e.address,
                      link: e.link,
                    })) || [],
                  };
                } catch {
                  return { events: [], error: 'Could not search events' };
                }
              },
            }),
            searchPlaces: tool({
              description: 'Search for venues like theaters, arenas, parks, bowling alleys, museums (NOT restaurants - use searchYelpReviews for food)',
              parameters: z.object({
                query: z.string().describe('Type of venue to search for'),
                location: z.string().describe('City or location to search in'),
              }),
              execute: async ({ query, location }) => {
                try {
                  const coords = await geocodeLocation(location);
                  const params = new URLSearchParams({
                    engine: 'google_local',
                    q: query,
                    api_key: SERPAPI_KEY!,
                  });
                  if (coords) {
                    params.set('ll', `@${coords.lat},${coords.lng},14z`);
                  } else {
                    params.set('location', location);
                  }
                  const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
                  const data = await response.json();
                  return {
                    places: data.local_results?.slice(0, 5).map((p: any) => ({
                      title: p.title,
                      rating: p.rating,
                      reviews: p.reviews,
                      address: p.address,
                      type: p.type,
                      phone: p.phone || '',
                      website: p.website || '',
                    })) || [],
                  };
                } catch {
                  return { places: [], error: 'Could not search places' };
                }
              },
            }),
            searchYelpReviews: tool({
              description: 'ALWAYS use this tool for restaurants, bars, cafes, food, and dining recommendations. Search Yelp for businesses with detailed reviews, ratings, and snippets. This is the PRIMARY tool for any food-related or restaurant queries.',
              parameters: z.object({
                query: z.string().describe('What to search for (e.g., "indian restaurants", "best pizza", "sushi", "cocktail bars", "coffee shops", "brunch spots", "jalebi")'),
                location: z.string().describe('The location to search in (e.g., "Sunnyvale, CA", "San Jose, CA", "San Francisco")'),
              }),
              execute: async ({ query, location }) => {
                try {
                  const coords = await geocodeLocation(location);
                  const params = new URLSearchParams({
                    engine: 'yelp',
                    find_desc: query,
                    api_key: SERPAPI_KEY!,
                  });
                  if (coords) {
                    params.set('find_loc', `${coords.lat},${coords.lng}`);
                  } else {
                    params.set('find_loc', location);
                  }
                  const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
                  const data = await response.json();
                  return {
                    businesses: data.organic_results?.slice(0, 8).map((biz: any) => ({
                      name: biz.title,
                      rating: biz.rating || null,
                      reviews: biz.reviews || null,
                      price: biz.price || '',
                      categories: biz.categories?.map((c: any) => typeof c === 'string' ? c : c.title).join(', ') || '',
                      neighborhood: Array.isArray(biz.neighborhoods) ? biz.neighborhoods.join(', ') : (biz.neighborhoods || ''),
                      snippet: biz.snippet || '',
                      phone: biz.phone || '',
                      link: biz.link || '',
                    })) || [],
                  };
                } catch {
                  return { businesses: [], error: 'Could not search restaurants' };
                }
              },
            }),
            searchMovies: tool({
              description: 'Search for movies playing in theaters near a location. Use this when the user asks about movies, films, or showtimes.',
              parameters: z.object({
                query: z.string().optional().describe('Optional search query for specific movies or genres'),
                location: z.string().describe('The location to search for movie theaters'),
              }),
              execute: async ({ query, location }) => {
                try {
                  const coords = await geocodeLocation(location);
                  const params = new URLSearchParams({
                    engine: 'google_showtimes',
                    q: query || 'movies',
                    api_key: SERPAPI_KEY!,
                    hl: 'en',
                  });
                  if (coords) {
                    params.set('location', `${coords.lat},${coords.lng}`);
                  } else {
                    params.set('location', location);
                  }
                  const response = await fetch(`https://serpapi.com/search?${params.toString()}`);
                  const data = await response.json();
                  return {
                    movies: data.showtimes?.slice(0, 6).map((movie: any) => ({
                      name: movie.name,
                      description: movie.description || '',
                      duration: movie.duration || '',
                      genre: movie.genre?.join(', ') || '',
                      rating: movie.rating || '',
                      theaters: (movie.theaters || []).slice(0, 2).map((theater: any) => ({
                        name: theater.name,
                        showtimes: theater.showing?.flatMap((s: any) => s.time) || [],
                      })),
                    })) || [],
                  };
                } catch {
                  return { movies: [], error: 'Could not search movies' };
                }
              },
            }),
            getWeather: tool({
              description: 'Get current weather and forecast for a location. Use this when planning outdoor activities or events.',
              parameters: z.object({
                location: z.string().describe('The city or location to get weather for'),
              }),
              execute: async ({ location }) => {
                if (!OPENWEATHER_API_KEY) {
                  return { error: 'Weather API not configured' };
                }
                try {
                  const params = new URLSearchParams({
                    q: location,
                    appid: OPENWEATHER_API_KEY,
                    units: 'imperial',
                  });
                  const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?${params.toString()}`
                  );
                  const data = await response.json();
                  if (data.cod && data.cod !== 200) {
                    return { error: 'Could not get weather' };
                  }
                  return {
                    location: data.name || location,
                    temperature: `${Math.round(data.main?.temp || 0)}°F`,
                    feelsLike: `${Math.round(data.main?.feels_like || 0)}°F`,
                    humidity: `${data.main?.humidity || 0}%`,
                    condition: data.weather?.[0]?.main || '',
                    description: data.weather?.[0]?.description || '',
                  };
                } catch {
                  return { error: 'Could not get weather' };
                }
              },
            }),
          } : undefined,
          maxSteps: 3,
        });

        // Collect the full response
        let aiResponse = '';
        for await (const chunk of result.textStream) {
          aiResponse += chunk;
        }

        // Save AI response
        const aiMessage = await prisma.eventPlanMessage.create(id, {
          content: aiResponse,
          context,
          role: 'assistant',
        }, userId);

        return NextResponse.json({ userMessage, aiMessage });
      } catch (aiError) {
        console.error('AI error:', aiError);
        // Return just the user message if AI fails
        return NextResponse.json({ userMessage });
      }
    }

    return NextResponse.json({ userMessage });
  } catch (error: any) {
    console.error('Error creating message:', error);
    if (error.message === 'Event plan not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
