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

    // For Amika friends (those with linkedUserId), fetch their actual user interests
    const amikaFriendUserIds = taggedFriends
      .filter((f: any) => f.linkedUserId)
      .map((f: any) => f.linkedUserId as string);

    const amikaUserInterests: Record<string, string[]> = {};
    for (const linkedUserId of amikaFriendUserIds) {
      try {
        const linkedUser = await prisma.user.findById(linkedUserId);
        if (linkedUser?.interests) {
          amikaUserInterests[linkedUserId] = parseInterests(linkedUser.interests);
        }
      } catch {
        // Skip if user not found
      }
    }

    let context = '\n\n## Tagged Friends\nThe user has tagged these friends. Consider their profiles for personalized suggestions:\n';

    for (const friend of taggedFriends as any[]) {
      context += `\n### ${friend.name}\n`;
      if (friend.notes) {
        context += `- Notes: ${friend.notes}\n`;
      }
      // For Amika friends, use their actual User.interests; otherwise use Friend.interests
      let interestsList: string[] = [];
      if (friend.linkedUserId && amikaUserInterests[friend.linkedUserId]) {
        // Use the Amika user's actual interests
        interestsList = amikaUserInterests[friend.linkedUserId];
      } else if (friend.interests) {
        // Fall back to Friend.interests (notes about the friend)
        interestsList = parseInterests(friend.interests as string);
      }
      if (interestsList.length > 0) {
        context += `- Interests: ${formatInterestsForAI(interestsList)}\n`;
      }
      if (friend.memories && friend.memories.length > 0) {
        context += `- Recent memories:\n`;
        for (const memory of friend.memories.slice(0, 3)) {
          context += `  * ${memory.content}\n`;
        }
      }
    }

    return context;
  } catch (error) {
    console.error('Error building tagged friends context:', error);
    return '';
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
    const { content, context = 'general', taggedFriendIds, chatTranscript } = body;

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

    // Get trip details for notifications
    const tripForNotify = await prisma.tripSession.findById(id, userId);
    if (tripForNotify) {
      // Get sender's name
      const sender = await prisma.user.findById(userId);
      const senderName = sender?.name || 'Someone';
      const messagePreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

      // Notify all collaborators with linked Amika accounts (except the sender)
      const recipientUserIds = new Set<string>();

      // Add collaborators with userId or linkedUserId (linkedUserId is from the friends table and may be more up-to-date)
      for (const collab of tripForNotify.collaborators) {
        const recipientId = collab.userId || collab.linkedUserId;
        if (recipientId && recipientId !== userId) {
          recipientUserIds.add(recipientId);
        }
      }

      // Add owner if not the sender
      if (tripForNotify.userId !== userId) {
        recipientUserIds.add(tripForNotify.userId);
      }

      // Create notifications for each recipient
      for (const recipientId of recipientUserIds) {
        try {
          await prisma.chatNotification.createOrUpdate({
            recipientUserId: recipientId,
            senderUserId: userId,
            senderName,
            chatType: 'trip',
            chatId: id,
            chatTitle: tripForNotify.title,
            messagePreview,
          });
        } catch (notifError) {
          console.error('Failed to create chat notification:', notifError);
        }
      }
    }

    // Check if the message mentions @amika or @Amika
    const mentionsAmika = /@amika/i.test(content);

    if (mentionsAmika) {
      // Get trip context for AI
      const trip = await prisma.tripSession.findById(id, userId);
      if (!trip) {
        return NextResponse.json({ userMessage });
      }

      // For Amika collaborators (those with linkedUserId), fetch their actual user interests
      const amikaCollaboratorUserIds = trip.collaborators
        .filter((c: any) => c.linkedUserId)
        .map((c: any) => c.linkedUserId as string);

      const amikaUserInterests: Record<string, string[]> = {};
      for (const linkedUserId of amikaCollaboratorUserIds) {
        try {
          const linkedUser = await prisma.user.findById(linkedUserId);
          if (linkedUser?.interests) {
            amikaUserInterests[linkedUserId] = parseInterests(linkedUser.interests);
          }
        } catch {
          // Skip if user not found
        }
      }

      // Build AI context with collaborator interests
      const collaboratorDetails = trip.collaborators.map((c: any) => {
        // For Amika collaborators, use their actual User.interests; otherwise use Friend.interests
        let interests: string[] = [];
        if (c.linkedUserId && amikaUserInterests[c.linkedUserId]) {
          interests = amikaUserInterests[c.linkedUserId];
        } else {
          interests = parseInterests(c.interests);
        }
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

      // Build tagged friends context if any friends are tagged
      let taggedFriendsSection = '';
      if (taggedFriendIds && Array.isArray(taggedFriendIds) && taggedFriendIds.length > 0) {
        taggedFriendsSection = await buildTaggedFriendsContext(userId, taggedFriendIds);
      }

      // Build chat transcript context if provided
      let chatTranscriptSection = '';
      if (chatTranscript && Array.isArray(chatTranscript) && chatTranscript.length > 0) {
        chatTranscriptSection = '\n\n## Conversation History\nHere is the recent conversation for context:\n';
        for (const msg of chatTranscript.slice(-10)) { // Last 10 messages
          const role = msg.role === 'user' ? 'User' : 'Amika';
          chatTranscriptSection += `${role}: ${msg.content}\n\n`;
        }
      }

      const systemPrompt = `You are Amika, a helpful AI assistant helping plan a collaborative trip. You're friendly, concise, and practical.

${tripContext}${collaboratorInterestsSection}${taggedFriendsSection}${chatTranscriptSection}

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

        // Collect the full response and tool results
        let aiResponse = '';
        for await (const chunk of result.textStream) {
          aiResponse += chunk;
        }

        // Collect tool results for card rendering
        const toolResults: any[] = [];
        const steps = await result.steps;
        for (const step of steps) {
          if (step.toolResults) {
            for (const toolResult of step.toolResults) {
              toolResults.push({
                toolName: toolResult.toolName,
                result: toolResult.result,
              });
            }
          }
        }

        // Save AI response with tool results
        const aiMessage = await prisma.tripMessage.create(id, {
          content: aiResponse,
          context,
          role: 'assistant',
          toolResults: toolResults.length > 0 ? JSON.stringify(toolResults) : null,
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

// DELETE /api/trips/[id]/messages - Clear all messages (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deletedCount = await prisma.tripMessage.deleteMany(id, userId);

    return NextResponse.json({ success: true, deletedCount });
  } catch (error: any) {
    console.error('Error clearing messages:', error);
    if (error.message === 'Only the trip owner can clear the chat') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to clear messages' },
      { status: 500 }
    );
  }
}
