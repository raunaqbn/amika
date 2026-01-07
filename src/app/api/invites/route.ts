import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET - List all invites created by the current user
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invites = await prisma.friendInvite.findMany(session.user.id);

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}

// POST - Create a new invite link
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteeName, inviteeEmail } = body;

    const invite = await prisma.friendInvite.create({
      inviterId: session.user.id,
      inviteeName,
      inviteeEmail,
    });

    // Generate the full invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${invite.inviteCode}`;

    return NextResponse.json({
      ...invite,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an invite
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    await prisma.friendInvite.delete(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invite:', error);
    return NextResponse.json(
      { error: 'Failed to delete invite' },
      { status: 500 }
    );
  }
}
