import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { compactImageUrl } from '@/lib/mobile-images';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const comments = await prisma.storyComment.findMany({ storyId: id, userId });
    return NextResponse.json(comments.map((comment) => ({
      ...comment,
      author: { ...comment.author, profileImage: compactImageUrl(request, 'user', comment.author.id, comment.author.profileImage) },
    })));
  } catch {
    return NextResponse.json({ error: 'Story unavailable' }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 240) return NextResponse.json({ error: 'Write a reply first.' }, { status: 400 });
  try {
    const { id } = await params;
    return NextResponse.json(await prisma.storyComment.create({ storyId: id, userId, content }), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Story unavailable' }, { status: 404 });
  }
}
