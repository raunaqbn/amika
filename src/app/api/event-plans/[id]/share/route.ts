import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/event-plans/[id]/share - Generate or get share token
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
    const token = await prisma.eventPlanSession.generateShareToken(id, userId);

    if (!token) {
      return NextResponse.json(
        { error: 'Event plan not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ shareToken: token });
  } catch (error) {
    console.error('Error generating share token:', error);
    return NextResponse.json(
      { error: 'Failed to generate share token' },
      { status: 500 }
    );
  }
}

// DELETE /api/event-plans/[id]/share - Revoke share token
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
    const success = await prisma.eventPlanSession.revokeShareToken(id, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Event plan not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share token:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share token' },
      { status: 500 }
    );
  }
}
