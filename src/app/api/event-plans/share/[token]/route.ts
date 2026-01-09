import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/event-plans/share/[token] - Get event plan by share token (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const eventPlan = await prisma.eventPlanSession.findByShareToken(token);

    if (!eventPlan) {
      return NextResponse.json({ error: 'Event plan not found' }, { status: 404 });
    }

    return NextResponse.json(eventPlan);
  } catch (error) {
    console.error('Error fetching shared event plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event plan' },
      { status: 500 }
    );
  }
}
