import { api, getTokenSnapshot } from './api';
import { readPersistentCache, removePersistentCache, writePersistentCache } from './cache-storage';
import type { Memory } from '@/types';

type MemoryPage = { items: Memory[]; nextCursor: string | null };
type FeedSnapshot = MemoryPage & { updatedAt: number };

const PAGE_SIZE = 12;
const FRESH_FOR_MS = 5 * 60_000;
const MEMORY_CACHE_KEY = 'memory-feed-v2';

let ownerToken: string | null | undefined;
let snapshot: FeedSnapshot = { items: [], nextCursor: null, updatedAt: 0 };
let firstPageRequest: Promise<FeedSnapshot> | null = null;
let firstPageGeneration = 0;
let nextPageRequest: Promise<FeedSnapshot> | null = null;
let hydratedForToken: string | null | undefined;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let detailCache = new Map<string, Memory>();

function scheduleFeedWrite() {
  const token = ownerToken;
  if (!token) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void writePersistentCache(token, MEMORY_CACHE_KEY, snapshot);
  }, 120);
}

function resetForCurrentUser() {
  const currentToken = getTokenSnapshot();
  if (ownerToken !== currentToken) {
    ownerToken = currentToken;
    snapshot = { items: [], nextCursor: null, updatedAt: 0 };
    firstPageRequest = null;
    firstPageGeneration += 1;
    nextPageRequest = null;
    hydratedForToken = undefined;
    detailCache = new Map();
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
  }
}

export async function hydrateMemoryFeed() {
  resetForCurrentUser();
  const token = ownerToken;
  if (!token || hydratedForToken === token) return snapshot;
  const stored = await readPersistentCache<FeedSnapshot>(token, MEMORY_CACHE_KEY);
  if (stored && Array.isArray(stored.items) && typeof stored.updatedAt === 'number') {
    snapshot = stored;
  }
  hydratedForToken = token;
  return snapshot;
}

export function getMemoryFeedSnapshot() {
  resetForCurrentUser();
  return snapshot;
}

export function getCachedMemory(memoryId: string) {
  resetForCurrentUser();
  return snapshot.items.find((memory) => memory.id === memoryId) || detailCache.get(memoryId) || null;
}

export function cacheMemoryDetails(memories: Memory[]) {
  resetForCurrentUser();
  memories.forEach((memory) => detailCache.set(memory.id, memory));
}

export async function loadMemoryFeed(force = false) {
  resetForCurrentUser();
  await hydrateMemoryFeed();
  if (!force && snapshot.items.length && Date.now() - snapshot.updatedAt < FRESH_FOR_MS) {
    return snapshot;
  }
  // Pull-to-refresh can fire again while the refresh control is settling. Keep
  // the feed request single-flight even when callers explicitly bypass cache.
  if (firstPageRequest) return firstPageRequest;

  const generation = ++firstPageGeneration;
  const request = api<MemoryPage>(`/api/memories?scope=feed&limit=${PAGE_SIZE}`)
    .then((page) => {
      if (generation !== firstPageGeneration) return snapshot;
      snapshot = { ...page, updatedAt: Date.now() };
      scheduleFeedWrite();
      return snapshot;
    })
    .finally(() => {
      if (firstPageRequest === request) firstPageRequest = null;
    });
  firstPageRequest = request;
  return request;
}

export async function loadMoreMemories() {
  resetForCurrentUser();
  if (!snapshot.nextCursor) return snapshot;
  if (nextPageRequest) return nextPageRequest;

  nextPageRequest = api<MemoryPage>(
    `/api/memories?scope=feed&limit=${PAGE_SIZE}&cursor=${encodeURIComponent(snapshot.nextCursor)}`,
  )
    .then((page) => {
      const knownIds = new Set(snapshot.items.map((memory) => memory.id));
      snapshot = {
        items: [...snapshot.items, ...page.items.filter((memory) => !knownIds.has(memory.id))],
        nextCursor: page.nextCursor,
        updatedAt: snapshot.updatedAt,
      };
      scheduleFeedWrite();
      return snapshot;
    })
    .finally(() => { nextPageRequest = null; });
  return nextPageRequest;
}

export function updateCachedMemory(memoryId: string, update: Partial<Memory>) {
  resetForCurrentUser();
  firstPageGeneration += 1;
  firstPageRequest = null;
  snapshot = {
    ...snapshot,
    items: snapshot.items.map((memory) => memory.id === memoryId ? { ...memory, ...update } : memory),
  };
  const detail = detailCache.get(memoryId);
  if (detail) detailCache.set(memoryId, { ...detail, ...update });
  scheduleFeedWrite();
  return snapshot;
}

export async function prependCachedMemory(memory: Memory) {
  resetForCurrentUser();
  await hydrateMemoryFeed();
  resetForCurrentUser();
  firstPageGeneration += 1;
  firstPageRequest = null;
  snapshot = {
    ...snapshot,
    items: [memory, ...snapshot.items.filter((item) => item.id !== memory.id)],
    updatedAt: Date.now(),
  };
  scheduleFeedWrite();
  return snapshot;
}

export function removeCachedMemory(memoryId: string) {
  resetForCurrentUser();
  firstPageGeneration += 1;
  firstPageRequest = null;
  snapshot = {
    ...snapshot,
    items: snapshot.items.filter((memory) => memory.id !== memoryId),
  };
  detailCache.delete(memoryId);
  scheduleFeedWrite();
  return snapshot;
}

export function invalidateMemoryFeed() {
  resetForCurrentUser();
  firstPageGeneration += 1;
  firstPageRequest = null;
  snapshot = { ...snapshot, updatedAt: 0 };
  scheduleFeedWrite();
}

export async function clearMemoryFeedCache() {
  resetForCurrentUser();
  const token = ownerToken;
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  snapshot = { items: [], nextCursor: null, updatedAt: 0 };
  detailCache.clear();
  firstPageGeneration += 1;
  firstPageRequest = null;
  hydratedForToken = undefined;
  await removePersistentCache(token, [MEMORY_CACHE_KEY]);
}
