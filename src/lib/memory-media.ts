import { blobPathname, blobReference } from './media-storage.ts';

export const MAX_MEMORY_MEDIA = 10;
export const MAX_MEMORY_VIDEO_BYTES = 100 * 1024 * 1024;

export type MemoryMediaType = 'image' | 'video';

export type StoredMemoryMedia = {
  type: MemoryMediaType;
  storageRef: string;
  width?: number;
  height?: number;
  durationMs?: number;
};

export type MemoryMedia = Omit<StoredMemoryMedia, 'storageRef'> & { url: string };

function positiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

export function parseStoredMemoryMedia(value: unknown): StoredMemoryMedia[] {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_MEMORY_MEDIA).flatMap((item): StoredMemoryMedia[] => {
      if (!item || (item.type !== 'image' && item.type !== 'video') || typeof item.storageRef !== 'string') return [];
      return [{
        type: item.type,
        storageRef: item.storageRef,
        width: positiveNumber(item.width),
        height: positiveNumber(item.height),
        durationMs: item.type === 'video' ? positiveNumber(item.durationMs) : undefined,
      }];
    });
  } catch {
    return [];
  }
}

export function normalizeIncomingMemoryMedia(value: unknown, ownerId: string): StoredMemoryMedia[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_MEMORY_MEDIA) return null;
  const ownerPrefix = `media/${ownerId}/`;
  const normalized: StoredMemoryMedia[] = [];
  for (const item of value) {
    if (!item || (item.type !== 'image' && item.type !== 'video')) return null;
    const rawReference = typeof item.storageRef === 'string'
      ? item.storageRef
      : typeof item.pathname === 'string'
        ? blobReference(item.pathname)
        : '';
    const pathname = blobPathname(rawReference);
    if (!pathname || !pathname.startsWith(ownerPrefix)) return null;
    normalized.push({
      type: item.type,
      storageRef: blobReference(pathname),
      width: positiveNumber(item.width),
      height: positiveNumber(item.height),
      durationMs: item.type === 'video' ? positiveNumber(item.durationMs) : undefined,
    });
  }
  return normalized;
}

export function memoryMediaUrl(request: Request, memoryId: string, index: number) {
  const url = new URL(`/api/media/memory/${encodeURIComponent(memoryId)}`, new URL(request.url).origin);
  url.searchParams.set('index', String(index));
  return url.toString();
}

export function serializeMemoryMedia(items: StoredMemoryMedia[]) {
  return items.length ? JSON.stringify(items) : null;
}
