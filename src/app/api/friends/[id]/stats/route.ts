import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/friends/[id]/stats - Get stats for a specific friend
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: friendId } = await params;

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    const stats = await prisma.getFriendStats(userId, friendId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching friend stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend stats' },
      { status: 500 }
    );
  }
}
