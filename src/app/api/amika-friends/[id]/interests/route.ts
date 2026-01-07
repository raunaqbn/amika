import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Get Amika friend's interests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: amikaFriendId } = await params;

    // Verify this user is connected with the Amika friend
    const isConnected = await prisma.userConnection.areConnected(userId, amikaFriendId);
    if (!isConnected) {
      return NextResponse.json({ error: 'Not connected with this user' }, { status: 403 });
    }

    // Get the friend's user profile to get their interests
    const friend = await prisma.user.findById(amikaFriendId);
    if (!friend) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse interests from JSON string
    let interests: string[] = [];
    if (friend.interests) {
      try {
        interests = JSON.parse(friend.interests);
      } catch {
        interests = [];
      }
    }

    return NextResponse.json({ interests });
  } catch (error) {
    console.error('Error fetching friend interests:', error);
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}
