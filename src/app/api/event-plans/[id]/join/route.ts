import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/event-plans/[id]/join - Generate or get join token
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
    const token = await prisma.eventPlanSession.generateJoinToken(id, userId);

    if (!token) {
      return NextResponse.json(
        { error: 'Event plan not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ joinToken: token });
  } catch (error) {
    console.error('Error generating join token:', error);
    return NextResponse.json(
      { error: 'Failed to generate join token' },
      { status: 500 }
    );
  }
}

// DELETE /api/event-plans/[id]/join - Revoke join token
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
    const success = await prisma.eventPlanSession.revokeJoinToken(id, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Event plan not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking join token:', error);
    return NextResponse.json(
      { error: 'Failed to revoke join token' },
      { status: 500 }
    );
  }
}
