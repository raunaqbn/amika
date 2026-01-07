import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { getGoogleAuthUrl, hasGoogleCalendarConnected } from '@/lib/google-calendar';
import { prisma } from '@/lib/db';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

// GET /api/auth/google-calendar - Start OAuth flow or check connection status
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Check connection status
    if (action === 'status') {
      const googleAccount = await prisma.googleAccount.findByUserId(userId);
      return NextResponse.json({
        connected: googleAccount !== null,
        email: googleAccount?.googleEmail || null,
      });
    }

    // Start OAuth flow
    // Generate a secure state token that includes the user ID
    const stateToken = randomBytes(32).toString('hex');
    const state = Buffer.from(JSON.stringify({ userId, token: stateToken })).toString('base64');

    const authUrl = getGoogleAuthUrl(state);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error in Google Calendar auth:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Google Calendar auth' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/google-calendar - Disconnect Google Calendar
export async function DELETE() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await prisma.googleAccount.delete(userId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Google Calendar' },
      { status: 500 }
    );
  }
}
