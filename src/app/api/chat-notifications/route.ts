import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Fetch chat notifications for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const notifications = await prisma.chatNotification.findMany(session.user.id, { unreadOnly });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching chat notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch chat notifications' }, { status: 500 });
  }
}

// PUT - Mark chat notifications as read
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatType, chatId } = await request.json();

    if (!chatType || !chatId) {
      return NextResponse.json({ error: 'chatType and chatId are required' }, { status: 400 });
    }

    if (!['event_plan', 'trip'].includes(chatType)) {
      return NextResponse.json({ error: 'Invalid chatType' }, { status: 400 });
    }

    await prisma.chatNotification.markAsRead(session.user.id, chatType, chatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking chat notifications as read:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
