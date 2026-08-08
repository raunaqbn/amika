import { cookies, headers } from 'next/headers';
import { prisma, type User } from './db';

const SESSION_COOKIE_NAME = 'amika_session';

async function getSessionToken() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const authorization = headerStore.get('authorization');
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : null;
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || bearerToken;
}

export async function getSession(): Promise<{ user: User & { hasProfileImage?: boolean } } | null> {
  const sessionToken = await getSessionToken();

  if (!sessionToken) {
    return null;
  }

  const user = await prisma.session.findUserByToken(sessionToken);
  if (!user) {
    return null;
  }

  return { user };
}

export async function getUserId(): Promise<string | null> {
  const sessionToken = await getSessionToken();
  return sessionToken ? prisma.session.findUserIdByToken(sessionToken) : null;
}

export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

// Helper to create session cookie options
export function getSessionCookieOptions(expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}
