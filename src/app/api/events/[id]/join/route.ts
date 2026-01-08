import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/events/[id]/join - Generate a join link for the event
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
    const joinToken = await prisma.event.generateJoinToken(id, userId);

    if (!joinToken) {
      return NextResponse.json(
        { error: 'Event not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ joinToken });
  } catch (error) {
    console.error('Error generating join link:', error);
    return NextResponse.json(
      { error: 'Failed to generate join link' },
      { status: 500 }
    );
  }
}

// DELETE /api/events/[id]/join - Revoke the join link
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
    const revoked = await prisma.event.revokeJoinToken(id, userId);

    if (!revoked) {
      return NextResponse.json(
        { error: 'Event not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking join link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke join link' },
      { status: 500 }
    );
  }
}
