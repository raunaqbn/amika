import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { getNotificationCountSnapshot, refreshNotificationCount, subscribeNotificationCount } from '@/lib/notification-count';

export function useNotificationCount(poll = false) {
  const [counts, setCounts] = useState(getNotificationCountSnapshot);

  useEffect(() => subscribeNotificationCount(setCounts), []);

  useEffect(() => {
    if (!poll) return;
    void refreshNotificationCount().catch(() => {});
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refreshNotificationCount().catch(() => {});
    }, 30_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotificationCount().catch(() => {});
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [poll]);

  return useMemo(() => ({
    ...counts,
    total: counts.connectionRequests + counts.sharedItems + counts.chatNotifications,
  }), [counts]);
}
