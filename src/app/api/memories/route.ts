import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memories = await prisma.memory.findMany({ userId });
    return NextResponse.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendId, friendIds, content, imageUrl, sharedWithFriend } = body;

    // Support both single friendId and multiple friendIds (use first one as primary)
    const primaryFriendId = friendId || (friendIds && friendIds[0]);

    if (!primaryFriendId || !content) {
      return NextResponse.json(
        { error: 'Friend ID and content required' },
        { status: 400 }
      );
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        friendId: primaryFriendId,
        content,
        imageUrl: imageUrl || null,
        sharedWithFriend: sharedWithFriend || false,
      },
    });

    // If sharing is enabled, auto-create SharedItem for Amika friends
    if (sharedWithFriend) {
      try {
        // Get all friends to check which ones have linkedUserId (are Amika users)
        const friends = await prisma.friend.findMany({ userId });
        const allFriendIds = friendIds || [primaryFriendId];

        for (const fId of allFriendIds) {
          const friend = friends.find((f: { id: string }) => f.id === fId);
          if (friend && friend.linkedUserId) {
            try {
              // Create a SharedItem so the Amika friend gets a notification
              await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'memory',
                itemId: memory.id,
                message: undefined,
              });
            } catch (shareError) {
              // Ignore duplicate share errors
              console.error('Error auto-sharing memory:', shareError);
            }
          }
        }
      } catch (shareError) {
        // Log the error but don't fail the memory creation
        console.error('Error auto-sharing memory:', shareError);
      }
    }

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Error creating memory:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, content, imageUrl, friendId, friendIds, sharedWithFriend } = body;

    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    // Update the memory
    const updatedMemory = await prisma.memory.update({
      where: { id, userId },
      data: {
        content,
        imageUrl,
        sharedWithFriend,
      },
    });

    // Handle sharing with Amika friends if sharing is enabled
    if (sharedWithFriend) {
      try {
        const friends = await prisma.friend.findMany({ userId });
        const allFriendIds = friendIds || (friendId ? [friendId] : [updatedMemory.friendId].filter(Boolean));

        for (const fId of allFriendIds) {
          const friend = friends.find((f: { id: string }) => f.id === fId);
          if (friend && friend.linkedUserId) {
            try {
              await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'memory',
                itemId: id,
                message: undefined,
              });
            } catch (shareError) {
              // Ignore duplicate share errors
              console.error('Error sharing memory:', shareError);
            }
          }
        }
      } catch (shareError) {
        console.error('Error auto-sharing memory:', shareError);
      }
    }

    return NextResponse.json(updatedMemory);
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    await prisma.memory.delete({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
