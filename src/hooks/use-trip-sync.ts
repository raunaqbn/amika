'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TripMessage {
  id: string;
  tripId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface TripPollVote {
  id: string;
  optionId: string;
  visitorId: string | null;
  friendId: string | null;
  votedAt: Date;
}

interface TripPollOption {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
  votes?: TripPollVote[];
}

interface TripPoll {
  id: string;
  tripId: string;
  context: string;
  question: string;
  status: string;
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
  options?: TripPollOption[];
}

interface TripGoalProgress {
  id: string;
  tripId: string;
  goalType: string;
  status: string;
  completedAt: Date | null;
}

interface TypingUser {
  id: string;
  name: string;
}

interface ActiveUser {
  id: string;
  name: string;
  profileImage: string | null;
  lastSeen: Date;
}

interface SyncData {
  messages: TripMessage[];
  polls: TripPoll[];
  goalProgress: TripGoalProgress[];
  tripUpdated: boolean;
  lastUpdated: Date;
}

interface UseTripSyncOptions {
  enabled?: boolean;
  interval?: number; // Polling interval in ms
  context?: string; // Current context (for typing indicators)
  onNewMessages?: (messages: TripMessage[]) => void;
  onPollsUpdated?: (polls: TripPoll[]) => void;
  onGoalsUpdated?: (goals: TripGoalProgress[]) => void;
  onTripUpdated?: () => void;
  onTypingUsersUpdated?: (users: TypingUser[]) => void;
  onActiveUsersUpdated?: (users: ActiveUser[]) => void;
}

export function useTripSync(
  tripId: string | null,
  options: UseTripSyncOptions = {}
) {
  const {
    enabled = true,
    interval = 3000,
    context,
    onNewMessages,
    onPollsUpdated,
    onGoalsUpdated,
    onTripUpdated,
    onTypingUsersUpdated,
    onActiveUsersUpdated,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const lastSyncRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync messages, polls, and goals
  const sync = useCallback(async () => {
    if (!tripId || !enabled) return;

    try {
      const response = await fetch(
        `/api/trips/${tripId}/sync?lastSync=${lastSyncRef.current.toISOString()}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized');
          return;
        }
        throw new Error('Sync failed');
      }

      const data: SyncData = await response.json();

      // Update last sync time
      lastSyncRef.current = new Date(data.lastUpdated);
      setIsConnected(true);
      setError(null);

      // Notify callbacks of changes
      if (data.messages.length > 0 && onNewMessages) {
        onNewMessages(data.messages);
      }

      if (data.polls.length > 0 && onPollsUpdated) {
        onPollsUpdated(data.polls);
      }

      if (onGoalsUpdated) {
        onGoalsUpdated(data.goalProgress);
      }

      if (data.tripUpdated && onTripUpdated) {
        onTripUpdated();
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Connection lost');
      setIsConnected(false);
    }
  }, [tripId, enabled, onNewMessages, onPollsUpdated, onGoalsUpdated, onTripUpdated]);

  // Fetch typing users
  const fetchTypingUsers = useCallback(async () => {
    if (!tripId || !enabled) return;

    try {
      const url = context
        ? `/api/trips/${tripId}/typing?context=${context}`
        : `/api/trips/${tripId}/typing`;

      const response = await fetch(url);

      if (response.ok) {
        const users: TypingUser[] = await response.json();
        setTypingUsers(users);
        if (onTypingUsersUpdated) {
          onTypingUsersUpdated(users);
        }
      }
    } catch (err) {
      console.error('Error fetching typing users:', err);
    }
  }, [tripId, enabled, context, onTypingUsersUpdated]);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    if (!tripId || !enabled) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/presence`);

      if (response.ok) {
        const users: ActiveUser[] = await response.json();
        setActiveUsers(users);
        if (onActiveUsersUpdated) {
          onActiveUsersUpdated(users);
        }
      }
    } catch (err) {
      console.error('Error fetching active users:', err);
    }
  }, [tripId, enabled, onActiveUsersUpdated]);

  // Send presence heartbeat
  const sendPresenceHeartbeat = useCallback(async () => {
    if (!tripId || !enabled) return;

    try {
      await fetch(`/api/trips/${tripId}/presence`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error sending presence heartbeat:', err);
    }
  }, [tripId, enabled]);

  // Set up polling for messages/polls/goals
  useEffect(() => {
    if (!enabled || !tripId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial sync
    sync();

    // Set up interval
    intervalRef.current = setInterval(sync, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, tripId, interval, sync]);

  // Set up polling for presence and typing (faster interval)
  useEffect(() => {
    if (!enabled || !tripId) {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchTypingUsers();
    fetchActiveUsers();
    sendPresenceHeartbeat();

    // Set up faster interval for typing/presence (every 2 seconds)
    presenceIntervalRef.current = setInterval(() => {
      fetchTypingUsers();
      fetchActiveUsers();
      sendPresenceHeartbeat();
    }, 2000);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
    };
  }, [enabled, tripId, fetchTypingUsers, fetchActiveUsers, sendPresenceHeartbeat]);

  // Reset last sync when trip changes
  useEffect(() => {
    lastSyncRef.current = new Date();
    setIsConnected(false);
    setTypingUsers([]);
    setActiveUsers([]);
  }, [tripId]);

  return {
    isConnected,
    error,
    typingUsers,
    activeUsers,
    sync, // Manual sync trigger
  };
}
