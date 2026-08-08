import * as SecureStore from 'expo-secure-store';
import { readPersistentCache, removePersistentCache, writePersistentCache } from './cache-storage';

const TOKEN_KEY = 'amika_session_token';
const API_CACHE_KEY = 'api-v1';
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
    void removePersistentCache(previousToken, [API_CACHE_KEY, 'memory-feed-v1']);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
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
  const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
  const form = new FormData();
  form.append('file', { uri, name: `memory.${extension}`, type: mime } as unknown as Blob);
  return api<{ url: string }>('/api/upload', { method: 'POST', body: form });
}
