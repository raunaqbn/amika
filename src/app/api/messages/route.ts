import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const otherUserId = new URL(request.url).searchParams.get('with');
  if (otherUserId) {
    const connected = await prisma.userConnection.areConnected(userId, otherUserId);
    if (!connected) {
      return NextResponse.json({ error: 'You can only message friends.' }, { status: 403 });
    }
    return NextResponse.json(
      await prisma.directMessage.findConversation({ userId, otherUserId })
    );
  }

  return NextResponse.json(await prisma.directMessage.listThreads(userId));
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const recipientId = typeof body.recipientId === 'string' ? body.recipientId : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!recipientId || !content) {
    return NextResponse.json({ error: 'Choose a friend and write a message.' }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await prisma.directMessage.create({ senderId: userId, recipientId, content })
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Message could not be sent.' },
      { status: 403 }
    );
  }
}
