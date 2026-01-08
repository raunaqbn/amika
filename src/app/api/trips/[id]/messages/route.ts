import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { streamText, tool } from 'ai';
import { getModel } from '@/lib/ai';
import { z } from 'zod';
import { formatInterestsForAI, parseInterests } from '@/lib/interests';

export const dynamic = 'force-dynamic';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

// GET /api/trips/[id]/messages - Get messages
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

    const messages = await prisma.tripMessage.findMany(id, userId, {
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

// POST /api/trips/[id]/messages - Send message (detect @amika for AI response)
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
    const userMessage = await prisma.tripMessage.create(id, {
      content,
      context,
      role: 'user',
    }, userId);

    // Check if the message mentions @amika or @Amika
    const mentionsAmika = /@amika/i.test(content);

    if (mentionsAmika) {
      // Get trip context for AI
      const trip = await prisma.tripSession.findById(id, userId);
      if (!trip) {
        return NextResponse.json({ userMessage });
      }

      // Build AI context with collaborator interests
      const collaboratorDetails = trip.collaborators.map((c: any) => {
        const interests = parseInterests(c.interests);
        const interestsText = interests.length > 0
          ? formatInterestsForAI(interests)
          : 'no specific interests listed';
        return `- ${c.friendName}: ${interestsText}`;
      }).join('\n');

      const collaboratorNames = trip.collaborators.map((c: any) => c.friendName).join(', ');

      const tripContext = `
Trip: ${trip.title}
${trip.description ? `Description: ${trip.description}` : ''}
Location: ${trip.location || 'Not yet decided'}
Dates: ${trip.startDate ? `${trip.startDate.toLocaleDateString()} - ${trip.endDate?.toLocaleDateString() || 'TBD'}` : 'Not yet decided'}
Collaborators: ${collaboratorNames || 'Just the organizer'}
Current section: ${context}
      `.trim();

      // Build collaborator interests section for personalized suggestions
      const collaboratorInterestsSection = trip.collaborators.length > 0
        ? `\n\n## Group Member Interests\nUse these interests to make personalized suggestions that the group will enjoy:\n${collaboratorDetails}`
        : '';

      const systemPrompt = `You are Amika, a helpful AI assistant helping plan a collaborative trip. You're friendly, concise, and practical.

${tripContext}${collaboratorInterestsSection}

Help the group with their trip planning by:
- Suggesting activities and places based on the destination AND the group's shared interests
- Finding common interests among collaborators to suggest activities everyone will enjoy
- Helping decide on dates
- Recommending restaurants and experiences that match the group's preferences
- Providing practical travel tips
- Being inclusive of all collaborators' preferences

When making suggestions, consider what activities might appeal to multiple group members based on their interests. Highlight when a suggestion matches specific members' interests.

Keep responses concise and actionable. If suggesting activities, format them clearly so they can be easily added to the itinerary.
When you suggest specific events or places, format them with **bold** titles so they can be recognized.`;

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
              description: 'Search for places like parks, museums, attractions (NOT restaurants)',
              parameters: z.object({
                query: z.string().describe('Type of place to search for'),
                location: z.string().describe('City or location to search in'),
              }),
              execute: async ({ query, location }) => {
                try {
                  const searchQuery = `${query} in ${location}`;
                  const response = await fetch(
                    `https://serpapi.com/search.json?engine=google_local&q=${encodeURIComponent(searchQuery)}&api_key=${SERPAPI_KEY}`
                  );
                  const data = await response.json();
                  return {
                    places: data.local_results?.slice(0, 5).map((p: any) => ({
                      title: p.title,
                      rating: p.rating,
                      reviews: p.reviews,
                      address: p.address,
                      type: p.type,
                    })) || [],
                  };
                } catch {
                  return { places: [], error: 'Could not search places' };
                }
              },
            }),
            searchRestaurants: tool({
              description: 'Search for restaurants, cafes, bars with reviews',
              parameters: z.object({
                query: z.string().describe('Type of cuisine or restaurant'),
                location: z.string().describe('City or location to search in'),
              }),
              execute: async ({ query, location }) => {
                try {
                  const searchQuery = `${query} restaurants ${location}`;
                  const response = await fetch(
                    `https://serpapi.com/search.json?engine=yelp&find_desc=${encodeURIComponent(query)}&find_loc=${encodeURIComponent(location)}&api_key=${SERPAPI_KEY}`
                  );
                  const data = await response.json();
                  return {
                    restaurants: data.organic_results?.slice(0, 5).map((r: any) => ({
                      name: r.title,
                      rating: r.rating,
                      reviews: r.reviews,
                      price: r.price,
                      categories: r.categories,
                      address: r.address,
                    })) || [],
                  };
                } catch {
                  return { restaurants: [], error: 'Could not search restaurants' };
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
        const aiMessage = await prisma.tripMessage.create(id, {
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
    if (error.message === 'Trip not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
