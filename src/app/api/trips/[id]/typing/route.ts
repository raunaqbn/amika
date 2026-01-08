import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/trips/[id]/typing - Update typing status
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
    const { typing, context = 'general' } = body;

    await prisma.tripPresence.updateTyping(id, userId, typing, context);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating typing status:', error);
    if (error.message === 'Trip not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update typing status' },
      { status: 500 }
    );
  }
}

// GET /api/trips/[id]/typing - Get typing users
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
    const context = searchParams.get('context') || undefined;

    const typingUsers = await prisma.tripPresence.getTypingUsers(id, userId, context);

    return NextResponse.json(typingUsers);
  } catch (error: any) {
    console.error('Error getting typing users:', error);
    if (error.message === 'Trip not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to get typing users' },
      { status: 500 }
    );
  }
}
