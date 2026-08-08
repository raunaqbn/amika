import * as SecureStore from 'expo-secure-store';
import { File, UploadType } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { readPersistentCache, removePersistentCache, writePersistentCache } from './cache-storage';

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

  const token = await getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const extension = file.extension.toLowerCase();
  const mimeType = file.type || (extension === '.png' ? 'image/png' : 'image/jpeg');
  const response = await file.upload(`${API_URL}/api/upload`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    headers,
    sessionType: 'foreground',
  });
  const data = JSON.parse(response.body || '{}') as { url?: string; error?: string };
  if (response.status < 200 || response.status >= 300 || !data.url) {
    throw new Error(data.error || 'The photo could not be uploaded. Please try again.');
  }
  return { url: data.url };
}

export async function prepareImageForUpload(uri: string, width: number, height: number) {
  const maxDimension = Math.max(width, height);
  const context = ImageManipulator.manipulate(uri);
  if (maxDimension > 1280) {
    if (width >= height) context.resize({ width: 1280, height: null });
    else context.resize({ width: null, height: 1280 });
  }
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.68 });
  return result.uri;
}

export function imageSource(uri?: string | null) {
  if (!uri) return undefined;
  if (!uri.startsWith(`${API_URL}/api/media/`)) return uri;
  const token = getTokenSnapshot();
  return token ? { uri, headers: { Authorization: `Bearer ${token}` } } : { uri };
}
