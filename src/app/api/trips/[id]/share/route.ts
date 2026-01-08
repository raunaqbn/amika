import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/trips/[id]/share - Generate a share link for the trip
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
    const shareToken = await prisma.tripSession.generateShareToken(id, userId);

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Trip not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ shareToken });
  } catch (error) {
    console.error('Error generating share link:', error);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id]/share - Revoke the share link
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
    const revoked = await prisma.tripSession.revokeShareToken(id, userId);

    if (!revoked) {
      return NextResponse.json(
        { error: 'Trip not found or you are not the owner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
