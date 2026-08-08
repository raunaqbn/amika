import { after, NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendPushNotification } from '@/lib/push-notifications';
import { compactImageUrl } from '@/lib/mobile-images';

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
    const messages = await prisma.directMessage.findConversation({ userId, otherUserId });
    return NextResponse.json(messages.map((message: any) => ({
      ...message,
      sender: message.sender ? {
        ...message.sender,
        profileImage: compactImageUrl(request, 'user', message.sender.id, message.sender.profileImage),
      } : message.sender,
    })));
  }

  const threads = await prisma.directMessage.listThreads(userId);
  return NextResponse.json(threads.map((thread: any) => ({
    ...thread,
    profileImage: compactImageUrl(request, 'user', thread.id, thread.profileImage),
  })));
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
    const message = await prisma.directMessage.create({ senderId: userId, recipientId, content });
    after(async () => {
      try {
        const sender = await prisma.user.findById(userId);
        await sendPushNotification(recipientId, sender?.name || 'A friend', content, {
          type: 'message',
          senderId: userId,
          senderName: sender?.name || 'Friend',
        });
      } catch (pushError) {
        console.error('Error sending message push notification:', pushError);
      }
    });
    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Message could not be sent.' },
      { status: 403 }
    );
  }
}
