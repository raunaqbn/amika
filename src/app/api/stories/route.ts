import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const viewerId = await getUserId();
  if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const ownerId = params.get('userId');
  const stories = params.get('scope') === 'feed'
    ? await prisma.story.findFeed({ viewerId })
    : await prisma.story.findActive({ ownerId: ownerId || viewerId, viewerId });
  return NextResponse.json(stories.map((story) => ({
    ...story,
    imageUrl: story.hasImage ? mediaImageUrl(request, 'story', story.id) : null,
  })));
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const visibility = body.visibility === 'friends' ? 'friends' : 'public';
  if (!imageUrl) return NextResponse.json({ error: 'Choose a photo for your story.' }, { status: 400 });
  if (content.length > 280) return NextResponse.json({ error: 'Keep the caption under 280 characters.' }, { status: 400 });

  const storedImage = await persistImage(imageUrl, { ownerId: userId, kind: 'story' });
  if (!storedImage) return NextResponse.json({ error: 'Choose a photo for your story.' }, { status: 400 });
  const story = await prisma.story.create({ data: { userId, imageUrl: storedImage, content, visibility } });
  return NextResponse.json({ ...story, imageUrl: mediaImageUrl(request, 'story', story.id), reactionCount: 0, commentCount: 0, reactedByMe: false, isOwn: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Story ID required' }, { status: 400 });
  try {
    await prisma.story.delete({ id, userId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }
}
