import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

const PUSH_TOKEN_KEY = 'amika_expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerPushNotifications() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('amika', {
      name: 'Amika memories and messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 90, 180],
      lightColor: '#9EA8F8',
      sound: 'default',
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  const isAllowed = () => permission.granted
    || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!isAllowed()) permission = await Notifications.requestPermissionsAsync();
  if (!isAllowed()) return null;

  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api('/api/push-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  return token;
}

export async function unregisterPushNotifications() {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
  let revoked = false;
  let serverError: unknown;

  if (token) {
    try {
      await api('/api/push-tokens', { method: 'DELETE', body: JSON.stringify({ token }) });
      revoked = true;
    } catch (error) {
      serverError = error;
    }
  }

  try {
    await Notifications.unregisterForNotificationsAsync();
    revoked = true;
  } catch {
    // A successful backend deletion is enough to stop delivery to this account.
  }

  await Promise.all([
    Notifications.dismissAllNotificationsAsync().catch(() => {}),
    Notifications.setBadgeCountAsync(0).catch(() => false),
  ]);

  if (revoked) {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
    return;
  }

  throw serverError instanceof Error ? serverError : new Error('Could not safely turn off notifications. Try signing out again.');
}
