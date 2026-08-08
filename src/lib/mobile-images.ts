export function wantsCompactImages(request: Request) {
  return request.headers.get('x-amika-inline-images') !== '1';
}

export function mediaImageUrl(
  request: Request,
  type: 'memory' | 'user' | 'friend',
  id: string,
) {
  return `${new URL(request.url).origin}/api/media/${type}/${encodeURIComponent(id)}`;
}

export function compactImageUrl(
  request: Request,
  type: 'memory' | 'user' | 'friend',
  id: string,
  value: string | null | undefined,
) {
  if (!value || !wantsCompactImages(request)) return value || null;
  return mediaImageUrl(request, type, id);
}
