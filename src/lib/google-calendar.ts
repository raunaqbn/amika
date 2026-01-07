import { prisma, type GoogleAccount } from './db';

// Google OAuth2 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

// Google Calendar API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Generate OAuth2 authorization URL
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

// Get user's Google email
export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Google user info');
  }

  const data = await response.json();
  return data.email;
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

// Get valid access token (refresh if expired)
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const googleAccount = await prisma.googleAccount.findByUserId(userId);
  if (!googleAccount) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const expiryBuffer = new Date(googleAccount.tokenExpiry.getTime() - 5 * 60 * 1000);

  if (now >= expiryBuffer) {
    // Token is expired or about to expire, refresh it
    try {
      const newTokens = await refreshAccessToken(googleAccount.refreshToken);
      const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000);

      await prisma.googleAccount.update(userId, {
        accessToken: newTokens.access_token,
        tokenExpiry: newExpiry,
      });

      return newTokens.access_token;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return null;
    }
  }

  return googleAccount.accessToken;
}

// Calendar event attendee
export interface CalendarAttendee {
  email: string;
  displayName?: string;
}

// Calendar event data
export interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  attendees: CalendarAttendee[];
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}

// Create a calendar event with invites
export async function createCalendarEvent(
  userId: string,
  eventData: CalendarEventData
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return { success: false, error: 'Not connected to Google Calendar' };
  }

  const event = {
    summary: eventData.summary,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: eventData.endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    attendees: eventData.attendees.map(a => ({
      email: a.email,
      displayName: a.displayName,
    })),
    reminders: {
      useDefault: true,
    },
  };

  const sendUpdates = eventData.sendUpdates || 'all';

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=${sendUpdates}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create calendar event:', error);
      return { success: false, error: 'Failed to create calendar event' };
    }

    const createdEvent = await response.json();
    return {
      success: true,
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: 'Failed to create calendar event' };
  }
}

// Check if user has Google Calendar connected
export async function hasGoogleCalendarConnected(userId: string): Promise<boolean> {
  const googleAccount = await prisma.googleAccount.findByUserId(userId);
  return googleAccount !== null;
}

// Disconnect Google Calendar
export async function disconnectGoogleCalendar(userId: string): Promise<boolean> {
  try {
    // Optionally revoke the token first
    const googleAccount = await prisma.googleAccount.findByUserId(userId);
    if (googleAccount) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${googleAccount.accessToken}`, {
          method: 'POST',
        });
      } catch {
        // Ignore revoke errors
      }
    }

    return await prisma.googleAccount.delete(userId);
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return false;
  }
}
