import { createHash } from 'node:crypto';
import { get, head, put } from '@vercel/blob';

export const BLOB_REFERENCE_PREFIX = 'vercel-blob:';

const DATA_URL = /^data:([^;,]+);base64,([\s\S]+)$/;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const EXTENSIONS: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type ParsedDataUrl = {
  contentType: string;
  bytes: Buffer;
};

export function parseImageDataUrl(value: string): ParsedDataUrl | null {
  const match = value.match(DATA_URL);
  if (!match) return null;

  const contentType = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0) throw new Error('Image data is empty');
  return { contentType, bytes };
}

export function blobPathname(value: string): string | null {
  if (!value.startsWith(BLOB_REFERENCE_PREFIX)) return null;
  const pathname = value.slice(BLOB_REFERENCE_PREFIX.length);
  return pathname.length > 0 ? pathname : null;
}

export function blobReference(pathname: string): string {
  return `${BLOB_REFERENCE_PREFIX}${pathname}`;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100) || 'unknown';
}

export async function persistImage(
  value: string | null | undefined,
  options: { ownerId: string; kind: 'diary' | 'friend' | 'memory' | 'profile' | 'upload' },
): Promise<string | null | undefined> {
  if (value == null || value === '' || blobPathname(value) || /^https?:\/\//i.test(value)) {
    return value;
  }

  const parsed = parseImageDataUrl(value);
  if (!parsed) throw new Error('Image must be a base64 data URL or an HTTP URL');

  return persistImageBytes(parsed.bytes, parsed.contentType, options);
}

export async function persistImageBytes(
  bytes: Buffer,
  contentType: string,
  options: { ownerId: string; kind: 'diary' | 'friend' | 'memory' | 'profile' | 'upload' },
): Promise<string> {
  const normalizedType = contentType.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.has(normalizedType)) {
    throw new Error(`Unsupported image type: ${normalizedType}`);
  }
  if (bytes.length === 0) throw new Error('Image data is empty');

  const digest = createHash('sha256').update(bytes).digest('hex');
  const pathname = [
    'images',
    options.kind,
    safeSegment(options.ownerId),
    `${digest}.${EXTENSIONS[normalizedType]}`,
  ].join('/');

  let metadata;
  try {
    metadata = await head(pathname);
  } catch {
    metadata = await put(pathname, bytes, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31_536_000,
      contentType: normalizedType,
    });
  }

  if ('size' in metadata && metadata.size !== bytes.length) {
    throw new Error('Stored image size does not match the upload');
  }

  return blobReference(metadata.pathname);
}

export async function getPrivateImage(pathname: string, ifNoneMatch?: string | null) {
  return get(pathname, {
    access: 'private',
    ...(ifNoneMatch ? { ifNoneMatch } : {}),
  });
}
