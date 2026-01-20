import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
  });
}

// Point system for events based on bonding potential and time/energy investment
const EVENT_POINTS: Record<string, number> = {
  fitness: 25,       // High commitment, shared physical activity
  experiences: 20,   // Unique bonding, memorable moments
  places: 15,        // Travel/exploration together
  restaurants: 10,   // Social dining, casual bonding
  virtual: 5,        // Phone calls, video chats - lower investment
  default: 10,       // Uncategorized events
};

function getEventPoints(category: string | null): number {
  return EVENT_POINTS[category || 'default'] || EVENT_POINTS.default;
}

export async function POST() {
  try {
    // Check admin authorization
    await requireAdmin();

    const client = getClient();
    const now = new Date().toISOString();

    // Get all completed events with their friends
    const completedEventsResult = await client.execute(`
      SELECT e.id, e.userId, e.title, e.category, e.friendId, e.createdAt
      FROM events e
      WHERE e.completed = 1
    `);

    const completedEvents = completedEventsResult.rows;

    // Get all event_friends relationships
    const eventFriendsResult = await client.execute(`
      SELECT eventId, friendId
      FROM event_friends
    `);

    // Create a map of eventId -> additional friendIds
    const eventFriendsMap = new Map<string, string[]>();
    for (const row of eventFriendsResult.rows) {
      const eventId = row.eventId as string;
      const friendId = row.friendId as string;
      if (!eventFriendsMap.has(eventId)) {
        eventFriendsMap.set(eventId, []);
      }
      eventFriendsMap.get(eventId)!.push(friendId);
    }

    // Get all friends with their linkedUserId
    const friendsResult = await client.execute(`
      SELECT id, linkedUserId, userId
      FROM friends
      WHERE linkedUserId IS NOT NULL
    `);

    // Create a map of friendId -> {linkedUserId, ownerUserId}
    const friendsMap = new Map<string, { linkedUserId: string; ownerUserId: string }>();
    for (const row of friendsResult.rows) {
      friendsMap.set(row.id as string, {
        linkedUserId: row.linkedUserId as string,
        ownerUserId: row.userId as string,
      });
    }

    // Get all existing points notifications
    const existingPointsResult = await client.execute(`
      SELECT sharedByUserId, sharedWithUserId, itemId
      FROM shared_items
      WHERE itemType = 'points'
    `);

    // Create a set of existing notifications for quick lookup
    const existingNotifications = new Set<string>();
    for (const row of existingPointsResult.rows) {
      const key = `${row.sharedByUserId}:${row.sharedWithUserId}:${row.itemId}`;
      existingNotifications.add(key);
    }

    let createdCount = 0;
    let skippedCount = 0;
    const createdNotifications: Array<{
      eventTitle: string;
      friendLinkedUserId: string;
      points: number;
    }> = [];

    // Process each completed event
    for (const event of completedEvents) {
      const eventId = event.id as string;
      const eventUserId = event.userId as string;
      const eventTitle = event.title as string;
      const eventCategory = event.category as string | null;
      const primaryFriendId = event.friendId as string;

      const points = getEventPoints(eventCategory);

      // Gather all participating friend IDs
      const participatingFriendIds = new Set<string>();
      participatingFriendIds.add(primaryFriendId);

      // Add additional friends from event_friends
      const additionalFriends = eventFriendsMap.get(eventId) || [];
      for (const friendId of additionalFriends) {
        participatingFriendIds.add(friendId);
      }

      // For each participating friend with a linkedUserId, create points notification
      for (const friendId of participatingFriendIds) {
        const friendInfo = friendsMap.get(friendId);

        // Only create notification if:
        // 1. Friend has a linkedUserId (is an Amika user)
        // 2. The friend belongs to the event creator (ownerUserId matches eventUserId)
        if (friendInfo && friendInfo.ownerUserId === eventUserId) {
          const key = `${eventUserId}:${friendInfo.linkedUserId}:${eventId}`;

          if (existingNotifications.has(key)) {
            skippedCount++;
            continue;
          }

          // Create the points notification
          const sharedItemId = randomUUID();
          const message = `You earned ${points} friendship points for completing "${eventTitle}"!`;

          await client.execute({
            sql: `INSERT INTO shared_items (id, sharedByUserId, sharedWithUserId, itemType, itemId, status, message, createdAt)
                  VALUES (?, ?, ?, 'points', ?, 'pending', ?, ?)`,
            args: [sharedItemId, eventUserId, friendInfo.linkedUserId, eventId, message, now],
          });

          createdCount++;
          createdNotifications.push({
            eventTitle,
            friendLinkedUserId: friendInfo.linkedUserId,
            points,
          });

          // Add to set to prevent duplicate notifications for same event/user combination
          existingNotifications.add(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Retroactively awarded points for completed events`,
      stats: {
        totalCompletedEvents: completedEvents.length,
        pointsNotificationsCreated: createdCount,
        alreadyExisted: skippedCount,
      },
      createdNotifications: createdNotifications.slice(0, 20), // Show first 20 for debugging
    });
  } catch (error: any) {
    console.error('Error in retroactive points award:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to award retroactive points' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// GET endpoint to preview what would be created without actually creating
export async function GET() {
  try {
    // Check admin authorization
    await requireAdmin();

    const client = getClient();

    // Get all completed events with their friends
    const completedEventsResult = await client.execute(`
      SELECT e.id, e.userId, e.title, e.category, e.friendId, e.createdAt
      FROM events e
      WHERE e.completed = 1
    `);

    const completedEvents = completedEventsResult.rows;

    // Get all event_friends relationships
    const eventFriendsResult = await client.execute(`
      SELECT eventId, friendId
      FROM event_friends
    `);

    // Create a map of eventId -> additional friendIds
    const eventFriendsMap = new Map<string, string[]>();
    for (const row of eventFriendsResult.rows) {
      const eventId = row.eventId as string;
      const friendId = row.friendId as string;
      if (!eventFriendsMap.has(eventId)) {
        eventFriendsMap.set(eventId, []);
      }
      eventFriendsMap.get(eventId)!.push(friendId);
    }

    // Get all friends with their linkedUserId
    const friendsResult = await client.execute(`
      SELECT id, linkedUserId, userId, name
      FROM friends
      WHERE linkedUserId IS NOT NULL
    `);

    // Create a map of friendId -> {linkedUserId, ownerUserId, name}
    const friendsMap = new Map<string, { linkedUserId: string; ownerUserId: string; name: string }>();
    for (const row of friendsResult.rows) {
      friendsMap.set(row.id as string, {
        linkedUserId: row.linkedUserId as string,
        ownerUserId: row.userId as string,
        name: row.name as string,
      });
    }

    // Get all existing points notifications
    const existingPointsResult = await client.execute(`
      SELECT sharedByUserId, sharedWithUserId, itemId
      FROM shared_items
      WHERE itemType = 'points'
    `);

    // Create a set of existing notifications for quick lookup
    const existingNotifications = new Set<string>();
    for (const row of existingPointsResult.rows) {
      const key = `${row.sharedByUserId}:${row.sharedWithUserId}:${row.itemId}`;
      existingNotifications.add(key);
    }

    let wouldCreateCount = 0;
    let alreadyExistsCount = 0;
    const wouldCreate: Array<{
      eventTitle: string;
      friendName: string;
      friendLinkedUserId: string;
      points: number;
    }> = [];

    // Process each completed event
    for (const event of completedEvents) {
      const eventId = event.id as string;
      const eventUserId = event.userId as string;
      const eventTitle = event.title as string;
      const eventCategory = event.category as string | null;
      const primaryFriendId = event.friendId as string;

      const points = getEventPoints(eventCategory);

      // Gather all participating friend IDs
      const participatingFriendIds = new Set<string>();
      participatingFriendIds.add(primaryFriendId);

      // Add additional friends from event_friends
      const additionalFriends = eventFriendsMap.get(eventId) || [];
      for (const friendId of additionalFriends) {
        participatingFriendIds.add(friendId);
      }

      // For each participating friend with a linkedUserId, check if notification exists
      for (const friendId of participatingFriendIds) {
        const friendInfo = friendsMap.get(friendId);

        if (friendInfo && friendInfo.ownerUserId === eventUserId) {
          const key = `${eventUserId}:${friendInfo.linkedUserId}:${eventId}`;

          if (existingNotifications.has(key)) {
            alreadyExistsCount++;
          } else {
            wouldCreateCount++;
            wouldCreate.push({
              eventTitle,
              friendName: friendInfo.name,
              friendLinkedUserId: friendInfo.linkedUserId,
              points,
            });
          }
        }
      }
    }

    return NextResponse.json({
      preview: true,
      message: 'Preview of retroactive points award (no changes made)',
      stats: {
        totalCompletedEvents: completedEvents.length,
        linkedFriendsTotal: friendsResult.rows.length,
        existingPointsNotifications: existingPointsResult.rows.length,
        wouldCreate: wouldCreateCount,
        alreadyExists: alreadyExistsCount,
      },
      wouldCreateNotifications: wouldCreate.slice(0, 50), // Show first 50 for preview
    });
  } catch (error: any) {
    console.error('Error in retroactive points preview:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to preview retroactive points' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
