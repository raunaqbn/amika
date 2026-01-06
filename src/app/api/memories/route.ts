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
    const { friendId, content, imageUrl, sharedWithFriend } = body;

    if (!friendId || !content) {
      return NextResponse.json(
        { error: 'Friend ID and content required' },
        { status: 400 }
      );
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        friendId,
        content,
        imageUrl: imageUrl || null,
        sharedWithFriend: sharedWithFriend || false,
      },
    });

    // If sharing is enabled and friend is an Amika user, auto-create a SharedItem notification
    if (sharedWithFriend) {
      try {
        // Get the friend to check if they have a linkedUserId (are an Amika user)
        const friends = await prisma.friend.findMany({ userId });
        const friend = friends.find((f: { id: string }) => f.id === friendId);

        if (friend && friend.linkedUserId) {
          // Create a SharedItem so the Amika friend gets a notification
          await prisma.sharedItem.create({
            sharedByUserId: userId,
            sharedWithUserId: friend.linkedUserId,
            itemType: 'memory',
            itemId: memory.id,
            message: undefined,
          });
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
    const { id, sharedWithFriend } = body;

    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    await prisma.memory.updateSharing({
      where: { id, userId },
      sharedWithFriend: sharedWithFriend,
    });

    return NextResponse.json({ success: true });
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
