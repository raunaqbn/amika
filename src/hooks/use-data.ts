'use client';

import useSWR, { mutate } from 'swr';

// Types
export interface Friend {
  id: string;
  name: string;
  birthday?: Date | null;
  lastContact?: Date | null;
  notes?: string | null;
  email?: string | null;
  linkedUserId?: string | null;
  profileImage?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  category?: string | null;
  friendId: string;
  completed?: boolean;
  friends?: { id: string; name: string }[];
}

export interface Collaborator {
  id: string;
  friendId: string;
  friendName: string;
  profileImage: string | null;
}

export interface EventPlan {
  id: string;
  title: string;
  description: string | null;
  status: string;
  eventDate: string | null;
  eventTime: string | null;
  selectedEventId: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export interface Trip {
  id: string;
  title: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
}

export interface Memory {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  friendId: string;
  friendIds?: string[];
  friend?: {
    id: string;
    name: string;
    profileImage?: string | null;
  } | null;
  sharedWithFriend?: boolean;
}

export interface SharedItem {
  id: string;
  itemId: string;
  sharedByUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  sharedBy: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  item?: {
    id: string;
    content?: string;
    imageUrl?: string | null;
    createdAt?: string;
  };
}

// Cache keys for manual revalidation
export const CACHE_KEYS = {
  FRIENDS: '/api/friends',
  EVENTS: '/api/events',
  EVENT_PLANS: '/api/event-plans',
  TRIPS: '/api/trips',
  MEMORIES: '/api/memories',
  NOTIFICATIONS_PENDING: '/api/shared-items?pendingCount=true',
  CONNECTIONS_PENDING: '/api/connections?type=received&status=pending',
  SHARED_ITEMS_PENDING: '/api/shared-items?type=received&status=pending',
  CHAT_NOTIFICATIONS: '/api/chat-notifications?unreadOnly=true',
};

// Revalidation helpers
export const revalidateFriends = () => mutate(CACHE_KEYS.FRIENDS);
export const revalidateEvents = () => mutate(CACHE_KEYS.EVENTS);
export const revalidateEventPlans = () => mutate(CACHE_KEYS.EVENT_PLANS);
export const revalidateTrips = () => mutate(CACHE_KEYS.TRIPS);
export const revalidateMemories = () => mutate(CACHE_KEYS.MEMORIES);
export const revalidateNotifications = () => {
  mutate(CACHE_KEYS.NOTIFICATIONS_PENDING);
  mutate(CACHE_KEYS.CONNECTIONS_PENDING);
  mutate(CACHE_KEYS.SHARED_ITEMS_PENDING);
  mutate(CACHE_KEYS.CHAT_NOTIFICATIONS);
};

// Hook options type
interface UseDataOptions {
  // Refresh interval in milliseconds (0 = disabled)
  refreshInterval?: number;
  // Whether to revalidate on mount
  revalidateOnMount?: boolean;
  // Whether to fetch immediately
  isPaused?: boolean;
}

/**
 * Hook for fetching friends list
 * Cache time: 5 minutes (stale-while-revalidate)
 */
export function useFriends(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateFriends } = useSWR<Friend[]>(
    CACHE_KEYS.FRIENDS,
    {
      // Friends list rarely changes, use longer cache
      dedupingInterval: 60000, // 1 minute deduplication
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

/**
 * Hook for fetching events list
 * Cache time: 2 minutes (more frequent updates for events)
 */
export function useEvents(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateEvents } = useSWR<Event[]>(
    CACHE_KEYS.EVENTS,
    {
      dedupingInterval: 30000, // 30 second deduplication
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    events: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateEvents,
    refresh: () => mutateEvents(),
  };
}

/**
 * Hook for fetching event plans (collaborative planning sessions)
 */
export function useEventPlans(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateEventPlans } = useSWR<EventPlan[]>(
    CACHE_KEYS.EVENT_PLANS,
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    eventPlans: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateEventPlans,
    refresh: () => mutateEventPlans(),
  };
}

/**
 * Hook for fetching trips list
 */
export function useTrips(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateTrips } = useSWR<Trip[]>(
    CACHE_KEYS.TRIPS,
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    trips: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateTrips,
    refresh: () => mutateTrips(),
  };
}

/**
 * Hook for fetching memories list
 */
export function useMemories(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateMemories } = useSWR<Memory[]>(
    CACHE_KEYS.MEMORIES,
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    memories: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateMemories,
    refresh: () => mutateMemories(),
  };
}

/**
 * Hook for fetching shared items (memories shared with user)
 */
export function useSharedMemories(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateShared } = useSWR<SharedItem[]>(
    '/api/shared-items?type=received&status=accepted&itemType=memory',
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    sharedMemories: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateShared,
    refresh: () => mutateShared(),
  };
}

interface NotificationCountResponse {
  connectionRequests: number;
  sharedItems: number;
  chatNotifications: number;
}

/**
 * Hook for fetching pending notification count (for nav badge)
 */
export function useNotificationCount(options: UseDataOptions = {}) {
  const { data, error, isLoading, mutate: mutatePendingCount } = useSWR<NotificationCountResponse>(
    CACHE_KEYS.NOTIFICATIONS_PENDING,
    {
      dedupingInterval: 30000,
      refreshInterval: options.refreshInterval ?? 30000, // Refresh every 30 seconds by default
      revalidateOnMount: options.revalidateOnMount ?? true,
      isPaused: () => options.isPaused ?? false,
    }
  );

  // Calculate total pending count
  const pendingCount = data
    ? (data.connectionRequests ?? 0) + (data.sharedItems ?? 0) + (data.chatNotifications ?? 0)
    : 0;

  return {
    pendingCount,
    connectionRequests: data?.connectionRequests ?? 0,
    sharedItems: data?.sharedItems ?? 0,
    chatNotifications: data?.chatNotifications ?? 0,
    isLoading,
    error,
    mutate: mutatePendingCount,
    refresh: () => mutatePendingCount(),
  };
}

/**
 * Hook for fetching pending connection requests
 */
export function usePendingConnections(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutatePending } = useSWR(
    CACHE_KEYS.CONNECTIONS_PENDING,
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    pendingConnections: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutatePending,
    refresh: () => mutatePending(),
  };
}

/**
 * Hook for fetching pending shared items
 */
export function usePendingSharedItems(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutatePending } = useSWR(
    CACHE_KEYS.SHARED_ITEMS_PENDING,
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    pendingItems: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutatePending,
    refresh: () => mutatePending(),
  };
}

/**
 * Hook for fetching unread chat notifications
 */
export function useChatNotifications(options: UseDataOptions = {}) {
  const { data, error, isLoading, isValidating, mutate: mutateChat } = useSWR(
    CACHE_KEYS.CHAT_NOTIFICATIONS,
    {
      dedupingInterval: 30000,
      revalidateOnMount: options.revalidateOnMount ?? true,
      refreshInterval: options.refreshInterval ?? 0,
      isPaused: () => options.isPaused ?? false,
    }
  );

  return {
    chatNotifications: data ?? [],
    isLoading,
    isValidating,
    error,
    mutate: mutateChat,
    refresh: () => mutateChat(),
  };
}

/**
 * Combined hook for dashboard data - fetches friends and events together
 * Uses SWR's deduplication to prevent redundant requests
 */
export function useDashboardData() {
  const { friends, isLoading: friendsLoading, error: friendsError, mutate: mutateFriends } = useFriends();
  const { events, isLoading: eventsLoading, error: eventsError, mutate: mutateEvents } = useEvents();

  return {
    friends,
    events,
    isLoading: friendsLoading || eventsLoading,
    error: friendsError || eventsError,
    refreshFriends: mutateFriends,
    refreshEvents: mutateEvents,
    refreshAll: () => {
      mutateFriends();
      mutateEvents();
    },
  };
}

/**
 * Combined hook for events page data
 */
export function useEventsPageData() {
  const { friends, isLoading: friendsLoading, error: friendsError, mutate: mutateFriends } = useFriends();
  const { events, isLoading: eventsLoading, error: eventsError, mutate: mutateEvents } = useEvents();
  const { eventPlans, isLoading: plansLoading, error: plansError, mutate: mutatePlans } = useEventPlans();

  return {
    friends,
    events,
    eventPlans,
    isLoading: friendsLoading || eventsLoading || plansLoading,
    error: friendsError || eventsError || plansError,
    refreshFriends: mutateFriends,
    refreshEvents: mutateEvents,
    refreshEventPlans: mutatePlans,
    refreshAll: () => {
      mutateFriends();
      mutateEvents();
      mutatePlans();
    },
  };
}

/**
 * Combined hook for trips page data
 */
export function useTripsPageData() {
  const { friends, isLoading: friendsLoading, error: friendsError, mutate: mutateFriends } = useFriends();
  const { trips, isLoading: tripsLoading, error: tripsError, mutate: mutateTrips } = useTrips();

  return {
    friends,
    trips,
    isLoading: friendsLoading || tripsLoading,
    error: friendsError || tripsError,
    refreshFriends: mutateFriends,
    refreshTrips: mutateTrips,
    refreshAll: () => {
      mutateFriends();
      mutateTrips();
    },
  };
}

/**
 * Combined hook for memories page data
 */
export function useMemoriesPageData() {
  const { friends, isLoading: friendsLoading, error: friendsError, mutate: mutateFriends } = useFriends();
  const { memories, isLoading: memoriesLoading, error: memoriesError, mutate: mutateMemories } = useMemories();
  const { sharedMemories, isLoading: sharedLoading, error: sharedError, mutate: mutateShared } = useSharedMemories();

  return {
    friends,
    memories,
    sharedMemories,
    isLoading: friendsLoading || memoriesLoading || sharedLoading,
    error: friendsError || memoriesError || sharedError,
    refreshFriends: mutateFriends,
    refreshMemories: mutateMemories,
    refreshShared: mutateShared,
    refreshAll: () => {
      mutateFriends();
      mutateMemories();
      mutateShared();
    },
  };
}
