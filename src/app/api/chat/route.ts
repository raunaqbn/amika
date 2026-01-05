import { streamText, tool } from 'ai';
import { getModel, systemPrompt } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { formatDistanceToNow } from 'date-fns';
import { z } from 'zod';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

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

async function buildContextualPrompt(): Promise<string> {
  try {
    // Fetch friends with memories
    const friends = await prisma.friend.findMany({
      include: { memories: { orderBy: { createdAt: 'desc' } } },
    });

    // Fetch diary notes with tags
    const diaryNotes = await prisma.diaryNote.findMany();

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

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid request body: messages must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    ensureApiKeyConfigured();

    // Build enhanced system prompt with contextual information
    const contextualInfo = await buildContextualPrompt();
    const enhancedSystemPrompt = systemPrompt + contextualInfo;

    // Store chat transcript if sessionId is provided
    if (sessionId) {
      try {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage) {
          await prisma.chatTranscript.create({
            data: {
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
