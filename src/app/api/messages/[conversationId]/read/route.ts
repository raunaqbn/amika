import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

type RouteParams = {
  params: Promise<{ conversationId: string }>;
};

// POST - Mark conversation as read for the current user
export async function POST(request: Request, { params }: RouteParams) {
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

    await prisma.conversation.markAsRead(conversationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ error: error.message || 'Failed to mark as read' }, { status: 400 });
  }
}
