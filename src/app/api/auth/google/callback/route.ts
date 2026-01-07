import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionCookieName } from '@/lib/auth';

type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

async function getGoogleTokens(code: string, redirectUri: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get tokens: ${error}`);
  }

  return response.json();
}

async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/signin?error=google_auth_failed', request.nextUrl.origin));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/signin?error=no_code', request.nextUrl.origin));
    }

    // Parse state for invite code
    let inviteCode: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(state);
        inviteCode = parsed.inviteCode || null;
      } catch {
        // Invalid state, ignore
      }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokens = await getGoogleTokens(code, redirectUri);

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Check if user exists by Google ID
    let user = await prisma.user.findByGoogleId(googleUser.id);

    if (!user) {
      // Check if user exists by email
      user = await prisma.user.findByEmail(googleUser.email);

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update(user.id, {
          googleId: googleUser.id,
          profileImage: user.profileImage || googleUser.picture || null,
        });
      } else {
        // Create new user
        // Generate a random password for Google users (they won't use it)
        const randomPassword = require('crypto').randomBytes(32).toString('hex');

        user = await prisma.user.create({
          email: googleUser.email,
          password: randomPassword,
          name: googleUser.name,
          profileImage: googleUser.picture || null,
          googleId: googleUser.id,
        });
      }
    }

    // Create session
    const session = await prisma.session.create(user.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });

    // If there's an invite code, accept it
    if (inviteCode) {
      try {
        await prisma.friendInvite.accept(inviteCode, user.id);
      } catch (e) {
        // Invite might be invalid or expired, continue anyway
        console.error('Failed to accept invite:', e);
      }
      return NextResponse.redirect(new URL('/friends?invited=true', request.nextUrl.origin));
    }

    return NextResponse.redirect(new URL('/', request.nextUrl.origin));
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/signin?error=google_auth_failed', request.nextUrl.origin));
  }
}
