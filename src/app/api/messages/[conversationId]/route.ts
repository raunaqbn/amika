import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteParams = {
  params: Promise<{ conversationId: string }>;
};

// GET - Fetch messages for a conversation
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

    // Parse query params for pagination
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const before = searchParams.get('before') ? new Date(searchParams.get('before')!) : undefined;
    const after = searchParams.get('after') ? new Date(searchParams.get('after')!) : undefined;

    const messages = await prisma.directMessage.findManyForConversation(conversationId, {
      limit,
      before,
      after,
    });

    // Get conversation details
    const conversation = await prisma.conversation.findById(conversationId);
    const participants = await prisma.conversation.getParticipants(conversationId);

    return NextResponse.json({
      conversation: {
        ...conversation,
        participants,
      },
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify user is a participant
    const isParticipant = await prisma.conversation.isParticipant(conversationId, session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not a participant' }, { status: 403 });
    }

    const message = await prisma.directMessage.create({
      conversationId,
      senderId: session.user.id,
      content: content.trim(),
    });

    // Return message with sender info
    return NextResponse.json({
      ...message,
      sender: {
        id: session.user.id,
        name: session.user.name,
        profileImage: session.user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 400 });
  }
}

// DELETE - Delete the conversation (only creator can delete)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Get conversation to check ownership
    const conversation = await prisma.conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Only the creator can delete the conversation' }, { status: 403 });
    }

    await prisma.conversation.delete(conversationId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete conversation' }, { status: 400 });
  }
}
