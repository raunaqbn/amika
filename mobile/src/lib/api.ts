import * as SecureStore from 'expo-secure-store';
import { File, UploadType } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { readPersistentCache, removePersistentCache, writePersistentCache } from './cache-storage';
import { uploadedPathname, uploadPercentage } from './media-upload';

const TOKEN_KEY = 'amika_session_token';
const API_CACHE_KEY = 'api-v2';
const DEFAULT_MAX_AGE_MS = 5 * 60_000;
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://amika.vercel.app').replace(/\/$/, '');

let tokenCache: string | null | undefined;
const responseCache = new Map<string, { value: unknown; updatedAt: number }>();
const responseRequests = new Map<string, Promise<unknown>>();
let hydratedForToken: string | null | undefined;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

type StoredApiCache = Array<[string, { value: unknown; updatedAt: number }]>;

function scheduleApiCacheWrite() {
  const token = tokenCache;
  if (!token) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void writePersistentCache(token, API_CACHE_KEY, [...responseCache.entries()]);
  }, 120);
}

export async function hydrateApiCache() {
  const token = await getToken();
  if (!token || hydratedForToken === token) return;
  const stored = await readPersistentCache<StoredApiCache>(token, API_CACHE_KEY);
  if (Array.isArray(stored)) {
    responseCache.clear();
    stored.forEach(([path, entry]) => {
      if (typeof path === 'string' && entry && typeof entry.updatedAt === 'number') {
        responseCache.set(path, entry);
      }
    });
  }
  hydratedForToken = token;
}

export function getTokenSnapshot() {
  return tokenCache;
}

export async function getToken() {
  if (tokenCache !== undefined) return tokenCache;
  try {
    tokenCache = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // Unsigned simulators can lack the keychain entitlement; production builds are signed.
    tokenCache = null;
  }
  return tokenCache;
}

export async function setToken(token: string | null) {
  const previousToken = tokenCache;
  if (tokenCache !== token) {
    responseCache.clear();
    responseRequests.clear();
    hydratedForToken = undefined;
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
  }
  tokenCache = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Keep the in-memory token so local unsigned simulator sessions still work.
  }
  if (previousToken && previousToken !== token) {
    void removePersistentCache(previousToken, [API_CACHE_KEY, 'api-v1', 'memory-feed-v1', 'memory-feed-v2']);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Amika-Compact-Images', '1');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.';
    throw new Error(detail);
  }
  return data as T;
}

export function getCachedApiData<T>(path: string) {
  return responseCache.get(path)?.value as T | undefined;
}

export function setCachedApiData<T>(path: string, value: T) {
  responseCache.set(path, { value, updatedAt: Date.now() });
  scheduleApiCacheWrite();
  return value;
}

export function invalidateApiCache(path?: string) {
  if (!path) {
    responseCache.clear();
    scheduleApiCacheWrite();
    return;
  }
  responseCache.delete(path);
  scheduleApiCacheWrite();
}

export async function apiCached<T>(path: string, options: { force?: boolean; maxAgeMs?: number } = {}) {
  await hydrateApiCache();
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const cached = responseCache.get(path);
  if (!options.force && cached && Date.now() - cached.updatedAt < maxAgeMs) {
    return cached.value as T;
  }

  const activeRequest = responseRequests.get(path);
  if (activeRequest) return activeRequest as Promise<T>;

  const request = api<T>(path)
    .then((value) => {
      responseCache.set(path, { value, updatedAt: Date.now() });
      scheduleApiCacheWrite();
      return value;
    })
    .finally(() => responseRequests.delete(path));
  responseRequests.set(path, request);
  return request;
}

export async function uploadImage(uri: string) {
  const file = new File(uri);
  if (!file.exists) throw new Error('The selected photo is no longer available. Please choose it again.');
  const extension = file.extension.toLowerCase();
  const mimeType = file.type || (extension === '.png' ? 'image/png' : 'image/jpeg');
  if (file.size > 2 * 1024 * 1024) throw new Error('The prepared photo is still too large. Please choose a different photo.');
  const base64 = await file.base64();
  return { url: `data:${mimeType};base64,${base64}` };
}

export async function uploadMemoryMedia(input: {
  uri: string;
  ownerId: string;
  fileName?: string | null;
  mimeType?: string | null;
  type: 'image' | 'video';
  onProgress?: (percentage: number) => void;
}) {
  const file = new File(input.uri);
  if (!file.exists) throw new Error('One of the selected files is no longer available. Please choose it again.');
  const maxBytes = input.type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(input.type === 'video' ? 'Videos must be 100 MB or smaller.' : 'Photos must be 10 MB or smaller.');
  }
  const rawName = input.fileName || file.name || `${input.type}-${Date.now()}`;
  const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
  const token = await getToken();
  const pathname = `media/${input.ownerId}/${safeName}`;
  const mimeType = input.mimeType || file.type || (input.type === 'video' ? 'video/mp4' : 'image/jpeg');
  const tokenResponse = await fetch(`${API_URL}/api/upload/client`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      type: 'blob.generate-client-token',
      payload: { pathname, clientPayload: null, multipart: false },
    }),
  });
  if (!tokenResponse.ok) throw new Error('Amika could not start the media upload. Please try again.');
  const { clientToken } = await tokenResponse.json() as { clientToken?: string };
  if (!clientToken) throw new Error('Amika could not authorize the media upload.');
  const storeId = clientToken.split('_')[3];
  if (!storeId) throw new Error('Amika received an invalid upload token.');
  const uploadResult = await file.upload(`https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    mimeType,
    sessionType: 'foreground',
    headers: {
      Authorization: `Bearer ${clientToken}`,
      'x-api-version': '12',
      'x-api-blob-request-attempt': '0',
      'x-api-blob-request-id': `${storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      'x-vercel-blob-access': 'private',
      'x-vercel-blob-store-id': storeId,
      'x-content-length': String(file.size),
      'x-content-type': mimeType,
    },
    onProgress: ({ bytesSent, totalBytes }) => {
      input.onProgress?.(uploadPercentage(bytesSent, totalBytes));
    },
  });
  const storedPathname = uploadedPathname(uploadResult.body, uploadResult.status);
  input.onProgress?.(100);
  return { pathname: storedPathname };
}

export async function prepareImageForUpload(uri: string, width: number, height: number) {
  const maxDimension = Math.max(width, height);
  const context = ImageManipulator.manipulate(uri);
  let rendered: Awaited<ReturnType<typeof context.renderAsync>> | null = null;
  try {
    if (maxDimension > 1024) {
      if (width >= height) context.resize({ width: 1024, height: null });
      else context.resize({ width: null, height: 1024 });
    }
    rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.55 });
    return result.uri;
  } finally {
    rendered?.release();
    context.release();
  }
}

export function imageSource(uri?: string | null) {
  if (!uri) return undefined;
  if (!uri.startsWith(`${API_URL}/api/media/`)) return uri;
  const token = getTokenSnapshot();
  return token ? { uri, headers: { Authorization: `Bearer ${token}` } } : { uri };
}

export function mediaSource(uri?: string | null) {
  if (!uri) return null;
  if (!uri.startsWith(`${API_URL}/api/media/`)) return { uri };
  const token = getTokenSnapshot();
  return { uri, headers: token ? { Authorization: `Bearer ${token}` } : undefined };
}
