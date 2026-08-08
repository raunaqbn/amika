import { prisma } from '@/lib/db';

type PushData = Record<string, string | number | boolean | null>;

type ExpoPushTicket = {
  status?: 'ok' | 'error';
  details?: { error?: string };
};

export async function sendPushNotification(userId: string, title: string, body: string, data: PushData) {
  const [registered, counts] = await Promise.all([
    prisma.pushToken.findMany(userId),
    prisma.sharedItem.getPendingCount(userId, 'memory'),
  ]);
  if (!registered.length) return;
  const badge = counts.connectionRequests + counts.sharedItems + counts.chatNotifications;

  const messages = registered.map(({ token }) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
    channelId: 'amika',
    badge,
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) throw new Error(`Expo push request failed with ${response.status}`);
  const payload = await response.json() as { data?: ExpoPushTicket[] };
  const invalidTokens = registered
    .filter((_, index) => payload.data?.[index]?.details?.error === 'DeviceNotRegistered')
    .map(({ token }) => token);
  if (invalidTokens.length) await prisma.pushToken.deleteMany(invalidTokens);
}
