import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { compactImageUrl } from '@/lib/mobile-images';

// GET - Fetch shared items for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'sent' | 'received' | null;
    const status = searchParams.get('status') || undefined;
    const itemType = searchParams.get('itemType') || undefined;
    const pendingCount = searchParams.get('pendingCount') === 'true';

    if (pendingCount) {
      const counts = await prisma.sharedItem.getPendingCount(session.user.id, itemType);
      return NextResponse.json(counts);
    }

    const items = await prisma.sharedItem.findMany({
      userId: session.user.id,
      type: type || undefined,
      status,
      itemType,
    });

    return NextResponse.json(items.map((sharedItem: any) => ({
      ...sharedItem,
      sharedBy: sharedItem.sharedBy ? {
        ...sharedItem.sharedBy,
        profileImage: compactImageUrl(request, 'user', sharedItem.sharedBy.id, sharedItem.sharedBy.profileImage),
      } : sharedItem.sharedBy,
      sharedWith: sharedItem.sharedWith ? {
        ...sharedItem.sharedWith,
        profileImage: compactImageUrl(request, 'user', sharedItem.sharedWith.id, sharedItem.sharedWith.profileImage),
      } : sharedItem.sharedWith,
      item: sharedItem.item ? {
        ...sharedItem.item,
        imageUrl: compactImageUrl(
          request,
          sharedItem.itemType === 'memory' ? 'memory' : 'diary',
          sharedItem.item.id,
          sharedItem.item.imageUrl,
        ),
      } : sharedItem.item,
    })));
  } catch (error) {
    console.error('Error fetching shared items:', error);
    return NextResponse.json({ error: 'Failed to fetch shared items' }, { status: 500 });
  }
}

// POST - Share an item with a connected user
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sharedWithUserId, itemType, itemId, message } = await request.json();

    if (!sharedWithUserId || !itemType || !itemId) {
      return NextResponse.json({ error: 'sharedWithUserId, itemType, and itemId are required' }, { status: 400 });
    }

    if (!['memory', 'note'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
    }

    const sharedItem = await prisma.sharedItem.create({
      sharedByUserId: session.user.id,
      sharedWithUserId,
      itemType,
      itemId,
      message,
    });

    return NextResponse.json(sharedItem);
  } catch (error: any) {
    console.error('Error sharing item:', error);
    return NextResponse.json({ error: error.message || 'Failed to share item' }, { status: 400 });
  }
}

// PUT - Accept or reject a shared item
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the shared item details before updating
    const sharedItems = await prisma.sharedItem.findMany({
      userId: session.user.id,
      type: 'received',
    });
    const sharedItemDetails = sharedItems.find((item: { id: string }) => item.id === id);

    const sharedItem = await prisma.sharedItem.update({
      id,
      userId: session.user.id,
      status,
    });

    // If accepted, copy the item to the recipient's account
    if (status === 'accepted' && sharedItemDetails) {
      try {
        const recipientUserId = session.user.id;
        const sharerId = sharedItemDetails.sharedByUserId;

        // Find the friend record that links to the sharer
        const friends = await prisma.friend.findMany({ userId: recipientUserId });
        const sharerFriend = friends.find((f: { linkedUserId: string | null }) => f.linkedUserId === sharerId);

        if (sharerFriend && sharedItemDetails.item) {
          // Copy the item based on type
          if (sharedItemDetails.itemType === 'memory' && sharedItemDetails.item.content) {
            await prisma.memory.create({
              data: {
                userId: recipientUserId,
                friendId: sharerFriend.id,
                content: sharedItemDetails.item.content,
                imageUrl: sharedItemDetails.item.imageUrl || null,
                memoryDate: new Date(sharedItemDetails.item.memoryDate || sharedItemDetails.item.createdAt),
                sharedWithFriend: true, // Mark as shared
              },
            });
          } else if (sharedItemDetails.itemType === 'note' && sharedItemDetails.item.content) {
            await prisma.diaryNote.create({
              data: {
                userId: recipientUserId,
                title: sharedItemDetails.item.title || null,
                content: sharedItemDetails.item.content,
                analysis: null, // Don't copy the analysis
                imageUrl: sharedItemDetails.item.imageUrl || null,
                friendIds: [sharerFriend.id],
                friendTags: [{ friendId: sharerFriend.id, sharedWithFriend: true }],
              },
            });
          }
        }

      } catch (copyError) {
        console.error('Error copying shared item to recipient:', copyError);
        // Don't fail the acceptance if copy fails
      }
    }

    return NextResponse.json(sharedItem);
  } catch (error: any) {
    console.error('Error updating shared item:', error);
    return NextResponse.json({ error: error.message || 'Failed to update shared item' }, { status: 400 });
  }
}

// DELETE - Remove a shared item
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.sharedItem.delete({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting shared item:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete shared item' }, { status: 400 });
  }
}
