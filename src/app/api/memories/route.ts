import { after, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { sendPushNotification } from '@/lib/push-notifications';
import { compactImageUrl, isMediaImageUrl, mediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';
import { sendTaggedMemoryEmail } from '@/lib/email';

type MemoryVisibility = 'private' | 'friends' | 'public';
const MAX_DIRECT_AUDIENCE = 10;

function isMemoryVisibility(value: unknown): value is MemoryVisibility {
  return value === 'private' || value === 'friends' || value === 'public';
}

function normalizeFriendIds(friendId: unknown, friendIds: unknown): string[] | null {
  if (friendId !== undefined && friendId !== null && typeof friendId !== 'string') return null;
  if (friendIds !== undefined && !Array.isArray(friendIds)) return null;
  const values = [
    ...(typeof friendId === 'string' && friendId ? [friendId] : []),
    ...(Array.isArray(friendIds) ? friendIds : []),
  ];
  if (values.some((value) => typeof value !== 'string' || !value)) return null;
  return [...new Set(values as string[])];
}

async function findConnectedAudienceFriends(userId: string, friendIds: string[]) {
  if (!friendIds.length) return null;
  const friends = await prisma.friend.findMany({ userId });
  const audience = friendIds.map((friendId) => friends.find((item: { id: string }) => item.id === friendId));
  if (audience.some((friend) => !friend?.linkedUserId)) return null;
  const connected = await Promise.all(audience.map((friend) => prisma.userConnection.areConnected(userId, friend!.linkedUserId!)));
  return connected.every(Boolean) ? audience as Array<NonNullable<(typeof audience)[number]>> : null;
}

async function shareMemoryWithAudience({
  userId,
  friendIds,
  memoryId,
  content,
}: {
  userId: string;
  friendIds: string[];
  memoryId: string;
  content: string;
}) {
  if (!friendIds.length) return;
  const friends = await prisma.friend.findMany({ userId });
  const recipients = friendIds
    .map((friendId) => friends.find((friend: { id: string }) => friend.id === friendId))
    .filter((friend): friend is NonNullable<typeof friend> => Boolean(friend?.linkedUserId));

  const shareResults = await Promise.allSettled(recipients.map(async (friend) => ({
    recipientUserId: friend.linkedUserId!,
    sharedItem: await prisma.sharedItem.create({
      sharedByUserId: userId,
      sharedWithUserId: friend.linkedUserId!,
      itemType: 'memory',
      itemId: memoryId,
      message: undefined,
    }),
  })));
  const newShares = shareResults.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value];
    if (!(result.reason instanceof Error && result.reason.message === 'Item already shared with this user')) {
      console.error('Error sharing memory with recipient:', result.reason);
    }
    return [];
  });

  if (!newShares.length) return;
  after(async () => {
    const author = await prisma.user.findById(userId);
    await Promise.allSettled(newShares.map(async ({ recipientUserId, sharedItem }) => {
      const recipient = await prisma.user.findById(recipientUserId);
      const authorName = author?.name || 'A friend';
      const tasks: Promise<unknown>[] = [sendPushNotification(
        recipientUserId,
        `${authorName} added a memory with you`,
        content,
        { type: 'memory_tagged', sharedItemId: sharedItem.id, memoryId },
      )];
      if (recipient?.email) {
        tasks.push(sendTaggedMemoryEmail({
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          authorName,
          memoryId,
          memoryText: content,
          idempotencyKey: `memory-tag-${memoryId}-${recipientUserId}`,
        }));
      }
      const results = await Promise.allSettled(tasks);
      results.forEach((result) => {
        if (result.status === 'rejected') console.error('Tagged-memory notification failed:', result.reason);
      });
    }));
  });
}

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
    const { friendId, friendIds, content, imageUrl, visibility = 'friends', memoryDate } = body;
    const requestedFriendIds = normalizeFriendIds(friendId, friendIds);
    if (!requestedFriendIds) {
      return NextResponse.json({ error: 'Choose a valid friend audience.' }, { status: 400 });
    }
    if (requestedFriendIds.length > MAX_DIRECT_AUDIENCE) {
      return NextResponse.json({ error: `Share with up to ${MAX_DIRECT_AUDIENCE} friends at a time.` }, { status: 400 });
    }
    const primaryFriendId = requestedFriendIds[0] ?? null;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      );
    }

    if (!isMemoryVisibility(visibility)) {
      return NextResponse.json({ error: 'Choose a valid audience.' }, { status: 400 });
    }

    const directAudience = visibility === 'friends'
      ? await findConnectedAudienceFriends(userId, requestedFriendIds)
      : null;
    if (visibility === 'friends' && !directAudience) {
      return NextResponse.json(
        { error: 'Choose one or more Amika friends to share this memory with, or select Only me.' },
        { status: 400 },
      );
    }

    const shareWithTaggedFriend = visibility !== 'private';

    const memory = await prisma.memory.create({
      data: {
        userId,
        friendId: primaryFriendId,
        content: content.trim(),
        imageUrl: await persistImage(imageUrl || null, { ownerId: userId, kind: 'memory' }),
        visibility,
        memoryDate: memoryDate ? new Date(memoryDate) : new Date(),
        sharedWithFriend: shareWithTaggedFriend,
      },
    });

    if (shareWithTaggedFriend) {
      await shareMemoryWithAudience({ userId, friendIds: requestedFriendIds, memoryId: memory.id, content: memory.content })
        .catch((shareError) => console.error('Error auto-sharing memory:', shareError));
    }

    return NextResponse.json({
      ...memory,
      audienceCount: visibility === 'friends' ? requestedFriendIds.length : 0,
      imageUrl: memory.imageUrl ? mediaImageUrl(request, 'memory', memory.id) : null,
    });
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
    const { id, content, imageUrl, friendId, friendIds, visibility, memoryDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Memory ID required' }, { status: 400 });
    }

    if (visibility !== undefined && !isMemoryVisibility(visibility)) {
      return NextResponse.json({ error: 'Choose a valid audience.' }, { status: 400 });
    }

    const existingMemory = (await prisma.memory.findMany({ userId })).find((memory) => memory.id === id);
    if (!existingMemory) {
      return NextResponse.json({ error: 'Memory not found.' }, { status: 404 });
    }

    const hasFriendSelection = friendId !== undefined || friendIds !== undefined;
    const requestedFriendIds = hasFriendSelection ? normalizeFriendIds(friendId, friendIds) : null;
    if (hasFriendSelection && !requestedFriendIds) {
      return NextResponse.json({ error: 'Choose a valid friend audience.' }, { status: 400 });
    }
    if ((requestedFriendIds?.length || 0) > MAX_DIRECT_AUDIENCE) {
      return NextResponse.json({ error: `Share with up to ${MAX_DIRECT_AUDIENCE} friends at a time.` }, { status: 400 });
    }
    const requestedFriendId = hasFriendSelection ? requestedFriendIds?.[0] ?? null : undefined;
    const effectiveVisibility = visibility ?? existingMemory.visibility;
    const effectiveAudienceFriendIds = effectiveVisibility === 'friends'
      ? requestedFriendIds ?? [existingMemory.friendId].filter((candidate): candidate is string => Boolean(candidate))
      : [];
    const audienceFriends = effectiveVisibility === 'friends'
      ? await findConnectedAudienceFriends(userId, effectiveAudienceFriendIds)
      : [];
    if (effectiveVisibility === 'friends' && !audienceFriends) {
      return NextResponse.json(
        { error: 'Choose one or more Amika friends to share this memory with, or select Only me.' },
        { status: 400 },
      );
    }

    const shareWithTaggedFriend = visibility === undefined ? undefined : visibility !== 'private';

    // Update the memory
    const storedImage = isMediaImageUrl(request, 'memory', id, imageUrl)
      ? undefined
      : await persistImage(imageUrl, { ownerId: userId, kind: 'memory' });

    const updatedMemory = await prisma.memory.update({
      where: { id, userId },
      data: {
        friendId: hasFriendSelection ? requestedFriendId ?? null : undefined,
        content,
        imageUrl: storedImage,
        visibility,
        memoryDate: memoryDate ? new Date(memoryDate) : undefined,
        sharedWithFriend: shareWithTaggedFriend,
      },
    });

    const shouldSyncAudience = visibility !== undefined || hasFriendSelection;
    if (effectiveVisibility !== 'public' && shouldSyncAudience) {
      await prisma.sharedItem.restrictMemoryAudience({
        sharedByUserId: userId,
        itemId: id,
        sharedWithUserIds: audienceFriends?.map((friend) => friend.linkedUserId!) ?? [],
      });
    }

    // Handle sharing with Amika friends if sharing is enabled.
    if ((visibility === 'friends' || visibility === 'public') || (effectiveVisibility === 'friends' && hasFriendSelection)) {
      const allFriendIds = effectiveVisibility === 'friends'
        ? effectiveAudienceFriendIds
        : requestedFriendIds ?? [updatedMemory.friendId].filter((candidate): candidate is string => Boolean(candidate));
      await shareMemoryWithAudience({ userId, friendIds: allFriendIds, memoryId: id, content: updatedMemory.content })
        .catch((shareError) => console.error('Error auto-sharing memory:', shareError));
    }

    return NextResponse.json({
      ...updatedMemory,
      audienceCount: effectiveVisibility === 'friends'
        ? (shouldSyncAudience ? effectiveAudienceFriendIds.length : existingMemory.audienceCount)
        : 0,
      imageUrl: updatedMemory.imageUrl ? mediaImageUrl(request, 'memory', updatedMemory.id) : null,
    });
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
