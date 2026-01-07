import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserEmail } from '@/lib/google-calendar';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/auth/google-calendar/callback - Handle OAuth callback from Google for Calendar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle error from Google
    if (error) {
      console.error('Google Calendar OAuth error:', error);
      return NextResponse.redirect(new URL('/profile?google_error=access_denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/profile?google_error=invalid_request', request.url));
    }

    // Decode state to get user ID and origin
    let userId: string;
    let origin: string | undefined;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
      origin = stateData.origin;
      if (!userId) {
        throw new Error('No user ID in state');
      }
    } catch {
      return NextResponse.redirect(new URL('/profile?google_error=invalid_state', request.url));
    }

    // Exchange code for tokens (use origin from state to match the redirect_uri used during auth)
    const tokens = await exchangeCodeForTokens(code, origin);

    // Get user's Google email
    const googleEmail = await getGoogleUserEmail(tokens.access_token);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Save or update Google account
    await prisma.googleAccount.upsert({
      userId,
      googleEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry,
    });

    // Redirect back to profile page with success
    return NextResponse.redirect(new URL('/profile?google_connected=true', request.url));
  } catch (error) {
    console.error('Error in Google Calendar OAuth callback:', error);
    return NextResponse.redirect(new URL('/profile?google_error=callback_failed', request.url));
  }
}
