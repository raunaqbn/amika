import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/event-plans/[id] - Get event plan details with all nested data
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
    const eventPlan = await prisma.eventPlanSession.findById(id, userId);

    if (!eventPlan) {
      return NextResponse.json({ error: 'Event plan not found' }, { status: 404 });
    }

    return NextResponse.json(eventPlan);
  } catch (error) {
    console.error('Error fetching event plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event plan' },
      { status: 500 }
    );
  }
}

// PUT /api/event-plans/[id] - Update event plan
export async function PUT(
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
    const { title, description, status, eventDate, eventTime, selectedEventId, eventLocation } = body;

    const eventPlan = await prisma.eventPlanSession.update(id, userId, {
      title,
      description,
      status,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventTime,
      selectedEventId,
      eventLocation,
    });

    if (!eventPlan) {
      return NextResponse.json({ error: 'Event plan not found' }, { status: 404 });
    }

    return NextResponse.json(eventPlan);
  } catch (error) {
    console.error('Error updating event plan:', error);
    return NextResponse.json(
      { error: 'Failed to update event plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/event-plans/[id] - Delete event plan (owner only)
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
    const deleted = await prisma.eventPlanSession.delete(id, userId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Event plan not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete event plan' },
      { status: 500 }
    );
  }
}
