import { getSession } from './auth';

// Admin email - only this user can access admin features
const ADMIN_EMAIL = 'raunaq.naidu@gmail.com';

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  if (session.user.email !== ADMIN_EMAIL) {
    throw new Error('Forbidden: Admin access required');
  }

  return session.user;
}

export function isAdminEmail(email: string): boolean {
  return email === ADMIN_EMAIL;
}
