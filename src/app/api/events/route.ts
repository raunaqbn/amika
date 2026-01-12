import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/events - Fetch all events or events for a specific friend
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    const events = friendId
      ? await prisma.event.findMany({ userId, where: { friendId } })
      : await prisma.event.findMany({ userId });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, eventDate, location, category, friendId, friendIds, sharedWithFriend } = body;

    // Support both single friendId and multiple friendIds
    const allFriendIds: string[] = friendIds || (friendId ? [friendId] : []);
    const primaryFriendId = friendId || allFriendIds[0];

    if (!title || !eventDate || !primaryFriendId) {
      return NextResponse.json(
        { error: 'Title, event date, and at least one friend are required' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        userId,
        title,
        description: description || null,
        eventDate: new Date(eventDate),
        location: location || null,
        category: category || null,
        friendId: primaryFriendId,
        friendIds: allFriendIds,
        sharedWithFriend: sharedWithFriend || false,
      },
    });

    // Auto-share with Amika friends if sharing is enabled
    if (sharedWithFriend) {
      try {
        // Get all friends involved in this event
        const friends = await prisma.friend.findMany({ userId });

        // Find Amika friends and share the event with them
        for (const fId of allFriendIds) {
          const friend = friends.find((f: { id: string }) => f.id === fId);
          if (friend && friend.linkedUserId) {
            try {
              await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'event',
                itemId: event.id,
                message: undefined,
              });
            } catch (shareError) {
              // Ignore duplicate share errors
              console.error('Error sharing event with friend:', shareError);
            }
          }
        }
      } catch (shareError) {
        console.error('Error auto-sharing event:', shareError);
      }
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// Point system for events based on bonding potential and time/energy investment
const EVENT_POINTS: Record<string, number> = {
  fitness: 25,       // High commitment, shared physical activity
  experiences: 20,   // Unique bonding, memorable moments
  places: 15,        // Travel/exploration together
  restaurants: 10,   // Social dining, casual bonding
  virtual: 5,        // Phone calls, video chats - lower investment
  default: 10,       // Uncategorized events
};

function getEventPoints(category: string | null): number {
  return EVENT_POINTS[category || 'default'] || EVENT_POINTS.default;
}

// PUT /api/events - Update an event
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, eventDate, location, category, completed, friendId, friendIds, sharedWithFriend } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Get the current event to check if it's being marked as complete for the first time
    const existingEvents = await prisma.event.findMany({ userId, includeFriends: true });
    const existingEvent = existingEvents.find((e: { id: string }) => e.id === id);
    const wasNotCompleted = existingEvent && !existingEvent.completed;

    // Build update data
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate);
    if (location !== undefined) updateData.location = location;
    if (category !== undefined) updateData.category = category;
    if (completed !== undefined) updateData.completed = completed;
    if (friendId !== undefined) updateData.friendId = friendId;
    if (friendIds !== undefined) updateData.friendIds = friendIds;
    if (sharedWithFriend !== undefined) updateData.sharedWithFriend = sharedWithFriend;

    const updatedEvent = await prisma.event.update({
      where: { id, userId },
      data: updateData,
    });

    // Handle sharing with Amika friends
    if (sharedWithFriend && friendIds) {
      try {
        // Get all friends involved in this event
        const friends = await prisma.friend.findMany({ userId });

        // Find Amika friends and share the event with them
        for (const fId of friendIds) {
          const friend = friends.find((f: { id: string }) => f.id === fId);
          if (friend && friend.linkedUserId) {
            try {
              await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'event',
                itemId: updatedEvent.id,
                message: undefined,
              });
            } catch (shareError) {
              // Ignore duplicate share errors (already shared)
              console.error('Error sharing event with friend:', shareError);
            }
          }
        }
      } catch (shareError) {
        console.error('Error auto-sharing event:', shareError);
      }
    }

    // Send points notifications to all participants when event is marked as complete
    if (completed === true && wasNotCompleted && existingEvent) {
      try {
        // Get all friends to find their linkedUserId
        const allFriends = await prisma.friend.findMany({ userId });

        // Get all participating friends (primary + additional from event_friends)
        const participatingFriendIds = new Set<string>();
        participatingFriendIds.add(existingEvent.friendId);

        // Add friends from the event's friends array
        if (existingEvent.friends && Array.isArray(existingEvent.friends)) {
          for (const f of existingEvent.friends) {
            participatingFriendIds.add(f.id);
          }
        }

        // Calculate points for this event
        const eventCategory = existingEvent.category || category || 'default';
        const points = getEventPoints(eventCategory);

        // Notify each Amika friend who participated
        for (const participantId of participatingFriendIds) {
          const friend = allFriends.find((f: { id: string }) => f.id === participantId);
          if (friend && friend.linkedUserId) {
            try {
              await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'points',
                itemId: id, // Reference to the event
                message: `You earned ${points} friendship points for completing "${existingEvent.title}"!`,
                skipConnectionCheck: true, // Allow notifications even without explicit connection
              });
            } catch (notifyError) {
              // Ignore errors (may already be notified)
              console.error('Error sending points notification:', notifyError);
            }
          }
        }
      } catch (notifyError) {
        console.error('Error notifying participants of points:', notifyError);
      }
    }

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error('Error updating event:', error);
    if (error.message === 'Event not found') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/events - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    await prisma.event.delete({ where: { id, userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
