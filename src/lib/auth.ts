import { cookies } from 'next/headers';
import { prisma, type User } from './db';

const SESSION_COOKIE_NAME = 'amika_session';

export async function getSession(): Promise<{ user: User } | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findByToken(sessionToken);
  if (!session) {
    return null;
  }

  const user = await prisma.user.findById(session.userId);
  if (!user) {
    return null;
  }

  return { user };
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
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
