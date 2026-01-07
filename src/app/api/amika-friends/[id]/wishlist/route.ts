import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Get Amika friend's wishlist (only unpurchased items visible to friends)
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

    // Get the friend's wishlist items (only show unpurchased items to friends)
    const items = await prisma.wishlist.findByUserId(amikaFriendId);
    const unpurchasedItems = items.filter(item => !item.purchased);

    return NextResponse.json(unpurchasedItems);
  } catch (error) {
    console.error('Error fetching friend wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}
