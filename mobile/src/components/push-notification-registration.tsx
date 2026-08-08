import { useEffect } from 'react';
import { setBadgeCountAsync } from 'expo-notifications/build/setBadgeCountAsync';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
import { addPushTokenListener } from 'expo-notifications/build/TokenEmitter';
import type { NotificationResponse } from 'expo-notifications/build/Notifications.types';
import { useRouter, type Href } from 'expo-router';
import { registerPushNotifications } from '@/lib/push-notifications';
import { refreshNotificationCount } from '@/lib/notification-count';
import { useNotificationCount } from '@/hooks/use-notification-count';

let lastHandledResponseId = '';

export function PushNotificationRegistration() {
  const router = useRouter();
  const { total } = useNotificationCount();

  useEffect(() => {
    void setBadgeCountAsync(total).catch(() => {});
  }, [total]);

  useEffect(() => {
    void registerPushNotifications().catch(() => {});

    const handleResponse = (response: NotificationResponse | null) => {
      if (!response || response.notification.request.identifier === lastHandledResponseId) return;
      lastHandledResponseId = response.notification.request.identifier;
      const data = response.notification.request.content.data || {};
      if (data.type === 'message' && typeof data.threadId === 'string' && data.isGroup === true) {
        router.push({
          pathname: '/conversation/[id]',
          params: {
            id: data.threadId,
            name: typeof data.threadName === 'string' ? data.threadName : 'Group chat',
            kind: 'group',
          },
        });
      } else if (data.type === 'message' && typeof data.senderId === 'string') {
        router.push({
          pathname: '/conversation/[id]',
          params: {
            id: data.senderId,
            name: typeof data.senderName === 'string' ? data.senderName : 'Friend',
            image: typeof data.senderImage === 'string' ? data.senderImage : '',
          },
        });
      } else {
        router.push('/notifications' as Href);
      }
      void refreshNotificationCount().catch(() => {});
    };

    const received = addNotificationReceivedListener(() => {
      void refreshNotificationCount().catch(() => {});
    });
    const pushTokenChanged = addPushTokenListener(() => {
      void registerPushNotifications().catch(() => {});
    });
    const responded = addNotificationResponseReceivedListener(handleResponse);
    void getLastNotificationResponseAsync().then(handleResponse).catch(() => {});
    return () => {
      received.remove();
      pushTokenChanged.remove();
      responded.remove();
    };
  }, [router]);

  return null;
}
