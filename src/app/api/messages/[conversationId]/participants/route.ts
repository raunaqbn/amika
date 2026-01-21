import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteParams = {
  params: Promise<{ conversationId: string }>;
};

// GET - Get participants for a conversation
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is a participant
    const isParticipant = await prisma.conversation.isParticipant(conversationId, session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const participants = await prisma.conversation.getParticipants(conversationId);
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

// POST - Add a participant to a group conversation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get conversation and verify it's a group chat
    const conversation = await prisma.conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.isGroup) {
      return NextResponse.json({ error: 'Cannot add participants to a direct conversation' }, { status: 400 });
    }

    // Verify current user is a participant
    const isParticipant = await prisma.conversation.isParticipant(conversationId, session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    await prisma.conversation.addParticipant(conversationId, userId);

    const participants = await prisma.conversation.getParticipants(conversationId);
    return NextResponse.json(participants);
  } catch (error: any) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: error.message || 'Failed to add participant' }, { status: 400 });
  }
}

// DELETE - Remove a participant from a group conversation
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get conversation
    const conversation = await prisma.conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (!conversation.isGroup) {
      return NextResponse.json({ error: 'Cannot remove participants from a direct conversation' }, { status: 400 });
    }

    // Verify current user is a participant
    const isParticipant = await prisma.conversation.isParticipant(conversationId, session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    // Users can only remove themselves unless they're the creator
    if (userId !== session.user.id && conversation.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Only the creator can remove other participants' }, { status: 403 });
    }

    await prisma.conversation.removeParticipant(conversationId, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove participant' }, { status: 400 });
  }
}
