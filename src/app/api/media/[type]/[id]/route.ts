import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getAuthorizedImage } from '@/lib/db';
import { blobPathname, getPrivateImage } from '@/lib/media-storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DATA_URL = /^data:([^;,]+);base64,([\s\S]+)$/;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, id } = await context.params;
  if (!['memory', 'user', 'friend', 'diary', 'story'].includes(type)) {
    return NextResponse.json({ error: 'Unknown image type' }, { status: 404 });
  }

  const value = await getAuthorizedImage(userId, type as 'memory' | 'user' | 'friend' | 'diary' | 'story', id);
  if (!value) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  const pathname = blobPathname(value);
  if (pathname) {
    const result = await getPrivateImage(pathname, request.headers.get('if-none-match'));
    if (!result) return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'private, no-cache',
          ETag: result.blob.etag,
        },
      });
    }

    return new NextResponse(result.stream, {
      headers: {
        'Cache-Control': 'private, no-cache',
        'Content-Length': String(result.blob.size),
        'Content-Type': result.blob.contentType,
        ETag: result.blob.etag,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  if (/^https?:\/\//i.test(value)) return NextResponse.redirect(value);

  const match = value.match(DATA_URL);
  if (!match) return NextResponse.json({ error: 'Image unavailable' }, { status: 404 });

  return new NextResponse(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
