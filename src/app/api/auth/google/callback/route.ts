import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserEmail } from '@/lib/google-calendar';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/auth/google/callback - Handle OAuth callback from Google
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle error from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return NextResponse.redirect(new URL('/profile?google_error=access_denied', request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/profile?google_error=invalid_request', request.url));
    }

    // Decode state to get user ID
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
      if (!userId) {
        throw new Error('No user ID in state');
      }
    } catch {
      return NextResponse.redirect(new URL('/profile?google_error=invalid_state', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

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
    console.error('Error in Google OAuth callback:', error);
    return NextResponse.redirect(new URL('/profile?google_error=callback_failed', request.url));
  }
}
