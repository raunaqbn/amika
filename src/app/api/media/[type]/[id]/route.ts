import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getAuthorizedImage } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DATA_URL = /^data:([^;,]+);base64,([\s\S]+)$/;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id } = await context.params;
  if (!['memory', 'user', 'friend'].includes(type)) {
    return NextResponse.json({ error: 'Unknown image type' }, { status: 404 });
  }

  const value = await getAuthorizedImage(userId, type as 'memory' | 'user' | 'friend', id);
  if (!value) return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  if (/^https?:\/\//i.test(value)) return NextResponse.redirect(value);

  const match = value.match(DATA_URL);
  if (!match) return NextResponse.json({ error: 'Image unavailable' }, { status: 404 });

  return new NextResponse(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

