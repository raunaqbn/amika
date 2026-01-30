'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Hook to track document visibility
function useDocumentVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

interface EventPlanMessage {
  id: string;
  eventPlanId: string;
  userId: string;
  friendId: string | null;
  context: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface EventPlanPollVote {
  id: string;
  optionId: string;
  visitorId: string | null;
  friendId: string | null;
  votedAt: Date;
}

interface EventPlanPollOption {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
  votes?: EventPlanPollVote[];
}

interface EventPlanPoll {
  id: string;
  eventPlanId: string;
  context: string;
  question: string;
  status: string;
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
  options?: EventPlanPollOption[];
}

interface EventPlanGoalProgress {
  id: string;
  eventPlanId: string;
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
  messages: EventPlanMessage[];
  polls: EventPlanPoll[];
  goalProgress: EventPlanGoalProgress[];
  eventPlanUpdated: boolean;
  lastUpdated: Date;
}

interface UseEventPlanSyncOptions {
  enabled?: boolean;
  interval?: number; // Polling interval in ms
  context?: string; // Current context (for typing indicators)
  onNewMessages?: (messages: EventPlanMessage[]) => void;
  onPollsUpdated?: (polls: EventPlanPoll[]) => void;
  onGoalsUpdated?: (goals: EventPlanGoalProgress[]) => void;
  onEventPlanUpdated?: () => void;
  onTypingUsersUpdated?: (users: TypingUser[]) => void;
  onActiveUsersUpdated?: (users: ActiveUser[]) => void;
}

export function useEventPlanSync(
  eventPlanId: string | null,
  options: UseEventPlanSyncOptions = {}
) {
  const {
    enabled = true,
    interval = 10000,
    context,
    onNewMessages,
    onPollsUpdated,
    onGoalsUpdated,
    onEventPlanUpdated,
    onTypingUsersUpdated,
    onActiveUsersUpdated,
  } = options;

  // Track visibility to optimize polling when tab is hidden
  const isVisible = useDocumentVisibility();

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const lastSyncRef = useRef<Date>(new Date(0)); // Start at epoch to fetch all historical messages
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Slow down polling interval when tab is hidden (10x slower)
  const effectiveInterval = isVisible ? interval : interval * 6;
  const effectivePresenceInterval = isVisible ? 10000 : 60000;

  // Sync messages, polls, and goals
  const sync = useCallback(async () => {
    if (!eventPlanId || !enabled) return;

    try {
      const response = await fetch(
        `/api/event-plans/${eventPlanId}/sync?lastSync=${lastSyncRef.current.toISOString()}`
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

      if (data.eventPlanUpdated && onEventPlanUpdated) {
        onEventPlanUpdated();
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError('Connection lost');
      setIsConnected(false);
    }
  }, [eventPlanId, enabled, onNewMessages, onPollsUpdated, onGoalsUpdated, onEventPlanUpdated]);

  // Fetch typing users
  const fetchTypingUsers = useCallback(async () => {
    if (!eventPlanId || !enabled) return;

    try {
      const url = context
        ? `/api/event-plans/${eventPlanId}/typing?context=${context}`
        : `/api/event-plans/${eventPlanId}/typing`;

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
  }, [eventPlanId, enabled, context, onTypingUsersUpdated]);

  // Fetch active users
  const fetchActiveUsers = useCallback(async () => {
    if (!eventPlanId || !enabled) return;

    try {
      const response = await fetch(`/api/event-plans/${eventPlanId}/presence`);

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
  }, [eventPlanId, enabled, onActiveUsersUpdated]);

  // Send presence heartbeat
  const sendPresenceHeartbeat = useCallback(async () => {
    if (!eventPlanId || !enabled) return;

    try {
      await fetch(`/api/event-plans/${eventPlanId}/presence`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error sending presence heartbeat:', err);
    }
  }, [eventPlanId, enabled]);

  // Set up polling for messages/polls/goals
  useEffect(() => {
    if (!enabled || !eventPlanId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial sync (only when visible)
    if (isVisible) {
      sync();
    }

    // Set up interval with visibility-aware timing
    intervalRef.current = setInterval(sync, effectiveInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, eventPlanId, effectiveInterval, sync, isVisible]);

  // Set up polling for presence and typing (faster interval, paused when hidden)
  useEffect(() => {
    if (!enabled || !eventPlanId) {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch (only when visible)
    if (isVisible) {
      fetchTypingUsers();
      fetchActiveUsers();
      sendPresenceHeartbeat();
    }

    // Set up interval with visibility-aware timing
    presenceIntervalRef.current = setInterval(() => {
      fetchTypingUsers();
      fetchActiveUsers();
      sendPresenceHeartbeat();
    }, effectivePresenceInterval);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
    };
  }, [enabled, eventPlanId, effectivePresenceInterval, fetchTypingUsers, fetchActiveUsers, sendPresenceHeartbeat, isVisible]);

  // Reset last sync when event plan changes - use epoch to fetch all historical messages
  useEffect(() => {
    // Set to epoch time (0) so the first sync fetches ALL historical messages
    // This ensures users who join late can see the complete chat history
    lastSyncRef.current = new Date(0);
    setIsConnected(false);
    setTypingUsers([]);
    setActiveUsers([]);
  }, [eventPlanId]);

  return {
    isConnected,
    error,
    typingUsers,
    activeUsers,
    sync, // Manual sync trigger
  };
}
