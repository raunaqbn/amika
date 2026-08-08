import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { compactImageUrl, mediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';

// Get diary notes about an Amika friend
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

    const notes = await prisma.diaryNote.findManyByAmikaFriend({
      userId,
      amikaFriendUserId: amikaFriendId,
    });

    return NextResponse.json(notes.map((note) => ({
      ...note,
      imageUrl: compactImageUrl(request, 'diary', note.id, note.imageUrl),
    })));
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// Create a diary note about an Amika friend
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
    const { title, content, imageUrl, sharedWithAmikaFriend } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const note = await prisma.diaryNote.createForAmikaFriend({
      data: {
        userId,
        amikaFriendUserId: amikaFriendId,
        title: title || null,
        content,
        imageUrl: await persistImage(imageUrl || null, { ownerId: userId, kind: 'diary' }),
        sharedWithAmikaFriend: sharedWithAmikaFriend || false,
      },
    });

    return NextResponse.json({
      ...note,
      imageUrl: note.imageUrl ? mediaImageUrl(request, 'diary', note.id) : null,
    });
  } catch (error) {
    console.error('Error creating note:', error);
    const message = error instanceof Error ? error.message : 'Failed to create note';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update note sharing status
export async function PUT(
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
    const { noteId, sharedWithAmikaFriend } = body;

    if (!noteId || sharedWithAmikaFriend === undefined) {
      return NextResponse.json({ error: 'Note ID and sharing status required' }, { status: 400 });
    }

    await prisma.diaryNote.updateAmikaFriendSharing({
      where: { noteId, amikaFriendUserId: amikaFriendId, userId },
      sharedWithAmikaFriend,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// Delete a note
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    await prisma.diaryNote.delete({
      where: { id: noteId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
