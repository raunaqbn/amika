import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await prisma.memoryReaction.toggle({
    memoryId: id,
    userId,
    emoji: typeof body.emoji === 'string' ? body.emoji.slice(0, 24) : 'heart',
  });
  return NextResponse.json(result);
}
