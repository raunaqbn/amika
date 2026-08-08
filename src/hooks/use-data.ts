'use client';

import useSWR, { mutate } from 'swr';

export interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  email?: string | null;
  linkedUserId?: string | null;
  profileImage?: string | null;
  customProfileImage?: string | null;
  memoriesCount?: number;
  lastEngagedAt?: Date | string | null;
}

export const CACHE_KEYS = {
  FRIENDS: '/api/friends',
  MEMORIES: '/api/memories',
  NOTIFICATIONS_PENDING: '/api/shared-items?pendingCount=true',
};

export const revalidateFriends = () => mutate(CACHE_KEYS.FRIENDS);
export const revalidateMemories = () => mutate(CACHE_KEYS.MEMORIES);
export const revalidateNotifications = () => mutate(CACHE_KEYS.NOTIFICATIONS_PENDING);

interface UseDataOptions {
  refreshInterval?: number;
  revalidateOnMount?: boolean;
  isPaused?: boolean;
}

export function useFriends(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateFriends } = useSWR<Friend[]>(
    CACHE_KEYS.FRIENDS,
    {
      dedupingInterval: 60000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    friends: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateFriends,
    refresh: () => mutateFriends(),
  };
}

interface NotificationCountResponse {
  connectionRequests: number;
  sharedItems: number;
  chatNotifications: number;
}

export function useNotificationCount(options: UseDataOptions = {}) {
  const { data, error, isLoading, mutate: mutatePendingCount } = useSWR<NotificationCountResponse>(
    options.isPaused ? null : CACHE_KEYS.NOTIFICATIONS_PENDING,
    {
      dedupingInterval: 30000,
      refreshInterval: options.refreshInterval ?? 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
    }
  );

  const pendingCount = data
    ? (data.connectionRequests ?? 0) + (data.sharedItems ?? 0) + (data.chatNotifications ?? 0)
    : 0;

  return {
    pendingCount,
    connectionRequests: data?.connectionRequests ?? 0,
    sharedItems: data?.sharedItems ?? 0,
    unreadMessages: data?.chatNotifications ?? 0,
    isLoading,
    error,
    mutate: mutatePendingCount,
    refresh: () => mutatePendingCount(),
  };
}
