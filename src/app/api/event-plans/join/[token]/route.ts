import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/event-plans/join/[token] - Get event plan info by join token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const eventPlanInfo = await prisma.eventPlanSession.findByJoinToken(token);

    if (!eventPlanInfo) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    return NextResponse.json(eventPlanInfo);
  } catch (error) {
    console.error('Error fetching join info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event plan info' },
      { status: 500 }
    );
  }
}

// POST /api/event-plans/join/[token] - Join event plan via token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userName = session.user.name;
    const { token } = await params;

    const result = await prisma.eventPlanSession.joinByToken(token, userId, userName || 'User');

    if (!result) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 404 });
    }

    return NextResponse.json({ eventPlanId: result.eventPlanId });
  } catch (error) {
    console.error('Error joining event plan:', error);
    return NextResponse.json(
      { error: 'Failed to join event plan' },
      { status: 500 }
    );
  }
}
