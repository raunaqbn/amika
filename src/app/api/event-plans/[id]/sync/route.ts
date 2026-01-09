import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/event-plans/[id]/sync - Get changes since last sync
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
    const { searchParams } = new URL(request.url);
    const lastSync = searchParams.get('lastSync');

    if (!lastSync) {
      return NextResponse.json(
        { error: 'lastSync timestamp is required' },
        { status: 400 }
      );
    }

    const changes = await prisma.eventPlanSync.getChanges(
      id,
      userId,
      new Date(lastSync)
    );

    return NextResponse.json(changes);
  } catch (error: any) {
    console.error('Error fetching sync changes:', error);
    if (error.message === 'Event plan not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch changes' },
      { status: 500 }
    );
  }
}
