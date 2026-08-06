import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    return NextResponse.json(await prisma.memoryComment.findMany({ memoryId: id, userId }));
  } catch {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content || content.length > 240) {
    return NextResponse.json({ error: 'Write a reply first.' }, { status: 400 });
  }

  return NextResponse.json(
    await prisma.memoryComment.create({ memoryId: id, userId, content })
  );
}
