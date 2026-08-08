import { api, getTokenSnapshot } from './api';
import type { Memory } from '@/types';

type MemoryPage = { items: Memory[]; nextCursor: string | null };
type FeedSnapshot = MemoryPage & { updatedAt: number };

const PAGE_SIZE = 12;
const FRESH_FOR_MS = 30_000;

let ownerToken: string | null | undefined;
let snapshot: FeedSnapshot = { items: [], nextCursor: null, updatedAt: 0 };
let firstPageRequest: Promise<FeedSnapshot> | null = null;
let nextPageRequest: Promise<FeedSnapshot> | null = null;

function resetForCurrentUser() {
  const currentToken = getTokenSnapshot();
  if (ownerToken !== currentToken) {
    ownerToken = currentToken;
    snapshot = { items: [], nextCursor: null, updatedAt: 0 };
    firstPageRequest = null;
    nextPageRequest = null;
  }
}

export function getMemoryFeedSnapshot() {
  resetForCurrentUser();
  return snapshot;
}

export async function loadMemoryFeed(force = false) {
  resetForCurrentUser();
  if (!force && snapshot.items.length && Date.now() - snapshot.updatedAt < FRESH_FOR_MS) {
    return snapshot;
  }
  if (firstPageRequest) return firstPageRequest;

  firstPageRequest = api<MemoryPage>(`/api/memories?scope=feed&limit=${PAGE_SIZE}`)
    .then((page) => {
      snapshot = { ...page, updatedAt: Date.now() };
      return snapshot;
    })
    .finally(() => { firstPageRequest = null; });
  return firstPageRequest;
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
      return snapshot;
    })
    .finally(() => { nextPageRequest = null; });
  return nextPageRequest;
}

export function updateCachedMemory(memoryId: string, update: Partial<Memory>) {
  resetForCurrentUser();
  snapshot = {
    ...snapshot,
    items: snapshot.items.map((memory) => memory.id === memoryId ? { ...memory, ...update } : memory),
  };
  return snapshot;
}

export function invalidateMemoryFeed() {
  resetForCurrentUser();
  snapshot = { ...snapshot, updatedAt: 0 };
}
