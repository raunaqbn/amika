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

// PUT /api/events - Update an event
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, eventDate, location, category, completed, friendId, friendIds } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

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

    const updatedEvent = await prisma.event.update({
      where: { id, userId },
      data: updateData,
    });

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
