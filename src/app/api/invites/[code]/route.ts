import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - Get invite details by code (public - for viewing invite page)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const invite = await prisma.friendInvite.findByCode(code);

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Check if expired
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Check if already accepted
    if (invite.status === 'accepted') {
      return NextResponse.json({ error: 'Invite has already been accepted' }, { status: 410 });
    }

    return NextResponse.json({
      inviteCode: invite.inviteCode,
      inviter: invite.inviter,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite' },
      { status: 500 }
    );
  }
}

// POST - Accept an invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;

    const invite = await prisma.friendInvite.accept(code, session.user.id);

    return NextResponse.json({
      success: true,
      invite,
    });
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invite' },
      { status: 400 }
    );
  }
}
