import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/trips/[id]/events - Add event to a day
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await request.json();
    const { dailyPlanId, title, description, startTime, endTime, location, category, externalUrl, estimatedCost, notes } = body;

    if (!dailyPlanId || !title) {
      return NextResponse.json(
        { error: 'Daily plan ID and title are required' },
        { status: 400 }
      );
    }

    const event = await prisma.tripEvent.create(dailyPlanId, {
      title,
      description,
      startTime,
      endTime,
      location,
      category,
      externalUrl,
      estimatedCost,
      notes,
    }, userId);

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Error creating trip event:', error);
    if (error.message === 'Daily plan not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[id]/events - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await request.json();
    const { eventId, title, description, startTime, endTime, location, category, externalUrl, estimatedCost, notes, order } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await prisma.tripEvent.update(eventId, {
      title,
      description,
      startTime,
      endTime,
      location,
      category,
      externalUrl,
      estimatedCost,
      notes,
      order,
    }, userId);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating trip event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id]/events - Remove event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.tripEvent.delete(eventId, userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
