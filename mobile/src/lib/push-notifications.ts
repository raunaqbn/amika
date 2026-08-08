import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { getDevicePushTokenAsync } from 'expo-notifications/build/getDevicePushTokenAsync';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { unregisterForNotificationsAsync } from 'expo-notifications/build/unregisterForNotificationsAsync';
import { dismissAllNotificationsAsync } from 'expo-notifications/build/dismissAllNotificationsAsync';
import { setBadgeCountAsync } from 'expo-notifications/build/setBadgeCountAsync';
import { api } from './api';

const PUSH_TOKEN_KEY = 'amika_expo_push_token';
const PUSH_DEVICE_ID_KEY = 'amika_push_device_id';

setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getPushDeviceId() {
  const existing = await SecureStore.getItemAsync(PUSH_DEVICE_ID_KEY).catch(() => null);
  if (existing) return existing;
  const random = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  await SecureStore.setItemAsync(PUSH_DEVICE_ID_KEY, random);
  return random;
}

async function getExpoPushToken(projectId: string) {
  const devicePushToken = await getDevicePushTokenAsync();
  const applicationId = Application.applicationId;
  if (!applicationId) throw new Error('Push notifications are unavailable for this app build.');

  const environment = Platform.OS === 'ios'
    ? await Application.getIosPushNotificationServiceEnvironmentAsync().catch(() => null)
    : null;
  const response = await fetch('https://exp.host/--/api/v2/push/getExpoPushToken', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      type: devicePushToken.type === 'ios' ? 'apns' : devicePushToken.type === 'android' ? 'fcm' : devicePushToken.type,
      deviceId: await getPushDeviceId(),
      development: environment === 'development',
      appId: applicationId,
      deviceToken: typeof devicePushToken.data === 'string' ? devicePushToken.data : JSON.stringify(devicePushToken.data),
      projectId,
    }),
  });
  const payload = await response.json() as { data?: { expoPushToken?: string }; errors?: unknown };
  const token = payload.data?.expoPushToken;
  if (!response.ok || !token) throw new Error('Could not register this device for push notifications.');
  return token;
}

export async function registerPushNotifications() {
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await setNotificationChannelAsync('amika', {
      name: 'Amika memories and messages',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 90, 180],
      lightColor: '#9EA8F8',
      sound: 'default',
    });
  }

  let permission = await getPermissionsAsync();
  const isAllowed = () => permission.granted
    || permission.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  if (!isAllowed()) permission = await requestPermissionsAsync();
  if (!isAllowed()) return null;

  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const token = await getExpoPushToken(projectId);
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
    await unregisterForNotificationsAsync();
    revoked = true;
  } catch {
    // A successful backend deletion is enough to stop delivery to this account.
  }

  await Promise.all([
    dismissAllNotificationsAsync().catch(() => {}),
    setBadgeCountAsync(0).catch(() => false),
  ]);

  if (revoked) {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY).catch(() => {});
    return;
  }

  throw serverError instanceof Error ? serverError : new Error('Could not safely turn off notifications. Try signing out again.');
}
