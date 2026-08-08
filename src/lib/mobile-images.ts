const DATA_IMAGE_PREFIX = 'data:image/';

export function wantsCompactImages(request: Request) {
  return request.headers.get('x-amika-compact-images') === '1';
}

export function compactImageUrl(
  request: Request,
  type: 'memory' | 'user' | 'friend',
  id: string,
  value: string | null | undefined,
) {
  if (!value || !wantsCompactImages(request) || !value.startsWith(DATA_IMAGE_PREFIX)) return value || null;
  return `${new URL(request.url).origin}/api/media/${type}/${encodeURIComponent(id)}`;
}

