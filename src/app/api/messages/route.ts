import { after, NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendPushNotification } from '@/lib/push-notifications';
import { compactImageUrl } from '@/lib/mobile-images';

const NO_STORE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0' };

function messagesResponse(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...NO_STORE_HEADERS, ...init?.headers },
  });
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return messagesResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const otherUserId = new URL(request.url).searchParams.get('with');
  if (otherUserId) {
    const connected = await prisma.userConnection.areConnected(userId, otherUserId);
    if (!connected) {
      return messagesResponse({ error: 'You can only message friends.' }, { status: 403 });
    }
    const messages = await prisma.directMessage.findConversation({ userId, otherUserId });
    return messagesResponse(messages.map((message: any) => ({
      ...message,
      sender: message.sender ? {
        ...message.sender,
        profileImage: compactImageUrl(request, 'user', message.sender.id, message.sender.profileImage),
      } : message.sender,
    })));
  }

  const groupConversationId = new URL(request.url).searchParams.get('thread');
  if (groupConversationId) {
    try {
      const messages = await prisma.groupConversation.findConversation({ conversationId: groupConversationId, userId });
      return messagesResponse(messages.map((message: any) => ({
        ...message,
        sender: message.sender ? {
          ...message.sender,
          profileImage: compactImageUrl(request, 'user', message.sender.id, message.sender.profileImage),
        } : message.sender,
      })));
    } catch (error) {
      return messagesResponse({ error: error instanceof Error ? error.message : 'Conversation not found.' }, { status: 404 });
    }
  }

  const [directThreads, groupThreads] = await Promise.all([
    prisma.directMessage.listThreads(userId),
    prisma.groupConversation.listThreads(userId),
  ]);
  const threads = [
    ...directThreads.map((thread: any) => ({
      ...thread,
      kind: 'direct' as const,
      profileImage: compactImageUrl(request, 'user', thread.id, thread.profileImage),
    })),
    ...groupThreads.map((thread: any) => ({
      ...thread,
      members: thread.members?.map((member: any) => ({
        ...member,
        profileImage: compactImageUrl(request, 'user', member.id, member.profileImage),
      })),
    })),
  ].sort((a, b) => {
    return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
  });
  return messagesResponse(threads);
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const memberIds = Array.isArray(body.memberIds) ? body.memberIds.filter((id: unknown): id is string => typeof id === 'string') : [];
  if (memberIds.length) {
    try {
      const thread = await prisma.groupConversation.findOrCreate({ createdBy: userId, memberIds });
      return NextResponse.json({
        ...thread,
        members: thread.members.map((member: any) => ({
          ...member,
          profileImage: compactImageUrl(request, 'user', member.id, member.profileImage),
        })),
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Group chat could not be created.' }, { status: 403 });
    }
  }

  const groupConversationId = typeof body.threadId === 'string' ? body.threadId : '';
  const recipientId = typeof body.recipientId === 'string' ? body.recipientId : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if ((!recipientId && !groupConversationId) || !content) {
    return NextResponse.json({ error: 'Choose a friend and write a message.' }, { status: 400 });
  }

  try {
    if (groupConversationId) {
      const message = await prisma.groupConversation.createMessage({ conversationId: groupConversationId, senderId: userId, content });
      after(async () => {
        try {
          const [sender, recipientIds] = await Promise.all([
            prisma.user.findById(userId),
            prisma.groupConversation.listRecipientIds({ conversationId: groupConversationId, excludeUserId: userId }),
          ]);
          await Promise.all(recipientIds.map((recipientUserId) => sendPushNotification(
            recipientUserId,
            sender?.name || 'A friend',
            content,
            {
              type: 'message',
              threadId: groupConversationId,
              senderId: userId,
              senderName: sender?.name || 'Friend',
              isGroup: true,
            },
          )));
        } catch (pushError) {
          console.error('Error sending group-message push notification:', pushError);
        }
      });
      return NextResponse.json(message);
    }

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
