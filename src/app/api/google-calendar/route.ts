import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { createCalendarEvent, hasGoogleCalendarConnected } from '@/lib/google-calendar';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/google-calendar - Create a calendar event with invites
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Google Calendar is connected
    const isConnected = await hasGoogleCalendarConnected(userId);
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { eventId, title, description, location, eventDate, friendIds, duration = 60 } = body;

    if (!title || !eventDate || !friendIds || friendIds.length === 0) {
      return NextResponse.json(
        { error: 'Title, event date, and at least one friend are required' },
        { status: 400 }
      );
    }

    // Get friend details including emails
    const friends = await prisma.friend.findMany({ userId });
    const selectedFriends = friends.filter((f: { id: string }) => friendIds.includes(f.id));

    // Build attendee list with emails
    const attendees: { email: string; displayName?: string }[] = [];
    const missingEmails: string[] = [];

    for (const friend of selectedFriends) {
      // For Amika friends (linked users), get email from the linked user
      if (friend.linkedUserId) {
        const linkedUser = await prisma.user.findById(friend.linkedUserId);
        if (linkedUser?.email) {
          attendees.push({
            email: linkedUser.email,
            displayName: friend.name,
          });
        } else {
          missingEmails.push(friend.name);
        }
      } else if (friend.email) {
        // For regular friends, use their stored email
        attendees.push({
          email: friend.email,
          displayName: friend.name,
        });
      } else {
        missingEmails.push(friend.name);
      }
    }

    if (attendees.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid email addresses found for selected friends',
          missingEmails
        },
        { status: 400 }
      );
    }

    // Create the calendar event
    const startDateTime = new Date(eventDate);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 1000);

    const result = await createCalendarEvent(userId, {
      summary: title,
      description,
      location,
      startDateTime,
      endDateTime,
      attendees,
      sendUpdates: 'all', // Send email invites to all attendees
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create calendar event' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eventId: result.eventId,
      htmlLink: result.htmlLink,
      attendees: attendees.map(a => ({ email: a.email, name: a.displayName })),
      missingEmails: missingEmails.length > 0 ? missingEmails : undefined,
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
