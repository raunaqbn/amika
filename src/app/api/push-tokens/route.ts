import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

function isExpoPushToken(value: unknown): value is string {
  return typeof value === 'string' && /^ExponentPushToken\[[^\]]+\]$|^ExpoPushToken\[[^\]]+\]$/.test(value);
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const platform = body.platform === 'android' ? 'android' : body.platform === 'ios' ? 'ios' : null;
  if (!isExpoPushToken(body.token) || !platform) {
    return NextResponse.json({ error: 'A valid Expo push token and platform are required.' }, { status: 400 });
  }

  await prisma.pushToken.upsert({ token: body.token, userId, platform });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (!isExpoPushToken(body.token)) {
    return NextResponse.json({ error: 'A valid Expo push token is required.' }, { status: 400 });
  }

  await prisma.pushToken.delete({ token: body.token, userId });
  return NextResponse.json({ success: true });
}
