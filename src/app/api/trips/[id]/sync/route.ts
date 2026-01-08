import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/trips/[id]/sync - Long-poll endpoint for real-time updates
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
    const lastSyncParam = searchParams.get('lastSync');

    // Default to 5 seconds ago if no lastSync provided
    const lastSync = lastSyncParam
      ? new Date(lastSyncParam)
      : new Date(Date.now() - 5000);

    const changes = await prisma.tripSync.getChanges(id, userId, lastSync);

    return NextResponse.json(changes);
  } catch (error: any) {
    console.error('Error syncing trip:', error);
    if (error.message === 'Trip not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to sync trip' },
      { status: 500 }
    );
  }
}
