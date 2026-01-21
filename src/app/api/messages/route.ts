import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Fetch all conversations for the authenticated user
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findManyForUser(session.user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST - Create a new conversation (1:1 or group)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantIds, name, isGroup } = await request.json();

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ error: 'participantIds is required' }, { status: 400 });
    }

    // Ensure the creator is included in participants
    const allParticipants = [...new Set([session.user.id, ...participantIds])];

    // For 1:1 conversations, check if one already exists
    if (!isGroup && allParticipants.length === 2) {
      const existingConversation = await prisma.conversation.findDirectConversation(
        allParticipants[0],
        allParticipants[1]
      );

      if (existingConversation) {
        // Return the existing conversation with full details
        const conversations = await prisma.conversation.findManyForUser(session.user.id);
        const fullConversation = conversations.find(c => c.id === existingConversation.id);
        return NextResponse.json(fullConversation || existingConversation);
      }
    }

    // Group chats require a name
    if (isGroup && !name) {
      return NextResponse.json({ error: 'Group chats require a name' }, { status: 400 });
    }

    // Create the conversation
    const conversation = await prisma.conversation.create({
      name: isGroup ? name : undefined,
      isGroup: Boolean(isGroup),
      createdById: session.user.id,
      participantIds: allParticipants,
    });

    // Return with full details
    const conversations = await prisma.conversation.findManyForUser(session.user.id);
    const fullConversation = conversations.find(c => c.id === conversation.id);

    return NextResponse.json(fullConversation || conversation);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create conversation' }, { status: 400 });
  }
}
