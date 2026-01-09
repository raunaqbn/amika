import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@libsql/client';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || '',
    authToken: process.env.TURSO_AUTH_TOKEN || ''
  });
}

export async function GET() {
  try {
    // Check admin authorization
    await requireAdmin();

    const client = getClient();

    // ================== USER METRICS ==================
    // Total users
    const totalUsersResult = await client.execute(
      'SELECT COUNT(*) as count FROM users'
    );
    const totalUsers = Number(totalUsersResult.rows[0]?.count || 0);

    // Non-temporary users
    const activeUsersResult = await client.execute(
      'SELECT COUNT(*) as count FROM users WHERE isTemporary = 0 OR isTemporary IS NULL'
    );
    const activeUsers = Number(activeUsersResult.rows[0]?.count || 0);

    // Users with Google accounts linked
    const googleLinkedUsersResult = await client.execute(
      'SELECT COUNT(*) as count FROM google_accounts'
    );
    const googleLinkedUsers = Number(googleLinkedUsersResult.rows[0]?.count || 0);

    // New users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newUsersWeekResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE createdAt >= ?',
      args: [sevenDaysAgo],
    });
    const newUsersWeek = Number(newUsersWeekResult.rows[0]?.count || 0);

    // New users (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const newUsersMonthResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE createdAt >= ?',
      args: [thirtyDaysAgo],
    });
    const newUsersMonth = Number(newUsersMonthResult.rows[0]?.count || 0);

    // User growth by week (last 8 weeks)
    const userGrowthResult = await client.execute(`
      SELECT
        strftime('%Y-%W', createdAt) as week,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= datetime('now', '-56 days')
      GROUP BY strftime('%Y-%W', createdAt)
      ORDER BY week DESC
      LIMIT 8
    `);
    const userGrowth = userGrowthResult.rows.map((row: any) => ({
      week: row.week,
      count: Number(row.count),
    })).reverse();

    // ================== SOCIAL GRAPH METRICS ==================
    // Total friends across all users
    const totalFriendsResult = await client.execute(
      'SELECT COUNT(*) as count FROM friends'
    );
    const totalFriends = Number(totalFriendsResult.rows[0]?.count || 0);

    // Friends that are linked Amika users
    const linkedFriendsResult = await client.execute(
      'SELECT COUNT(*) as count FROM friends WHERE linkedUserId IS NOT NULL'
    );
    const linkedFriends = Number(linkedFriendsResult.rows[0]?.count || 0);

    // Average friends per user
    const avgFriendsResult = await client.execute(`
      SELECT AVG(friend_count) as avg FROM (
        SELECT userId, COUNT(*) as friend_count FROM friends GROUP BY userId
      )
    `);
    const avgFriendsPerUser = Number(avgFriendsResult.rows[0]?.avg || 0).toFixed(1);

    // User connections (friend requests between users)
    const connectionsPendingResult = await client.execute(
      "SELECT COUNT(*) as count FROM user_connections WHERE status = 'pending'"
    );
    const connectionsPending = Number(connectionsPendingResult.rows[0]?.count || 0);

    const connectionsAcceptedResult = await client.execute(
      "SELECT COUNT(*) as count FROM user_connections WHERE status = 'accepted'"
    );
    const connectionsAccepted = Number(connectionsAcceptedResult.rows[0]?.count || 0);

    // ================== CONTENT METRICS ==================
    // Total memories
    const totalMemoriesResult = await client.execute(
      'SELECT COUNT(*) as count FROM memories'
    );
    const totalMemories = Number(totalMemoriesResult.rows[0]?.count || 0);

    // Memories with images
    const memoriesWithImagesResult = await client.execute(
      'SELECT COUNT(*) as count FROM memories WHERE imageUrl IS NOT NULL'
    );
    const memoriesWithImages = Number(memoriesWithImagesResult.rows[0]?.count || 0);

    // Total diary notes
    const totalDiaryNotesResult = await client.execute(
      'SELECT COUNT(*) as count FROM diary_notes'
    );
    const totalDiaryNotes = Number(totalDiaryNotesResult.rows[0]?.count || 0);

    // Diary notes with AI analysis
    const diaryWithAnalysisResult = await client.execute(
      'SELECT COUNT(*) as count FROM diary_notes WHERE analysis IS NOT NULL'
    );
    const diaryWithAnalysis = Number(diaryWithAnalysisResult.rows[0]?.count || 0);

    // Total events
    const totalEventsResult = await client.execute(
      'SELECT COUNT(*) as count FROM events'
    );
    const totalEvents = Number(totalEventsResult.rows[0]?.count || 0);

    // Events by category
    const eventsByCategoryResult = await client.execute(`
      SELECT category, COUNT(*) as count
      FROM events
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    const eventsByCategory = eventsByCategoryResult.rows.map((row: any) => ({
      category: row.category || 'uncategorized',
      count: Number(row.count),
    }));

    // Completed events
    const completedEventsResult = await client.execute(
      'SELECT COUNT(*) as count FROM events WHERE completed = 1'
    );
    const completedEvents = Number(completedEventsResult.rows[0]?.count || 0);

    // ================== ENGAGEMENT METRICS ==================
    // Total chat sessions
    const totalChatSessionsResult = await client.execute(
      'SELECT COUNT(DISTINCT sessionId) as count FROM chat_transcripts'
    );
    const totalChatSessions = Number(totalChatSessionsResult.rows[0]?.count || 0);

    // Total chat messages
    const totalChatMessagesResult = await client.execute(
      'SELECT COUNT(*) as count FROM chat_transcripts'
    );
    const totalChatMessages = Number(totalChatMessagesResult.rows[0]?.count || 0);

    // Chat messages in last 7 days
    const recentChatMessagesResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM chat_transcripts WHERE createdAt >= ?',
      args: [sevenDaysAgo],
    });
    const recentChatMessages = Number(recentChatMessagesResult.rows[0]?.count || 0);

    // ================== TRIP PLANNING METRICS ==================
    // Total trips
    const totalTripsResult = await client.execute(
      'SELECT COUNT(*) as count FROM trip_sessions'
    );
    const totalTrips = Number(totalTripsResult.rows[0]?.count || 0);

    // Trips by status
    const tripsByStatusResult = await client.execute(`
      SELECT status, COUNT(*) as count
      FROM trip_sessions
      GROUP BY status
    `);
    const tripsByStatus = tripsByStatusResult.rows.map((row: any) => ({
      status: row.status,
      count: Number(row.count),
    }));

    // Total trip collaborators
    const totalTripCollaboratorsResult = await client.execute(
      'SELECT COUNT(*) as count FROM trip_collaborators'
    );
    const totalTripCollaborators = Number(totalTripCollaboratorsResult.rows[0]?.count || 0);

    // Total trip messages
    const totalTripMessagesResult = await client.execute(
      'SELECT COUNT(*) as count FROM trip_messages'
    );
    const totalTripMessages = Number(totalTripMessagesResult.rows[0]?.count || 0);

    // Total trip polls
    const totalTripPollsResult = await client.execute(
      'SELECT COUNT(*) as count FROM trip_polls'
    );
    const totalTripPolls = Number(totalTripPollsResult.rows[0]?.count || 0);

    // ================== EVENT PLANNING METRICS ==================
    // Total event plans
    const totalEventPlansResult = await client.execute(
      'SELECT COUNT(*) as count FROM event_plan_sessions'
    );
    const totalEventPlans = Number(totalEventPlansResult.rows[0]?.count || 0);

    // Event plans by status
    const eventPlansByStatusResult = await client.execute(`
      SELECT status, COUNT(*) as count
      FROM event_plan_sessions
      GROUP BY status
    `);
    const eventPlansByStatus = eventPlansByStatusResult.rows.map((row: any) => ({
      status: row.status,
      count: Number(row.count),
    }));

    // Total event plan collaborators
    const totalEventPlanCollaboratorsResult = await client.execute(
      'SELECT COUNT(*) as count FROM event_plan_collaborators'
    );
    const totalEventPlanCollaborators = Number(totalEventPlanCollaboratorsResult.rows[0]?.count || 0);

    // ================== SHARING METRICS ==================
    // Shared items by status
    const sharedItemsPendingResult = await client.execute(
      "SELECT COUNT(*) as count FROM shared_items WHERE status = 'pending'"
    );
    const sharedItemsPending = Number(sharedItemsPendingResult.rows[0]?.count || 0);

    const sharedItemsAcceptedResult = await client.execute(
      "SELECT COUNT(*) as count FROM shared_items WHERE status = 'accepted'"
    );
    const sharedItemsAccepted = Number(sharedItemsAcceptedResult.rows[0]?.count || 0);

    // Shared items by type
    const sharedItemsByTypeResult = await client.execute(`
      SELECT itemType, COUNT(*) as count
      FROM shared_items
      GROUP BY itemType
    `);
    const sharedItemsByType = sharedItemsByTypeResult.rows.map((row: any) => ({
      type: row.itemType,
      count: Number(row.count),
    }));

    // ================== WISHLIST METRICS ==================
    // Total wishlist items
    const totalWishlistItemsResult = await client.execute(
      'SELECT COUNT(*) as count FROM wishlist_items'
    );
    const totalWishlistItems = Number(totalWishlistItemsResult.rows[0]?.count || 0);

    // Purchased wishlist items
    const purchasedWishlistResult = await client.execute(
      'SELECT COUNT(*) as count FROM wishlist_items WHERE purchased = 1'
    );
    const purchasedWishlistItems = Number(purchasedWishlistResult.rows[0]?.count || 0);

    // Wishlist by category
    const wishlistByCategoryResult = await client.execute(`
      SELECT category, COUNT(*) as count
      FROM wishlist_items
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    const wishlistByCategory = wishlistByCategoryResult.rows.map((row: any) => ({
      category: row.category,
      count: Number(row.count),
    }));

    // ================== TOP USERS ==================
    // Top users by number of friends
    const topUsersByFriendsResult = await client.execute(`
      SELECT u.id, u.name, u.email, COUNT(f.id) as friend_count
      FROM users u
      LEFT JOIN friends f ON u.id = f.userId
      GROUP BY u.id
      ORDER BY friend_count DESC
      LIMIT 10
    `);
    const topUsersByFriends = topUsersByFriendsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      friendCount: Number(row.friend_count),
    }));

    // Top users by content (memories + diary + events)
    const topUsersByContentResult = await client.execute(`
      SELECT
        u.id,
        u.name,
        u.email,
        (SELECT COUNT(*) FROM memories WHERE userId = u.id) as memories,
        (SELECT COUNT(*) FROM diary_notes WHERE userId = u.id) as diary,
        (SELECT COUNT(*) FROM events WHERE userId = u.id) as events
      FROM users u
      ORDER BY (
        (SELECT COUNT(*) FROM memories WHERE userId = u.id) +
        (SELECT COUNT(*) FROM diary_notes WHERE userId = u.id) +
        (SELECT COUNT(*) FROM events WHERE userId = u.id)
      ) DESC
      LIMIT 10
    `);
    const topUsersByContent = topUsersByContentResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      memories: Number(row.memories),
      diary: Number(row.diary),
      events: Number(row.events),
      total: Number(row.memories) + Number(row.diary) + Number(row.events),
    }));

    // ================== RECENT ACTIVITY ==================
    // Recent signups (last 10)
    const recentSignupsResult = await client.execute(`
      SELECT id, name, email, createdAt
      FROM users
      ORDER BY createdAt DESC
      LIMIT 10
    `);
    const recentSignups = recentSignupsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
    }));

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        googleLinked: googleLinkedUsers,
        newThisWeek: newUsersWeek,
        newThisMonth: newUsersMonth,
        growth: userGrowth,
      },
      socialGraph: {
        totalFriends,
        linkedFriends,
        avgFriendsPerUser: parseFloat(avgFriendsPerUser),
        connectionsPending,
        connectionsAccepted,
      },
      content: {
        memories: {
          total: totalMemories,
          withImages: memoriesWithImages,
        },
        diaryNotes: {
          total: totalDiaryNotes,
          withAnalysis: diaryWithAnalysis,
        },
        events: {
          total: totalEvents,
          completed: completedEvents,
          byCategory: eventsByCategory,
        },
      },
      engagement: {
        chatSessions: totalChatSessions,
        chatMessages: totalChatMessages,
        recentChatMessages,
      },
      tripPlanning: {
        total: totalTrips,
        byStatus: tripsByStatus,
        collaborators: totalTripCollaborators,
        messages: totalTripMessages,
        polls: totalTripPolls,
      },
      eventPlanning: {
        total: totalEventPlans,
        byStatus: eventPlansByStatus,
        collaborators: totalEventPlanCollaborators,
      },
      sharing: {
        pending: sharedItemsPending,
        accepted: sharedItemsAccepted,
        byType: sharedItemsByType,
      },
      wishlist: {
        total: totalWishlistItems,
        purchased: purchasedWishlistItems,
        byCategory: wishlistByCategory,
      },
      topUsers: {
        byFriends: topUsersByFriends,
        byContent: topUsersByContent,
      },
      recentSignups,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'Forbidden: Admin access required') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
