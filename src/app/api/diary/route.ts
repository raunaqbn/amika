import { after, NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai';
import { getUserId } from '@/lib/auth';
import { compactImageUrl, isMediaImageUrl, mediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';
import { sendSharedItemNotification } from '@/lib/shared-item-notifications';

type ShareableNote = {
  id: string;
  title: string | null;
  content: string;
};

async function shareNoteWithTaggedFriends({
  userId,
  friendTags,
  note,
}: {
  userId: string;
  friendTags: unknown[];
  note: ShareableNote;
}) {
  const requestedFriendIds = new Set(friendTags.flatMap((tag) => {
    if (!tag || typeof tag !== 'object') return [];
    const candidate = tag as { friendId?: unknown; sharedWithFriend?: unknown };
    return candidate.sharedWithFriend === true && typeof candidate.friendId === 'string'
      ? [candidate.friendId]
      : [];
  }));
  if (!requestedFriendIds.size) return;

  const friends = await prisma.friend.findMany({ userId });
  const recipients = new Map<string, string>();
  friends.forEach((friend: { id: string; linkedUserId: string | null }) => {
    if (requestedFriendIds.has(friend.id) && friend.linkedUserId) {
      recipients.set(friend.linkedUserId, friend.linkedUserId);
    }
  });

  const shareResults = await Promise.allSettled([...recipients.values()].map(async (recipientUserId) => ({
    recipientUserId,
    sharedItem: await prisma.sharedItem.create({
      sharedByUserId: userId,
      sharedWithUserId: recipientUserId,
      itemType: 'note',
      itemId: note.id,
      message: undefined,
    }),
  })));
  const newShares = shareResults.flatMap((result) => {
    if (result.status === 'fulfilled') return [result.value];
    if (!(result.reason instanceof Error && result.reason.message === 'Item already shared with this user')) {
      console.error('Error sharing note with friend:', result.reason);
    }
    return [];
  });

  if (!newShares.length) return;
  after(async () => {
    const results = await Promise.allSettled(newShares.map(({ recipientUserId, sharedItem }) => (
      sendSharedItemNotification({
        sharedItemId: sharedItem.id,
        sharedByUserId: userId,
        sharedWithUserId: recipientUserId,
        itemType: 'note',
        itemId: note.id,
        itemTitle: note.title,
        itemContent: note.content,
      })
    )));
    results.forEach((result) => {
      if (result.status === 'rejected') console.error('Shared-note notification failed:', result.reason);
    });
  });
}

async function generateAnalysis(content: string): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: getModel() as any,
      prompt: `You are a gentle, non-clinical journaling companion reflecting on a diary entry only because the writer explicitly requested a saved reflection.

Respond in a way that:
- Briefly acknowledges the feelings or experience actually present
- Keeps the writer's own meaning central
- Offers one tentative observation, never a diagnosis or forced positive reframe
- Does not give clinical advice or invent facts

Keep the reflection concise (one short paragraph) and warm in tone.

Diary Entry:
${content}

Provide the optional journal reflection:`,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    console.error('Error generating analysis:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), 50)
      : undefined;
    const notes = await prisma.diaryNote.findMany({ userId, limit });
    return NextResponse.json(notes.map((note) => ({
      ...note,
      imageUrl: compactImageUrl(request, 'diary', note.id, note.imageUrl),
      friends: note.friends.map((friend: any) => {
        const profileImage = compactImageUrl(
          request,
          'friend',
          friend.id,
          friend.customProfileImage || friend.profileImage,
        );
        return {
          ...friend,
          profileImage,
          customProfileImage: friend.customProfileImage ? profileImage : null,
        };
      }),
    })));
  } catch (error) {
    console.error('Error fetching diary notes:', error);
    return NextResponse.json({ error: 'Failed to fetch diary notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, imageUrl, friendIds, friendTags, requestReflection, savedReflection } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Reflection is opt-in. Saving private writing must never invoke a model by itself.
    const preservedReflection = typeof savedReflection === 'string' && savedReflection.trim()
      ? savedReflection.trim().slice(0, 4_000)
      : null;
    const analysis = preservedReflection || (requestReflection === true ? await generateAnalysis(content) : null);

    // Support both legacy friendIds and new friendTags with sharing
    const note = await prisma.diaryNote.create({
      data: {
        userId,
        title: title?.trim() || null,
        content,
        analysis,
        imageUrl: await persistImage(imageUrl || null, { ownerId: userId, kind: 'diary' }),
        friendIds: Array.isArray(friendIds)
          ? (friendIds.filter((id: string) => typeof id === 'string') as string[])
          : [],
        friendTags: Array.isArray(friendTags) ? friendTags : undefined,
      },
    });

    if (Array.isArray(friendTags)) {
      await shareNoteWithTaggedFriends({ userId, friendTags, note })
        .catch((shareError) => console.error('Error auto-sharing note:', shareError));
    }

    return NextResponse.json({
      ...note,
      imageUrl: note.imageUrl ? mediaImageUrl(request, 'diary', note.id) : null,
    });
  } catch (error) {
    console.error('Error creating diary note:', error);
    return NextResponse.json({ error: 'Failed to create diary note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, content, imageUrl, friendIds, friendTags, requestReflection, savedReflection } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Get existing note to check if content changed
    const existingNotes = await prisma.diaryNote.findMany({ userId });
    const existingNote = existingNotes.find(n => n.id === id);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    let analysis: string | null | undefined = undefined;

    // A changed entry cannot keep a stale reflection. New reflections remain explicit opt-ins.
    if (content && content !== existingNote.content) {
      const preservedReflection = typeof savedReflection === 'string' && savedReflection.trim()
        ? savedReflection.trim().slice(0, 4_000)
        : null;
      analysis = preservedReflection || (requestReflection === true ? await generateAnalysis(content) : null);
    }

    const storedImage = isMediaImageUrl(request, 'diary', id, imageUrl)
      ? undefined
      : await persistImage(imageUrl === undefined ? undefined : imageUrl || null, { ownerId: userId, kind: 'diary' });

    const note = await prisma.diaryNote.update({
      where: { id, userId },
      data: {
        title: title === undefined ? undefined : title?.trim() || null,
        content,
        analysis,
        imageUrl: storedImage,
        friendIds: Array.isArray(friendIds)
          ? (friendIds.filter((fid: string) => typeof fid === 'string') as string[])
          : undefined,
      },
    });

    if (Array.isArray(friendTags)) {
      await shareNoteWithTaggedFriends({ userId, friendTags, note })
        .catch((shareError) => console.error('Error auto-sharing note:', shareError));
    }

    return NextResponse.json({
      ...note,
      imageUrl: note.imageUrl ? mediaImageUrl(request, 'diary', note.id) : null,
    });
  } catch (error) {
    console.error('Error updating diary note:', error);
    return NextResponse.json({ error: 'Failed to update diary note' }, { status: 500 });
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
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    await prisma.diaryNote.delete({ where: { id, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diary note:', error);
    return NextResponse.json({ error: 'Failed to delete diary note' }, { status: 500 });
  }
}
