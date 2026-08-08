import { api } from './api';
import type { NotificationCounts } from '@/types';

const EMPTY: NotificationCounts = { connectionRequests: 0, sharedItems: 0, chatNotifications: 0 };
let snapshot = EMPTY;
let activeRequest: Promise<NotificationCounts> | null = null;
const listeners = new Set<(counts: NotificationCounts) => void>();

export function getNotificationCountSnapshot() {
  return snapshot;
}

export function subscribeNotificationCount(listener: (counts: NotificationCounts) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function refreshNotificationCount() {
  if (activeRequest) return activeRequest;
  activeRequest = api<NotificationCounts>('/api/shared-items?pendingCount=true&itemType=memory')
    .then((counts) => {
      snapshot = counts;
      listeners.forEach((listener) => listener(counts));
      return counts;
    })
    .finally(() => { activeRequest = null; });
  return activeRequest;
}

export function resetNotificationCount() {
  snapshot = EMPTY;
  listeners.forEach((listener) => listener(EMPTY));
}
