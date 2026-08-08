import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai';
import { getUserId } from '@/lib/auth';

async function generateAnalysis(content: string): Promise<string | null> {
  try {
    const { text } = await generateText({
      model: getModel() as any,
      prompt: `You are a compassionate therapist providing reflective analysis on a diary entry.

Analyze the following diary entry and provide a thoughtful, empathetic reflection that:
- Acknowledges the emotions and experiences shared
- Offers insights into patterns, thoughts, or feelings
- Suggests positive perspectives or areas for growth
- Validates their feelings while being supportive

Keep your reflection concise (2-3 paragraphs) and warm in tone, as if speaking directly to the person.

Diary Entry:
${content}

Provide your therapeutic reflection:`,
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
    return NextResponse.json(notes);
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
    const { title, content, imageUrl, friendIds, friendTags } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Generate AI analysis
    const analysis = await generateAnalysis(content);

    // Support both legacy friendIds and new friendTags with sharing
    const note = await prisma.diaryNote.create({
      data: {
        userId,
        title: title?.trim() || null,
        content,
        analysis,
        imageUrl: imageUrl || null,
        friendIds: Array.isArray(friendIds)
          ? (friendIds.filter((id: string) => typeof id === 'string') as string[])
          : [],
        friendTags: Array.isArray(friendTags) ? friendTags : undefined,
      },
    });

    // Auto-share with Amika friends if any have sharedWithFriend enabled
    if (Array.isArray(friendTags) && friendTags.length > 0) {
      try {
        // Get all user's friends to find Amika friends
        const friends = await prisma.friend.findMany({ userId });

        // Share with Amika friends who have sharedWithFriend enabled
        for (const tag of friendTags) {
          if (tag.sharedWithFriend) {
            const friend = friends.find((f: { id: string }) => f.id === tag.friendId);
            if (friend && friend.linkedUserId) {
              try {
                await prisma.sharedItem.create({
                  sharedByUserId: userId,
                  sharedWithUserId: friend.linkedUserId,
                  itemType: 'note',
                  itemId: note.id,
                  message: undefined,
                });
              } catch (shareError) {
                // Ignore duplicate share errors
                console.error('Error sharing note with friend:', shareError);
              }
            }
          }
        }
      } catch (shareError) {
        console.error('Error auto-sharing note:', shareError);
      }
    }

    return NextResponse.json(note);
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
    const { id, title, content, imageUrl, friendIds, friendTags } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Get existing note to check if content changed
    const existingNotes = await prisma.diaryNote.findMany({ userId });
    const existingNote = existingNotes.find(n => n.id === id);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    let analysis = undefined;

    // Only regenerate analysis if content has changed
    if (content && content !== existingNote.content) {
      analysis = await generateAnalysis(content);
    }

    const note = await prisma.diaryNote.update({
      where: { id, userId },
      data: {
        title: title === undefined ? undefined : title?.trim() || null,
        content,
        analysis,
        imageUrl: imageUrl === undefined ? undefined : imageUrl || null,
        friendIds: Array.isArray(friendIds)
          ? (friendIds.filter((fid: string) => typeof fid === 'string') as string[])
          : undefined,
      },
    });

    // Handle sharing with Amika friends
    if (Array.isArray(friendTags) && friendTags.length > 0) {
      try {
        // Get all user's friends to find Amika friends
        const friends = await prisma.friend.findMany({ userId });

        // Share with Amika friends who have sharedWithFriend enabled
        for (const tag of friendTags) {
          if (tag.sharedWithFriend) {
            const friend = friends.find((f: { id: string }) => f.id === tag.friendId);
            if (friend && friend.linkedUserId) {
              try {
                await prisma.sharedItem.create({
                  sharedByUserId: userId,
                  sharedWithUserId: friend.linkedUserId,
                  itemType: 'note',
                  itemId: note.id,
                  message: undefined,
                });
              } catch (shareError) {
                // Ignore duplicate share errors (already shared)
                console.error('Error sharing note with friend:', shareError);
              }
            }
          }
        }
      } catch (shareError) {
        console.error('Error auto-sharing note:', shareError);
      }
    }

    return NextResponse.json(note);
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
