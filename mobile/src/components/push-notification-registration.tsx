import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { registerPushNotifications } from '@/lib/push-notifications';
import { refreshNotificationCount } from '@/lib/notification-count';
import { useNotificationCount } from '@/hooks/use-notification-count';

let lastHandledResponseId = '';

export function PushNotificationRegistration() {
  const router = useRouter();
  const { total } = useNotificationCount();

  useEffect(() => {
    void Notifications.setBadgeCountAsync(total).catch(() => {});
  }, [total]);

  useEffect(() => {
    void registerPushNotifications().catch(() => {});

    const handleResponse = (response: Notifications.NotificationResponse | null) => {
      if (!response || response.notification.request.identifier === lastHandledResponseId) return;
      lastHandledResponseId = response.notification.request.identifier;
      const data = response.notification.request.content.data || {};
      if (data.type === 'message' && typeof data.senderId === 'string') {
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

    const received = Notifications.addNotificationReceivedListener(() => {
      void refreshNotificationCount().catch(() => {});
    });
    const pushTokenChanged = Notifications.addPushTokenListener(() => {
      void registerPushNotifications().catch(() => {});
    });
    const responded = Notifications.addNotificationResponseReceivedListener(handleResponse);
    void Notifications.getLastNotificationResponseAsync().then(handleResponse).catch(() => {});
    return () => {
      received.remove();
      pushTokenChanged.remove();
      responded.remove();
    };
  }, [router]);

  return null;
}
