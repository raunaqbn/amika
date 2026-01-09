import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/event-plans/[id]/presence - Get active users
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
    const activeUsers = await prisma.eventPlanPresence.getActiveUsers(id, userId);
    return NextResponse.json(activeUsers);
  } catch (error: any) {
    console.error('Error fetching active users:', error);
    if (error.message === 'Event plan not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch active users' },
      { status: 500 }
    );
  }
}

// POST /api/event-plans/[id]/presence - Update presence (heartbeat)
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
    await prisma.eventPlanPresence.updatePresence(id, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating presence:', error);
    if (error.message === 'Event plan not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}
