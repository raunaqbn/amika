import { after, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { sendPushNotification } from '@/lib/push-notifications';
import { compactImageUrl, mediaImageUrl } from '@/lib/mobile-images';

function compactMemory(request: NextRequest, memory: any) {
  const { hasImage, ...memoryWithoutFlags } = memory;
  const { hasProfileImage: authorHasImage, ...author } = memory.author || {};
  const { hasProfileImage: friendHasImage, ...friend } = memory.friend || {};
  return {
    ...memoryWithoutFlags,
    imageUrl: hasImage
      ? mediaImageUrl(request, 'memory', memory.id)
      : compactImageUrl(request, 'memory', memory.id, memory.imageUrl),
    author: memory.author ? {
      ...author,
      profileImage: authorHasImage
        ? mediaImageUrl(request, 'user', memory.author.id)
        : compactImageUrl(request, 'user', memory.author.id, memory.author.profileImage),
    } : memory.author,
    friend: memory.friend ? {
      ...friend,
      profileImage: friendHasImage
        ? mediaImageUrl(request, 'friend', memory.friend.id)
        : compactImageUrl(request, 'friend', memory.friend.id, memory.friend.profileImage),
    } : memory.friend,
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const requestedLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 50)
      : undefined;
    const rawCursor = searchParams.get('cursor');
    const [cursorDate, cursorId] = rawCursor?.split('|') || [];
    const cursor = cursorDate && cursorId ? { date: cursorDate, id: cursorId } : undefined;
    const memories = scope === 'feed' || scope === 'public'
      ? await prisma.memory.findFeed({
        userId,
        scope: scope === 'public' ? 'public' : 'friends',
        limit: limit ? limit + 1 : undefined,
        cursor,
      })
      : await prisma.memory.findMany({ userId, limit });

    if (limit && (scope === 'feed' || scope === 'public')) {
      const hasMore = memories.length > limit;
      const items = memories.slice(0, limit);
      const last = items.at(-1);
      return NextResponse.json({
        items: items.map((memory) => compactMemory(request, memory)),
        nextCursor: hasMore && last
          ? `${last.memoryDate.toISOString()}|${last.id}`
          : null,
      });
    }
    return NextResponse.json(memories.map((memory) => compactMemory(request, memory)));
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
    const { friendId, friendIds, content, imageUrl, visibility = 'friends', memoryDate, sharedWithFriend } = body;

    // Support both single friendId and multiple friendIds (use first one as primary)
    const primaryFriendId = friendId || (Array.isArray(friendIds) && friendIds[0]) || null;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      );
    }

    const memory = await prisma.memory.create({
      data: {
        userId,
        friendId: primaryFriendId,
        content: content.trim(),
        imageUrl: imageUrl || null,
        visibility,
        memoryDate: memoryDate ? new Date(memoryDate) : new Date(),
        sharedWithFriend: sharedWithFriend ?? visibility !== 'private',
      },
    });

    // If sharing is enabled, auto-create SharedItem for Amika friends
    if ((sharedWithFriend ?? visibility !== 'private')) {
      try {
        // Get all friends to check which ones have linkedUserId (are Amika users)
        const friends = await prisma.friend.findMany({ userId });
        const allFriendIds = (Array.isArray(friendIds) ? friendIds : [primaryFriendId]).filter((id): id is string => typeof id === 'string' && id.length > 0);

        for (const fId of allFriendIds) {
          const friend = friends.find((f: { id: string }) => f.id === fId);
          if (friend && friend.linkedUserId) {
            try {
              // Create a SharedItem so the Amika friend gets a notification
              const sharedItem = await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'memory',
                itemId: memory.id,
                message: undefined,
              });
              after(async () => {
                try {
                  const author = await prisma.user.findById(userId);
                  await sendPushNotification(
                    friend.linkedUserId!,
                    `${author?.name || 'A friend'} added a memory with you`,
                    memory.content,
                    { type: 'memory_tagged', sharedItemId: sharedItem.id, memoryId: memory.id },
                  );
                } catch (pushError) {
                  console.error('Error sending tagged-memory push notification:', pushError);
                }
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
    const { id, content, imageUrl, friendId, friendIds, visibility, memoryDate, sharedWithFriend } = body;

    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    // Update the memory
    const updatedMemory = await prisma.memory.update({
      where: { id, userId },
      data: {
        content,
        imageUrl,
        visibility,
        memoryDate: memoryDate ? new Date(memoryDate) : undefined,
        sharedWithFriend: sharedWithFriend ?? (visibility ? visibility !== 'private' : undefined),
      },
    });

    // Handle sharing with Amika friends if sharing is enabled
    if (sharedWithFriend || visibility === 'friends' || visibility === 'public') {
      try {
        const friends = await prisma.friend.findMany({ userId });
        const allFriendIds = friendIds || (friendId ? [friendId] : [updatedMemory.friendId].filter(Boolean));

        for (const fId of allFriendIds) {
          const friend = friends.find((f: { id: string }) => f.id === fId);
          if (friend && friend.linkedUserId) {
            try {
              const sharedItem = await prisma.sharedItem.create({
                sharedByUserId: userId,
                sharedWithUserId: friend.linkedUserId,
                itemType: 'memory',
                itemId: id,
                message: undefined,
              });
              after(async () => {
                try {
                  const author = await prisma.user.findById(userId);
                  await sendPushNotification(
                    friend.linkedUserId!,
                    `${author?.name || 'A friend'} added a memory with you`,
                    updatedMemory.content,
                    { type: 'memory_tagged', sharedItemId: sharedItem.id, memoryId: id },
                  );
                } catch (pushError) {
                  console.error('Error sending tagged-memory push notification:', pushError);
                }
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
