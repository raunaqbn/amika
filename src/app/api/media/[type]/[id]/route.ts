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

  const rawMediaIndex = request.nextUrl.searchParams.get('index');
  const mediaIndex = rawMediaIndex === null ? undefined : Number(rawMediaIndex);
  if (mediaIndex !== undefined && (type !== 'memory' || !Number.isInteger(mediaIndex) || mediaIndex < 0 || mediaIndex > 9)) {
    return NextResponse.json({ error: 'Unknown media item' }, { status: 404 });
  }

  const value = await getAuthorizedImage(
    userId,
    type as 'memory' | 'user' | 'friend' | 'diary' | 'story',
    id,
    mediaIndex,
  );
  if (!value) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  const pathname = blobPathname(value);
  if (pathname) {
    const result = await getPrivateImage(pathname, request.headers.get('if-none-match'), request.headers.get('range'));
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

    const contentRange = result.headers.get('content-range');
    const contentLength = result.headers.get('content-length') || String(result.blob.size);
    return new NextResponse(result.stream, {
      status: contentRange ? 206 : 200,
      headers: {
        'Cache-Control': 'private, no-cache',
        'Content-Length': contentLength,
        'Content-Type': result.blob.contentType,
        'Accept-Ranges': result.headers.get('accept-ranges') || 'bytes',
        ...(contentRange ? { 'Content-Range': contentRange } : {}),
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
