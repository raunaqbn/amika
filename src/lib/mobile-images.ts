export function wantsCompactImages(request: Request) {
  return request.headers.get('x-amika-inline-images') !== '1';
}

export function mediaImageUrl(
  request: Request,
  type: 'memory' | 'user' | 'friend' | 'diary' | 'story',
  id: string,
) {
  return `${new URL(request.url).origin}/api/media/${type}/${encodeURIComponent(id)}`;
}

export function compactImageUrl(
  request: Request,
  type: 'memory' | 'user' | 'friend' | 'diary' | 'story',
  id: string,
  value: string | null | undefined,
) {
  if (!value || !wantsCompactImages(request)) return value || null;
  return mediaImageUrl(request, type, id);
}

export function isMediaImageUrl(
  request: Request,
  type: 'memory' | 'user' | 'friend' | 'diary' | 'story',
  id: string,
  value: unknown,
) {
  if (typeof value !== 'string') return false;
  try {
    const requestUrl = new URL(request.url);
    const valueUrl = new URL(value, requestUrl);
    return valueUrl.origin === requestUrl.origin
      && valueUrl.pathname === `/api/media/${type}/${encodeURIComponent(id)}`;
  } catch {
    return false;
  }
}
