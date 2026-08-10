export const MAX_PREPARED_IMAGE_EDGE = 1024;

export function fittedMediaDimensions(width: number, height: number, maxEdge = MAX_PREPARED_IMAGE_EDGE) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 1, height: 1 };
  }
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function jpegFileName(fileName?: string | null) {
  const base = (fileName || `photo-${Date.now()}`).replace(/\.[^.]+$/, '');
  return `${base || 'photo'}.jpg`;
}
