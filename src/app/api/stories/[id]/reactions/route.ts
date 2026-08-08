import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json(await prisma.storyReaction.toggle({ storyId: id, userId }));
  } catch {
    return NextResponse.json({ error: 'Story unavailable' }, { status: 404 });
  }
}
