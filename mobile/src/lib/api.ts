import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'amika_session_token';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://amika.vercel.app').replace(/\/$/, '');

let tokenCache: string | null | undefined;
const responseCache = new Map<string, { value: unknown; updatedAt: number }>();
const responseRequests = new Map<string, Promise<unknown>>();

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
  if (tokenCache !== token) {
    responseCache.clear();
    responseRequests.clear();
  }
  tokenCache = token;
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Keep the in-memory token so local unsigned simulator sessions still work.
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

export function invalidateApiCache(path?: string) {
  if (!path) {
    responseCache.clear();
    return;
  }
  responseCache.delete(path);
}

export async function apiCached<T>(path: string, options: { force?: boolean; maxAgeMs?: number } = {}) {
  const maxAgeMs = options.maxAgeMs ?? 30_000;
  const cached = responseCache.get(path);
  if (!options.force && cached && Date.now() - cached.updatedAt < maxAgeMs) {
    return cached.value as T;
  }

  const activeRequest = responseRequests.get(path);
  if (activeRequest) return activeRequest as Promise<T>;

  const request = api<T>(path)
    .then((value) => {
      responseCache.set(path, { value, updatedAt: Date.now() });
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
