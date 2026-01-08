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

interface TripPoll {
  id: string;
  tripId: string;
  context: string;
  question: string;
  status: string;
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
}

interface TripGoalProgress {
  id: string;
  tripId: string;
  goalType: string;
  status: string;
  completedAt: Date | null;
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
  onNewMessages?: (messages: TripMessage[]) => void;
  onPollsUpdated?: (polls: TripPoll[]) => void;
  onGoalsUpdated?: (goals: TripGoalProgress[]) => void;
  onTripUpdated?: () => void;
}

export function useTripSync(
  tripId: string | null,
  options: UseTripSyncOptions = {}
) {
  const {
    enabled = true,
    interval = 3000,
    onNewMessages,
    onPollsUpdated,
    onGoalsUpdated,
    onTripUpdated,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSyncRef = useRef<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Set up polling
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

  // Reset last sync when trip changes
  useEffect(() => {
    lastSyncRef.current = new Date();
    setIsConnected(false);
  }, [tripId]);

  return {
    isConnected,
    error,
    sync, // Manual sync trigger
  };
}
