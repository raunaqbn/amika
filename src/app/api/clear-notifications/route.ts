import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST - Clear all notifications for the authenticated user
// This rejects all pending friend requests, shared items, and marks all chat notifications as read
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Clear all three types of notifications in parallel
    const [friendRequestsResult, sharedItemsResult] = await Promise.all([
      // Reject all pending friend requests
      prisma.userConnection.rejectAllPending(userId),
      // Reject all pending shared items
      prisma.sharedItem.rejectAllPending(userId),
      // Mark all chat notifications as read
      prisma.chatNotification.markAllAsRead(userId),
    ]);

    return NextResponse.json({
      success: true,
      cleared: {
        friendRequests: friendRequestsResult.count,
        sharedItems: sharedItemsResult.count,
      },
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}
