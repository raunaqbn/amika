import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { streamText, tool } from 'ai';
import { getModel } from '@/lib/ai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

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
              description: 'Search for venues like theaters, arenas, parks, bars (NOT restaurants)',
              parameters: z.object({
                query: z.string().describe('Type of venue to search for'),
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
