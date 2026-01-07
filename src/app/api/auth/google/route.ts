import { NextRequest, NextResponse } from 'next/server';

// Generate Google OAuth URL for Sign-In
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth not configured' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const inviteCode = searchParams.get('invite');

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`;

  // Store invite code in state if provided
  const state = inviteCode ? JSON.stringify({ inviteCode }) : '';

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'consent');
  if (state) {
    googleAuthUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(googleAuthUrl.toString());
}
