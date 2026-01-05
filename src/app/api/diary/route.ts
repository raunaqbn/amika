import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai';

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

export async function GET() {
  try {
    const notes = await prisma.diaryNote.findMany();
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching diary notes:', error);
    return NextResponse.json({ error: 'Failed to fetch diary notes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, imageUrl, friendIds } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Generate AI analysis
    const analysis = await generateAnalysis(content);

    const note = await prisma.diaryNote.create({
      data: {
        title: title?.trim() || null,
        content,
        analysis,
        imageUrl: imageUrl || null,
        friendIds: Array.isArray(friendIds)
          ? (friendIds.filter((id: string) => typeof id === 'string') as string[])
          : [],
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error creating diary note:', error);
    return NextResponse.json({ error: 'Failed to create diary note' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, imageUrl, friendIds } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Get existing note to check if content changed
    const existingNotes = await prisma.diaryNote.findMany();
    const existingNote = existingNotes.find(n => n.id === id);

    let analysis = undefined;

    // Only regenerate analysis if content has changed
    if (content && existingNote && content !== existingNote.content) {
      analysis = await generateAnalysis(content);
    }

    const note = await prisma.diaryNote.update({
      where: { id },
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

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating diary note:', error);
    return NextResponse.json({ error: 'Failed to update diary note' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID required' }, { status: 400 });
    }

    await prisma.diaryNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting diary note:', error);
    return NextResponse.json({ error: 'Failed to delete diary note' }, { status: 500 });
  }
}
