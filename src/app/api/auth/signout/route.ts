import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authorization = request.headers.get('authorization');
    const bearerToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : null;
    const sessionToken = cookieStore.get(getSessionCookieName())?.value || bearerToken;

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
