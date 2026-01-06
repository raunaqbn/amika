import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Get events with an Amika friend
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: amikaFriendId } = await params;

    // Verify this user is connected with the Amika friend
    const isConnected = await prisma.userConnection.areConnected(userId, amikaFriendId);
    if (!isConnected) {
      return NextResponse.json({ error: 'Not connected with this user' }, { status: 403 });
    }

    const events = await prisma.event.findManyByAmikaFriend({
      userId,
      amikaFriendUserId: amikaFriendId,
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// Create an event with an Amika friend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: amikaFriendId } = await params;
    const body = await request.json();
    const { title, description, eventDate, location, category, sharedWithAmikaFriend, completed } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ error: 'Title and event date are required' }, { status: 400 });
    }

    const event = await prisma.event.createForAmikaFriend({
      data: {
        userId,
        amikaFriendUserId: amikaFriendId,
        title,
        description: description || null,
        eventDate: new Date(eventDate),
        location: location || null,
        category: category || null,
        sharedWithAmikaFriend: sharedWithAmikaFriend || false,
        completed: completed || false,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    const message = error instanceof Error ? error.message : 'Failed to create event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update an event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, title, description, eventDate, location, category, sharedWithAmikaFriend, completed } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const event = await prisma.event.updateForAmikaFriend({
      where: { id: eventId, userId },
      data: {
        title,
        description,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        location,
        category,
        sharedWithAmikaFriend,
        completed,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

// Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id: eventId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
