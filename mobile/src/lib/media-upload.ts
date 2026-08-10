export function uploadPercentage(bytesSent: number, totalBytes: number) {
  if (!Number.isFinite(bytesSent) || !Number.isFinite(totalBytes) || totalBytes <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((bytesSent / totalBytes) * 100)));
}

export function uploadedPathname(body: string, status: number) {
  type BlobUploadResponse = { pathname?: unknown; error?: { message?: unknown } };
  let result: BlobUploadResponse | null = null;
  try {
    result = JSON.parse(body) as BlobUploadResponse;
  } catch {
    result = null;
  }

  if (status < 200 || status >= 300 || typeof result?.pathname !== 'string' || !result.pathname) {
    const message = typeof result?.error?.message === 'string' ? result.error.message : null;
    throw new Error(message || 'The media upload failed. Please try again.');
  }
  return result.pathname;
}
