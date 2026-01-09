import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/event-plans - List all event plans for the user
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventPlans = await prisma.eventPlanSession.findMany(userId);
    return NextResponse.json(eventPlans);
  } catch (error) {
    console.error('Error fetching event plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event plans' },
      { status: 500 }
    );
  }
}

// POST /api/event-plans - Create a new event plan session
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, collaboratorFriendIds } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const eventPlan = await prisma.eventPlanSession.create({
      userId,
      title,
      description,
      collaboratorFriendIds,
    });

    return NextResponse.json(eventPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating event plan:', error);
    return NextResponse.json(
      { error: 'Failed to create event plan' },
      { status: 500 }
    );
  }
}
