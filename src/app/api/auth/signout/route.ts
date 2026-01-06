import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionCookieName } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(getSessionCookieName())?.value;

    if (sessionToken) {
      // Delete session from database
      await prisma.session.delete(sessionToken);
    }

    // Clear cookie
    cookieStore.delete(getSessionCookieName());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error signing out:', error);
    return NextResponse.json(
      { error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
