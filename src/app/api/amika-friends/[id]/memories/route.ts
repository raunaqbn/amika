import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Get memories with an Amika friend
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

    const memories = await prisma.memory.findManyByAmikaFriend({
      userId,
      amikaFriendUserId: amikaFriendId,
    });

    return NextResponse.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

// Create a memory with an Amika friend
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: amikaFriendId } = await params;
    const body = await request.json();
    const { content, imageUrl, sharedWithAmikaFriend } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const memory = await prisma.memory.createForAmikaFriend({
      data: {
        userId,
        amikaFriendUserId: amikaFriendId,
        content,
        imageUrl: imageUrl || null,
        sharedWithAmikaFriend: sharedWithAmikaFriend || false,
      },
    });

    return NextResponse.json(memory);
  } catch (error) {
    console.error('Error creating memory:', error);
    const message = error instanceof Error ? error.message : 'Failed to create memory';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update memory sharing status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { memoryId, sharedWithAmikaFriend } = body;

    if (!memoryId || sharedWithAmikaFriend === undefined) {
      return NextResponse.json({ error: 'Memory ID and sharing status required' }, { status: 400 });
    }

    await prisma.memory.updateSharing({
      where: { id: memoryId, userId },
      sharedWithAmikaFriend,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating memory:', error);
    return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
  }
}

// Delete a memory
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memoryId = searchParams.get('memoryId');

    if (!memoryId) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    await prisma.memory.delete({
      where: { id: memoryId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting memory:', error);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}
