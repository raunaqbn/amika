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
    const { title, description, eventDate, location, friendId } = body;

    if (!title || !eventDate || !friendId) {
      return NextResponse.json(
        { error: 'Title, event date, and friend ID are required' },
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
        friendId,
      },
    });

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
    const { id, title, description, eventDate, location, completed } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id, userId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(eventDate !== undefined && { eventDate: new Date(eventDate) }),
        ...(location !== undefined && { location }),
        ...(completed !== undefined && { completed }),
      },
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
