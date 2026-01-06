import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Get Amika friend profile
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

    // Get the Amika friend's user profile
    const friend = await prisma.user.findById(amikaFriendId);
    if (!friend) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return safe profile info (exclude password hash)
    return NextResponse.json({
      id: friend.id,
      name: friend.name,
      email: friend.email,
      profileImage: friend.profileImage,
      birthday: friend.birthday,
    });
  } catch (error) {
    console.error('Error fetching Amika friend:', error);
    return NextResponse.json({ error: 'Failed to fetch Amika friend' }, { status: 500 });
  }
}
