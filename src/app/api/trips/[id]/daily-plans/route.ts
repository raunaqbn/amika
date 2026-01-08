import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/trips/[id]/daily-plans - Get all daily plans with events
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
    const trip = await prisma.tripSession.findById(id, userId);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(trip.dailyPlans);
  } catch (error) {
    console.error('Error fetching daily plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily plans' },
      { status: 500 }
    );
  }
}

// POST /api/trips/[id]/daily-plans - Create daily plan
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
    const { dayNumber, date } = body;

    if (dayNumber === undefined) {
      return NextResponse.json(
        { error: 'Day number is required' },
        { status: 400 }
      );
    }

    const plan = await prisma.tripDailyPlan.create(
      id,
      dayNumber,
      date ? new Date(date) : null,
      userId
    );

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error('Error creating daily plan:', error);
    if (error.message === 'Trip not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create daily plan' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[id]/daily-plans - Update daily plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params; // We use planId from body
    const body = await request.json();
    const { planId, date } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    const plan = await prisma.tripDailyPlan.update(
      planId,
      { date: date ? new Date(date) : null },
      userId
    );

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating daily plan:', error);
    return NextResponse.json(
      { error: 'Failed to update daily plan' },
      { status: 500 }
    );
  }
}
