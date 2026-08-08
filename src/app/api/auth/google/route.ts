import { NextRequest, NextResponse } from 'next/server';
import { createGoogleOAuthState } from '@/lib/google-oauth';

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
  const returnUrl = searchParams.get('returnUrl');
  const platform = searchParams.get('platform');

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`;

  const state = createGoogleOAuthState({ inviteCode, returnUrl, platform });

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
