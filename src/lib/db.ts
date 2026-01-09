import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';
import { randomUUID } from "crypto";
import * as crypto from "crypto";

// Types
export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  birthday: Date | null;
  profileImage: string | null;
  phone: string | null;
  location: string | null;
  googleId: string | null;
  isTemporary: boolean;
  interests: string | null; // JSON array of interest IDs
  createdAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

type Friend = {
  id: string;
  userId: string;
  name: string;
  email: string | null; // Email for calendar invites
  birthday: Date | null;
  howWeMet: string | null;
  notes: string | null;
  interests: string | null;
  lastContact: Date | null;
  profileImage: string | null;
  customProfileImage: string | null; // User-uploaded custom image that overrides the default
  linkedUserId: string | null; // If set, this friend is an Amika user
  createdAt: Date;
};

type Memory = {
  id: string;
  userId: string;
  friendId: string | null;
  content: string;
  imageUrl: string | null;
  sharedWithFriend: boolean; // Whether to share with linked Amika friend
  createdAt: Date;
};

type DiaryNote = {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  analysis: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DiaryNoteTag = {
  noteId: string;
  friendId: string;
  sharedWithFriend: boolean; // Whether to share with linked Amika friend
  createdAt: Date;
};

type Event = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  category: string | null; // experiences, restaurants, places, fitness
  friendId: string | null; // Primary friend
  sharedWithFriend: boolean; // Whether to share with linked Amika friend
  completed: boolean;
  createdAt: Date;
};

type EventFriend = {
  eventId: string;
  friendId: string;
  createdAt: Date;
};

type ChatTranscript = {
  id: string;
  userId: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
};

type UserConnection = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
};

type SharedItem = {
  id: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  itemType: 'memory' | 'note' | 'event' | 'trip';
  itemId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  createdAt: Date;
};

export type FriendInvite = {
  id: string;
  inviterId: string;
  inviteCode: string;
  inviteeName: string | null;
  inviteeEmail: string | null;
  status: 'pending' | 'accepted' | 'expired';
  acceptedByUserId: string | null;
  expiresAt: Date;
  createdAt: Date;
};

export type WishlistItem = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  link: string | null;
  price: string | null;
  category: string | null;
  priority: number;
  imageUrl: string | null;
  purchased: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type GoogleAccount = {
  id: string;
  userId: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
  createdAt: Date;
  updatedAt: Date;
};

// Trip Planning Types
export type TripSession = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  locationDetails: string | null;
  shareToken: string | null;
  joinToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TripCollaborator = {
  id: string;
  tripId: string;
  friendId: string;
  userId: string | null;
  role: 'owner' | 'collaborator';
  joinedAt: Date;
};

export type TripDailyPlan = {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date | null;
};

export type TripEvent = {
  id: string;
  dailyPlanId: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  category: string | null;
  externalUrl: string | null;
  estimatedCost: number | null;
  notes: string | null;
  order: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TripTicket = {
  id: string;
  tripId: string;
  collaboratorId: string | null;
  type: 'flight' | 'train' | 'bus' | 'accommodation' | 'activity' | 'other';
  title: string;
  description: string | null;
  confirmationNum: string | null;
  departureTime: Date | null;
  arrivalTime: Date | null;
  location: string | null;
  cost: number | null;
  currency: string;
  url: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TripMessage = {
  id: string;
  tripId: string;
  userId: string;
  friendId: string | null;
  context: 'general' | 'dates' | 'location' | 'events' | 'tickets';
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
};

export type TripPoll = {
  id: string;
  tripId: string;
  context: 'dates' | 'location' | 'events' | 'tickets';
  question: string;
  status: 'active' | 'closed';
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
};

export type TripPollOption = {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
};

export type TripPollVote = {
  id: string;
  optionId: string;
  visitorId: string | null;
  friendId: string | null;
  votedAt: Date;
};

export type TripGoalProgress = {
  id: string;
  tripId: string;
  goalType: 'dates' | 'location' | 'daily_events' | 'tickets';
  status: 'pending' | 'in_progress' | 'completed';
  completedAt: Date | null;
};

// Event Planning Types (Group Event Planning)
export type EventPlanSession = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  eventDate: Date | null;
  eventTime: string | null;
  eventLocation: string | null;
  selectedEventId: string | null;
  shareToken: string | null;
  joinToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventPlanCollaborator = {
  id: string;
  eventPlanId: string;
  friendId: string;
  userId: string | null;
  role: 'owner' | 'collaborator';
  joinedAt: Date;
};

export type EventPlanCandidate = {
  id: string;
  eventPlanId: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  externalUrl: string | null;
  imageUrl: string | null;
  eventDate: Date | null;
  eventTime: string | null;
  estimatedCost: number | null;
  notes: string | null;
  order: number;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EventPlanMessage = {
  id: string;
  eventPlanId: string;
  userId: string;
  friendId: string | null;
  context: 'general' | 'date' | 'event';
  role: 'user' | 'assistant';
  content: string;
  toolResults: string | null; // JSON string of tool results for card rendering
  createdAt: Date;
};

export type EventPlanPoll = {
  id: string;
  eventPlanId: string;
  context: 'date' | 'event';
  question: string;
  status: 'active' | 'closed';
  createdById: string;
  createdAt: Date;
  closedAt: Date | null;
};

export type EventPlanPollOption = {
  id: string;
  pollId: string;
  label: string;
  url: string | null;
  order: number;
};

export type EventPlanPollVote = {
  id: string;
  optionId: string;
  visitorId: string | null;
  friendId: string | null;
  votedAt: Date;
};

export type EventPlanGoalProgress = {
  id: string;
  eventPlanId: string;
  goalType: 'date' | 'event';
  status: 'pending' | 'in_progress' | 'completed';
  completedAt: Date | null;
};

// Chat notification type for group chat messages
export type ChatNotification = {
  id: string;
  recipientUserId: string;
  senderUserId: string;
  senderName: string;
  chatType: 'event_plan' | 'trip';
  chatId: string;
  chatTitle: string;
  messagePreview: string;
  messageCount: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

let clientInstance: Client | null = null;
let tablesInitialized = false;
let joinTokenColumnChecked = false;

// Separate migration for joinToken column (runs independently of tablesInitialized)
async function ensureJoinTokenColumn() {
  if (joinTokenColumnChecked) return;

  try {
    const client = getClient();
    const tableInfo = await client.execute(`PRAGMA table_info(trip_sessions)`);
    const hasJoinToken = tableInfo.rows.some((row: any) => row.name === 'joinToken' || row[1] === 'joinToken');

    if (!hasJoinToken) {
      console.log('Migration: Adding joinToken column to trip_sessions...');
      // SQLite doesn't allow adding UNIQUE columns via ALTER TABLE
      // Add column first, then create unique index separately
      await client.execute(`ALTER TABLE trip_sessions ADD COLUMN joinToken TEXT`);
      console.log('Migration: joinToken column added, creating unique index...');
      await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_sessions_joinToken ON trip_sessions(joinToken)`);
      console.log('Migration: joinToken column and index added successfully');
    }

    joinTokenColumnChecked = true;
  } catch (error) {
    console.error('Error in joinToken migration:', error);
    // Still mark as checked to avoid repeated failed attempts
    joinTokenColumnChecked = true;
  }
}

// Password hashing utilities
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Lazy initialize Turso client
function getClient(): Client {
  if (!clientInstance) {
    clientInstance = createClient({
      url: process.env.TURSO_DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || ''
    });
  }
  return clientInstance;
}

// Initialize database tables on first use
async function ensureTablesExist() {
  if (tablesInitialized) return;

  const client = getClient();

  try {
    // Create users table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        name TEXT NOT NULL,
        birthday TEXT,
        profileImage TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // Create sessions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        userId TEXT,
        name TEXT NOT NULL,
        birthday TEXT,
        howWeMet TEXT,
        notes TEXT,
        lastContact TEXT,
        profileImage TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        userId TEXT,
        friendId TEXT NOT NULL,
        content TEXT NOT NULL,
        imageUrl TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS diary_notes (
        id TEXT PRIMARY KEY,
        userId TEXT,
        title TEXT,
        content TEXT NOT NULL,
        analysis TEXT,
        imageUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS diary_note_tags (
        noteId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (noteId, friendId),
        FOREIGN KEY (noteId) REFERENCES diary_notes(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        userId TEXT,
        title TEXT NOT NULL,
        description TEXT,
        eventDate TEXT NOT NULL,
        location TEXT,
        category TEXT,
        friendId TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS chat_transcripts (
        id TEXT PRIMARY KEY,
        userId TEXT,
        sessionId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Junction table for many-to-many relationship between events and friends
    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_friends (
        eventId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (eventId, friendId),
        FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
      )
    `);

    // User connections (friend requests between Amika users)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_connections (
        id TEXT PRIMARY KEY,
        requesterId TEXT NOT NULL,
        addresseeId TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (addresseeId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (requesterId, addresseeId)
      )
    `);

    // Shared items between connected users
    await client.execute(`
      CREATE TABLE IF NOT EXISTS shared_items (
        id TEXT PRIMARY KEY,
        sharedByUserId TEXT NOT NULL,
        sharedWithUserId TEXT NOT NULL,
        itemType TEXT NOT NULL,
        itemId TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        message TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (sharedByUserId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sharedWithUserId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (sharedByUserId, sharedWithUserId, itemType, itemId)
      )
    `);

    // Wishlist items
    await client.execute(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        link TEXT,
        price TEXT,
        category TEXT,
        priority INTEGER DEFAULT 0,
        imageUrl TEXT,
        purchased INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Google accounts for Calendar integration
    await client.execute(`
      CREATE TABLE IF NOT EXISTS google_accounts (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        googleEmail TEXT NOT NULL,
        accessToken TEXT NOT NULL,
        refreshToken TEXT NOT NULL,
        tokenExpiry TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add migrations for existing tables
    try {
      await client.execute(`ALTER TABLE friends ADD COLUMN profileImage TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE friends ADD COLUMN userId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE memories ADD COLUMN imageUrl TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE memories ADD COLUMN userId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE diary_notes ADD COLUMN imageUrl TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE diary_notes ADD COLUMN analysis TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE diary_notes ADD COLUMN userId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE events ADD COLUMN userId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE events ADD COLUMN completed INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE events ADD COLUMN category TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE chat_transcripts ADD COLUMN userId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE friends ADD COLUMN interests TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Add interests to users table for user's own interests
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN interests TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Add linkedUserId to friends table for Amika friend unification
    try {
      await client.execute(`ALTER TABLE friends ADD COLUMN linkedUserId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Add customProfileImage to friends table for custom profile picture override
    try {
      await client.execute(`ALTER TABLE friends ADD COLUMN customProfileImage TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Add email to friends table for calendar invites
    try {
      await client.execute(`ALTER TABLE friends ADD COLUMN email TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Add sharedWithFriend to memories table
    try {
      await client.execute(`ALTER TABLE memories ADD COLUMN sharedWithFriend INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // Add sharedWithFriend to events table
    try {
      await client.execute(`ALTER TABLE events ADD COLUMN sharedWithFriend INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // Add sharedWithFriend to diary_note_tags table
    try {
      await client.execute(`ALTER TABLE diary_note_tags ADD COLUMN sharedWithFriend INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // Legacy columns - keep for backward compatibility during migration
    try {
      await client.execute(`ALTER TABLE memories ADD COLUMN amikaFriendUserId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE memories ADD COLUMN sharedWithAmikaFriend INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE events ADD COLUMN amikaFriendUserId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE events ADD COLUMN sharedWithAmikaFriend INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // Add share and join tokens for events
    try {
      await client.execute(`ALTER TABLE events ADD COLUMN shareToken TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE events ADD COLUMN joinToken TEXT`);
    } catch (e) {
      // Column might already exist
    }

    // Create unique indexes for share/join tokens (SQLite doesn't support UNIQUE in ALTER TABLE)
    try {
      await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_events_shareToken ON events(shareToken)`);
    } catch (e) {
      // Index might already exist
    }

    try {
      await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_events_joinToken ON events(joinToken)`);
    } catch (e) {
      // Index might already exist
    }

    // Create diary_note_amika_tags table (legacy - keep for backward compatibility)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS diary_note_amika_tags (
        noteId TEXT NOT NULL,
        amikaFriendUserId TEXT NOT NULL,
        sharedWithAmikaFriend INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (noteId, amikaFriendUserId),
        FOREIGN KEY (noteId) REFERENCES diary_notes(id) ON DELETE CASCADE,
        FOREIGN KEY (amikaFriendUserId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add phone, location, googleId, and isTemporary columns to users table
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN phone TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE users ADD COLUMN location TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE users ADD COLUMN googleId TEXT`);
    } catch (e) {
      // Column might already exist
    }

    try {
      await client.execute(`ALTER TABLE users ADD COLUMN isTemporary INTEGER DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // Create friend_invites table for invite links
    await client.execute(`
      CREATE TABLE IF NOT EXISTS friend_invites (
        id TEXT PRIMARY KEY,
        inviterId TEXT NOT NULL,
        inviteCode TEXT UNIQUE NOT NULL,
        inviteeName TEXT,
        inviteeEmail TEXT,
        status TEXT DEFAULT 'pending',
        acceptedByUserId TEXT,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (inviterId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (acceptedByUserId) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Trip planning tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'planning',
        startDate TEXT,
        endDate TEXT,
        location TEXT,
        locationDetails TEXT,
        shareToken TEXT UNIQUE,
        joinToken TEXT UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add shareToken column if it doesn't exist (migration for existing tables)
    await client.execute(`
      ALTER TABLE trip_sessions ADD COLUMN shareToken TEXT UNIQUE
    `).catch(() => {/* Column may already exist */});

    // Add joinToken column if it doesn't exist (migration for existing tables)
    // Check if column exists first using PRAGMA
    try {
      const tableInfo = await client.execute(`PRAGMA table_info(trip_sessions)`);
      const hasJoinToken = tableInfo.rows.some((row: any) => row.name === 'joinToken');
      if (!hasJoinToken) {
        console.log('Adding joinToken column to trip_sessions...');
        // SQLite doesn't allow UNIQUE in ALTER TABLE, add column then create index
        await client.execute(`ALTER TABLE trip_sessions ADD COLUMN joinToken TEXT`);
        await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_sessions_joinToken ON trip_sessions(joinToken)`);
        console.log('joinToken column added successfully');
      }
    } catch (error) {
      console.error('Error checking/adding joinToken column:', error);
    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_collaborators (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        userId TEXT,
        role TEXT DEFAULT 'collaborator',
        joinedAt TEXT NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE,
        UNIQUE (tripId, friendId)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_daily_plans (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        dayNumber INTEGER NOT NULL,
        date TEXT,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE,
        UNIQUE (tripId, dayNumber)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_events (
        id TEXT PRIMARY KEY,
        dailyPlanId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        startTime TEXT,
        endTime TEXT,
        location TEXT,
        category TEXT,
        externalUrl TEXT,
        estimatedCost REAL,
        notes TEXT,
        "order" INTEGER DEFAULT 0,
        createdById TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (dailyPlanId) REFERENCES trip_daily_plans(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_tickets (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        collaboratorId TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        confirmationNum TEXT,
        departureTime TEXT,
        arrivalTime TEXT,
        location TEXT,
        cost REAL,
        currency TEXT DEFAULT 'USD',
        url TEXT,
        createdById TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_messages (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        userId TEXT NOT NULL,
        friendId TEXT,
        context TEXT DEFAULT 'general',
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_polls (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        context TEXT NOT NULL,
        question TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        createdById TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        closedAt TEXT,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_poll_options (
        id TEXT PRIMARY KEY,
        pollId TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY (pollId) REFERENCES trip_polls(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_poll_votes (
        id TEXT PRIMARY KEY,
        optionId TEXT NOT NULL,
        visitorId TEXT,
        friendId TEXT,
        votedAt TEXT NOT NULL,
        FOREIGN KEY (optionId) REFERENCES trip_poll_options(id) ON DELETE CASCADE,
        UNIQUE (optionId, visitorId),
        UNIQUE (optionId, friendId)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_goal_progress (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        goalType TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        completedAt TEXT,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE,
        UNIQUE (tripId, goalType)
      )
    `);

    // Trip presence tracking for real-time collaboration
    await client.execute(`
      CREATE TABLE IF NOT EXISTS trip_presence (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        userId TEXT NOT NULL,
        context TEXT DEFAULT 'general',
        isTyping INTEGER DEFAULT 0,
        lastSeen TEXT NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trip_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (tripId, userId)
      )
    `);

    // Event planning tables
    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_sessions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'planning',
        eventDate TEXT,
        eventTime TEXT,
        eventLocation TEXT,
        selectedEventId TEXT,
        shareToken TEXT UNIQUE,
        joinToken TEXT UNIQUE,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_collaborators (
        id TEXT PRIMARY KEY,
        eventPlanId TEXT NOT NULL,
        friendId TEXT NOT NULL,
        userId TEXT,
        role TEXT DEFAULT 'collaborator',
        joinedAt TEXT NOT NULL,
        FOREIGN KEY (eventPlanId) REFERENCES event_plan_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE,
        UNIQUE (eventPlanId, friendId)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_candidates (
        id TEXT PRIMARY KEY,
        eventPlanId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        category TEXT,
        externalUrl TEXT,
        imageUrl TEXT,
        eventDate TEXT,
        eventTime TEXT,
        estimatedCost REAL,
        notes TEXT,
        "order" INTEGER DEFAULT 0,
        createdById TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (eventPlanId) REFERENCES event_plan_sessions(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_messages (
        id TEXT PRIMARY KEY,
        eventPlanId TEXT NOT NULL,
        userId TEXT NOT NULL,
        friendId TEXT,
        context TEXT DEFAULT 'general',
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        toolResults TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (eventPlanId) REFERENCES event_plan_sessions(id) ON DELETE CASCADE
      )
    `);

    // Add toolResults column if it doesn't exist (migration for existing tables)
    try {
      await client.execute(`ALTER TABLE event_plan_messages ADD COLUMN toolResults TEXT`);
    } catch {
      // Column already exists
    }

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_polls (
        id TEXT PRIMARY KEY,
        eventPlanId TEXT NOT NULL,
        context TEXT NOT NULL,
        question TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        createdById TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        closedAt TEXT,
        FOREIGN KEY (eventPlanId) REFERENCES event_plan_sessions(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_poll_options (
        id TEXT PRIMARY KEY,
        pollId TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT,
        "order" INTEGER DEFAULT 0,
        FOREIGN KEY (pollId) REFERENCES event_plan_polls(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_poll_votes (
        id TEXT PRIMARY KEY,
        optionId TEXT NOT NULL,
        visitorId TEXT,
        friendId TEXT,
        votedAt TEXT NOT NULL,
        FOREIGN KEY (optionId) REFERENCES event_plan_poll_options(id) ON DELETE CASCADE,
        UNIQUE (optionId, visitorId),
        UNIQUE (optionId, friendId)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_goal_progress (
        id TEXT PRIMARY KEY,
        eventPlanId TEXT NOT NULL,
        goalType TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        completedAt TEXT,
        FOREIGN KEY (eventPlanId) REFERENCES event_plan_sessions(id) ON DELETE CASCADE,
        UNIQUE (eventPlanId, goalType)
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS event_plan_presence (
        id TEXT PRIMARY KEY,
        eventPlanId TEXT NOT NULL,
        userId TEXT NOT NULL,
        context TEXT DEFAULT 'general',
        isTyping INTEGER DEFAULT 0,
        lastSeen TEXT NOT NULL,
        FOREIGN KEY (eventPlanId) REFERENCES event_plan_sessions(id) ON DELETE CASCADE,
        UNIQUE (eventPlanId, userId)
      )
    `);

    // Chat notifications for group chats (event plans and trips)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS chat_notifications (
        id TEXT PRIMARY KEY,
        recipientUserId TEXT NOT NULL,
        senderUserId TEXT NOT NULL,
        senderName TEXT NOT NULL,
        chatType TEXT NOT NULL,
        chatId TEXT NOT NULL,
        chatTitle TEXT NOT NULL,
        messagePreview TEXT NOT NULL,
        messageCount INTEGER DEFAULT 1,
        isRead INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (recipientUserId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (senderUserId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (recipientUserId, chatType, chatId)
      )
    `);

    tablesInitialized = true;
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

export const prisma = {
  // User operations
  user: {
    findByEmail: async (email: string): Promise<User | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Normalize email: trim whitespace and convert to lowercase
      const normalizedEmail = email.trim().toLowerCase();

      const result = await client.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [normalizedEmail],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        email: row.email as string,
        passwordHash: row.passwordHash as string,
        name: row.name as string,
        birthday: row.birthday ? new Date(row.birthday as string) : null,
        profileImage: row.profileImage as string | null,
        phone: row.phone as string | null,
        location: row.location as string | null,
        googleId: row.googleId as string | null,
        isTemporary: Boolean(row.isTemporary),
        interests: row.interests as string | null,
        createdAt: new Date(row.createdAt as string),
      };
    },

    findById: async (id: string): Promise<User | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM users WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        email: row.email as string,
        passwordHash: row.passwordHash as string,
        name: row.name as string,
        birthday: row.birthday ? new Date(row.birthday as string) : null,
        profileImage: row.profileImage as string | null,
        phone: row.phone as string | null,
        location: row.location as string | null,
        googleId: row.googleId as string | null,
        isTemporary: Boolean(row.isTemporary),
        interests: row.interests as string | null,
        createdAt: new Date(row.createdAt as string),
      };
    },

    findByGoogleId: async (googleId: string): Promise<User | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM users WHERE googleId = ?',
        args: [googleId],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        email: row.email as string,
        passwordHash: row.passwordHash as string,
        name: row.name as string,
        birthday: row.birthday ? new Date(row.birthday as string) : null,
        profileImage: row.profileImage as string | null,
        phone: row.phone as string | null,
        location: row.location as string | null,
        googleId: row.googleId as string | null,
        isTemporary: Boolean(row.isTemporary),
        interests: row.interests as string | null,
        createdAt: new Date(row.createdAt as string),
      };
    },

    create: async (data: {
      email: string;
      password: string;
      name: string;
      birthday?: Date | null;
      profileImage?: string | null;
      googleId?: string | null;
      isTemporary?: boolean;
    }): Promise<User> => {
      await ensureTablesExist();
      const client = getClient();

      // Normalize email: trim whitespace and convert to lowercase
      const normalizedEmail = data.email.trim().toLowerCase();

      const existing = await prisma.user.findByEmail(normalizedEmail);
      if (existing) {
        throw new Error('User with this email already exists');
      }

      const user: User = {
        id: randomUUID(),
        email: normalizedEmail,
        passwordHash: hashPassword(data.password),
        name: data.name,
        birthday: data.birthday ?? null,
        profileImage: data.profileImage ?? null,
        phone: null,
        location: null,
        googleId: data.googleId ?? null,
        isTemporary: data.isTemporary ?? false,
        interests: null,
        createdAt: new Date(),
      };

      try {
        await client.execute({
          sql: 'INSERT INTO users (id, email, passwordHash, name, birthday, profileImage, phone, location, googleId, isTemporary, interests, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            user.id,
            user.email,
            user.passwordHash,
            user.name,
            user.birthday ? user.birthday.toISOString() : null,
            user.profileImage,
            user.phone,
            user.location,
            user.googleId,
            user.isTemporary ? 1 : 0,
            user.interests,
            user.createdAt.toISOString(),
          ],
        });
      } catch (error: any) {
        // Handle race condition: if database UNIQUE constraint catches a duplicate
        if (error.message?.includes('UNIQUE constraint failed') ||
            error.message?.includes('duplicate key') ||
            error.code === 'SQLITE_CONSTRAINT') {
          throw new Error('User with this email already exists');
        }
        throw error;
      }

      return user;
    },

    update: async (id: string, data: {
      name?: string;
      birthday?: Date | null;
      profileImage?: string | null;
      phone?: string | null;
      location?: string | null;
      googleId?: string | null;
      isTemporary?: boolean;
      interests?: string | null;
    }): Promise<User> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await prisma.user.findById(id);
      if (!existing) {
        throw new Error('User not found');
      }

      const updated: User = {
        ...existing,
        name: data.name ?? existing.name,
        birthday: data.birthday !== undefined ? data.birthday : existing.birthday,
        profileImage: data.profileImage !== undefined ? data.profileImage : existing.profileImage,
        phone: data.phone !== undefined ? data.phone : existing.phone,
        location: data.location !== undefined ? data.location : existing.location,
        googleId: data.googleId !== undefined ? data.googleId : existing.googleId,
        isTemporary: data.isTemporary !== undefined ? data.isTemporary : existing.isTemporary,
        interests: data.interests !== undefined ? data.interests : existing.interests,
      };

      await client.execute({
        sql: 'UPDATE users SET name = ?, birthday = ?, profileImage = ?, phone = ?, location = ?, googleId = ?, isTemporary = ?, interests = ? WHERE id = ?',
        args: [
          updated.name,
          updated.birthday ? updated.birthday.toISOString() : null,
          updated.profileImage,
          updated.phone,
          updated.location,
          updated.googleId,
          updated.isTemporary ? 1 : 0,
          updated.interests,
          id,
        ],
      });

      return updated;
    },

    verifyPassword: async (email: string, password: string): Promise<User | null> => {
      const user = await prisma.user.findByEmail(email);
      if (!user) return null;

      if (verifyPassword(password, user.passwordHash)) {
        return user;
      }
      return null;
    },
  },

  // Session operations
  session: {
    create: async (userId: string): Promise<Session> => {
      await ensureTablesExist();
      const client = getClient();

      const session: Session = {
        id: randomUUID(),
        userId,
        token: generateSessionToken(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO sessions (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [
          session.id,
          session.userId,
          session.token,
          session.expiresAt.toISOString(),
          session.createdAt.toISOString(),
        ],
      });

      return session;
    },

    findByToken: async (token: string): Promise<Session | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM sessions WHERE token = ?',
        args: [token],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const session: Session = {
        id: row.id as string,
        userId: row.userId as string,
        token: row.token as string,
        expiresAt: new Date(row.expiresAt as string),
        createdAt: new Date(row.createdAt as string),
      };

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        await prisma.session.delete(token);
        return null;
      }

      return session;
    },

    delete: async (token: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      await client.execute({
        sql: 'DELETE FROM sessions WHERE token = ?',
        args: [token],
      });
    },

    deleteAllForUser: async (userId: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      await client.execute({
        sql: 'DELETE FROM sessions WHERE userId = ?',
        args: [userId],
      });
    },
  },

  friend: {
    findMany: async (args?: { userId?: string; include?: { memories?: { orderBy?: { createdAt: string } } }; orderBy?: { createdAt: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM friends';
      let sqlArgs: any[] = [];

      if (args?.userId) {
        sql += ' WHERE userId = ?';
        sqlArgs = [args.userId];
      }
      sql += ' ORDER BY createdAt DESC';

      const friendsResult = await client.execute({ sql, args: sqlArgs });
      const friends: Friend[] = friendsResult.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        name: row.name as string,
        email: row.email as string | null,
        birthday: row.birthday ? new Date(row.birthday as string) : null,
        howWeMet: row.howWeMet as string | null,
        notes: row.notes as string | null,
        interests: row.interests as string | null,
        lastContact: row.lastContact ? new Date(row.lastContact as string) : null,
        profileImage: row.profileImage as string | null,
        customProfileImage: row.customProfileImage as string | null,
        linkedUserId: row.linkedUserId as string | null,
        createdAt: new Date(row.createdAt as string),
      }));

      if (args?.include?.memories) {
        let memorySql = 'SELECT * FROM memories';
        let memoryArgs: any[] = [];
        if (args?.userId) {
          memorySql += ' WHERE userId = ?';
          memoryArgs = [args.userId];
        }
        memorySql += ' ORDER BY createdAt DESC';

        const memoriesResult = await client.execute({ sql: memorySql, args: memoryArgs });
        const memories: Memory[] = memoriesResult.rows.map((row: any) => ({
          id: row.id as string,
          userId: row.userId as string,
          friendId: row.friendId as string | null,
          content: row.content as string,
          imageUrl: row.imageUrl as string | null,
          sharedWithFriend: Boolean(row.sharedWithFriend),
          createdAt: new Date(row.createdAt as string),
        }));

        return friends.map((friend) => ({
          ...friend,
          memories: memories
            .filter((memory) => memory.friendId === friend.id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        }));
      }

      return friends;
    },
    create: async ({ data }: { data: Partial<Friend> & { userId: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      const newFriend: Friend = {
        id: randomUUID(),
        userId: data.userId,
        name: data.name ?? "",
        email: data.email ?? null,
        birthday: data.birthday ?? null,
        howWeMet: data.howWeMet ?? null,
        notes: data.notes ?? null,
        interests: data.interests ?? null,
        lastContact: data.lastContact ?? null,
        profileImage: data.profileImage ?? null,
        customProfileImage: data.customProfileImage ?? null,
        linkedUserId: data.linkedUserId ?? null,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO friends (id, userId, name, email, birthday, howWeMet, notes, interests, lastContact, profileImage, customProfileImage, linkedUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          newFriend.id,
          newFriend.userId,
          newFriend.name,
          newFriend.email,
          newFriend.birthday ? newFriend.birthday.toISOString() : null,
          newFriend.howWeMet,
          newFriend.notes,
          newFriend.interests,
          newFriend.lastContact ? newFriend.lastContact.toISOString() : null,
          newFriend.profileImage,
          newFriend.customProfileImage,
          newFriend.linkedUserId,
          newFriend.createdAt.toISOString(),
        ],
      });

      return newFriend;
    },
    update: async ({ where, data }: { where: { id: string; userId?: string }; data: Partial<Friend> & { email?: string | null } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM friends WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error("Friend not found");
      }

      const existing = existingResult.rows[0];
      const updated: Friend = {
        id: existing.id as string,
        userId: existing.userId as string,
        name: (data.name ?? existing.name) as string,
        email: (data.email !== undefined ? data.email : existing.email) as string | null,
        birthday: data.birthday !== undefined ? data.birthday : (existing.birthday ? new Date(existing.birthday as string) : null),
        howWeMet: (data.howWeMet !== undefined ? data.howWeMet : existing.howWeMet) as string | null,
        notes: (data.notes !== undefined ? data.notes : existing.notes) as string | null,
        interests: (data.interests !== undefined ? data.interests : existing.interests) as string | null,
        lastContact: data.lastContact !== undefined ? data.lastContact : (existing.lastContact ? new Date(existing.lastContact as string) : null),
        profileImage: (data.profileImage !== undefined ? data.profileImage : existing.profileImage) as string | null,
        customProfileImage: (data.customProfileImage !== undefined ? data.customProfileImage : existing.customProfileImage) as string | null,
        linkedUserId: (data.linkedUserId !== undefined ? data.linkedUserId : existing.linkedUserId) as string | null,
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE friends SET name = ?, email = ?, birthday = ?, howWeMet = ?, notes = ?, interests = ?, lastContact = ?, profileImage = ?, customProfileImage = ? WHERE id = ?',
        args: [
          updated.name,
          updated.email,
          updated.birthday ? updated.birthday.toISOString() : null,
          updated.howWeMet,
          updated.notes,
          updated.interests,
          updated.lastContact ? updated.lastContact.toISOString() : null,
          updated.profileImage,
          updated.customProfileImage,
          where.id,
        ],
      });

      return updated;
    },
    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM friends WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error("Friend not found");
      }

      // Delete related memories first (if not using CASCADE)
      await client.execute({
        sql: 'DELETE FROM memories WHERE friendId = ?',
        args: [where.id],
      });

      // Delete related events where this friend is the primary friend
      await client.execute({
        sql: 'DELETE FROM events WHERE friendId = ?',
        args: [where.id],
      });

      // Delete event_friends entries where this friend is an additional participant
      await client.execute({
        sql: 'DELETE FROM event_friends WHERE friendId = ?',
        args: [where.id],
      });

      // Delete related diary note tags
      await client.execute({
        sql: 'DELETE FROM diary_note_tags WHERE friendId = ?',
        args: [where.id],
      });

      // Delete the friend
      await client.execute({
        sql: 'DELETE FROM friends WHERE id = ?',
        args: [where.id],
      });

      return { success: true };
    },
  },
  memory: {
    findMany: async (args?: { userId?: string }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM memories WHERE friendId IS NOT NULL';
      let sqlArgs: any[] = [];
      if (args?.userId) {
        sql += ' AND userId = ?';
        sqlArgs = [args.userId];
      }
      sql += ' ORDER BY createdAt DESC';

      const memoriesResult = await client.execute({ sql, args: sqlArgs });

      let friendSql = 'SELECT id, name FROM friends';
      let friendArgs: any[] = [];
      if (args?.userId) {
        friendSql += ' WHERE userId = ?';
        friendArgs = [args.userId];
      }
      const friendsResult = await client.execute({ sql: friendSql, args: friendArgs });

      const friendMap = new Map<string, { id: string; name: string }>(
        friendsResult.rows.map((row: any) => [
          row.id as string,
          { id: row.id as string, name: row.name as string },
        ])
      );

      return memoriesResult.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        friendId: row.friendId as string,
        content: row.content as string,
        imageUrl: row.imageUrl as string | null,
        sharedWithFriend: Boolean(row.sharedWithFriend),
        createdAt: new Date(row.createdAt as string),
        friend: friendMap.get(row.friendId as string) || null,
      }));
    },
    // Find memories for a specific friend
    findManyByFriend: async (args: { userId: string; friendId: string }) => {
      await ensureTablesExist();
      const client = getClient();

      const memoriesResult = await client.execute({
        sql: 'SELECT * FROM memories WHERE userId = ? AND friendId = ? ORDER BY createdAt DESC',
        args: [args.userId, args.friendId],
      });

      return memoriesResult.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        friendId: row.friendId as string,
        content: row.content as string,
        imageUrl: row.imageUrl as string | null,
        sharedWithFriend: Boolean(row.sharedWithFriend),
        createdAt: new Date(row.createdAt as string),
      }));
    },
    // Legacy - kept for backward compatibility
    findManyByAmikaFriend: async (args: { userId: string; amikaFriendUserId: string }) => {
      await ensureTablesExist();
      const client = getClient();

      const memoriesResult = await client.execute({
        sql: 'SELECT * FROM memories WHERE userId = ? AND amikaFriendUserId = ? ORDER BY createdAt DESC',
        args: [args.userId, args.amikaFriendUserId],
      });

      return memoriesResult.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        amikaFriendUserId: row.amikaFriendUserId as string,
        content: row.content as string,
        imageUrl: row.imageUrl as string | null,
        sharedWithAmikaFriend: Boolean(row.sharedWithAmikaFriend),
        createdAt: new Date(row.createdAt as string),
      }));
    },
    create: async ({ data }: { data: { userId: string; friendId: string; content: string; imageUrl?: string | null; sharedWithFriend?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      const friendResult = await client.execute({
        sql: 'SELECT * FROM friends WHERE id = ? AND userId = ?',
        args: [data.friendId, data.userId],
      });

      if (friendResult.rows.length === 0) {
        throw new Error("Friend not found");
      }

      const memory: Memory = {
        id: randomUUID(),
        userId: data.userId,
        friendId: data.friendId,
        content: data.content,
        imageUrl: data.imageUrl ?? null,
        sharedWithFriend: data.sharedWithFriend ?? false,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO memories (id, userId, friendId, content, imageUrl, sharedWithFriend, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          memory.id,
          memory.userId,
          memory.friendId,
          memory.content,
          memory.imageUrl,
          memory.sharedWithFriend ? 1 : 0,
          memory.createdAt.toISOString(),
        ],
      });

      return memory;
    },
    createForAmikaFriend: async ({ data }: { data: { userId: string; amikaFriendUserId: string; content: string; imageUrl?: string | null; sharedWithAmikaFriend?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      // Verify the users are connected
      const isConnected = await prisma.userConnection.areConnected(data.userId, data.amikaFriendUserId);
      if (!isConnected) {
        throw new Error("Not connected with this Amika friend");
      }

      const memory = {
        id: randomUUID(),
        userId: data.userId,
        friendId: null,
        amikaFriendUserId: data.amikaFriendUserId,
        content: data.content,
        imageUrl: data.imageUrl ?? null,
        sharedWithAmikaFriend: data.sharedWithAmikaFriend ?? false,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO memories (id, userId, friendId, amikaFriendUserId, content, imageUrl, sharedWithAmikaFriend, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          memory.id,
          memory.userId,
          memory.friendId,
          memory.amikaFriendUserId,
          memory.content,
          memory.imageUrl,
          memory.sharedWithAmikaFriend ? 1 : 0,
          memory.createdAt.toISOString(),
        ],
      });

      return memory;
    },
    updateSharing: async ({ where, sharedWithFriend }: { where: { id: string; userId: string }; sharedWithFriend: boolean }) => {
      await ensureTablesExist();
      const client = getClient();

      await client.execute({
        sql: 'UPDATE memories SET sharedWithFriend = ? WHERE id = ? AND userId = ?',
        args: [sharedWithFriend ? 1 : 0, where.id, where.userId],
      });

      return { success: true };
    },
    update: async ({ where, data }: { where: { id: string; userId?: string }; data: { content?: string; imageUrl?: string | null; sharedWithFriend?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM memories WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error('Memory not found');
      }

      const existing = existingResult.rows[0];
      const updated: Memory = {
        id: existing.id as string,
        userId: existing.userId as string,
        friendId: existing.friendId as string | null,
        content: data.content !== undefined ? data.content : existing.content as string,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl as string | null,
        sharedWithFriend: data.sharedWithFriend !== undefined ? data.sharedWithFriend : Boolean(existing.sharedWithFriend),
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE memories SET content = ?, imageUrl = ?, sharedWithFriend = ? WHERE id = ?',
        args: [updated.content, updated.imageUrl, updated.sharedWithFriend ? 1 : 0, where.id],
      });

      return updated;
    },
    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM memories WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error("Memory not found");
      }

      await client.execute({
        sql: 'DELETE FROM memories WHERE id = ?',
        args: [where.id],
      });

      return { success: true };
    },
  },
  diaryNote: {
    findMany: async (args?: { userId?: string }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM diary_notes';
      let sqlArgs: any[] = [];
      if (args?.userId) {
        sql += ' WHERE userId = ?';
        sqlArgs = [args.userId];
      }
      sql += ' ORDER BY createdAt DESC';

      const notesResult = await client.execute({ sql, args: sqlArgs });
      const tagsResult = await client.execute('SELECT * FROM diary_note_tags');

      let friendSql = 'SELECT id, name, linkedUserId FROM friends';
      let friendArgs: any[] = [];
      if (args?.userId) {
        friendSql += ' WHERE userId = ?';
        friendArgs = [args.userId];
      }
      const friendsResult = await client.execute({ sql: friendSql, args: friendArgs });

      const friendMap = new Map<string, Friend>(
        friendsResult.rows.map((row: any) => [
          row.id as string,
          {
            id: row.id as string,
            userId: args?.userId || '',
            name: row.name as string,
            email: row.email as string | null,
            birthday: null,
            howWeMet: null,
            notes: null,
            interests: null,
            lastContact: null,
            profileImage: null,
            customProfileImage: null,
            linkedUserId: row.linkedUserId as string | null,
            createdAt: new Date(),
          },
        ])
      );

      const tags: DiaryNoteTag[] = tagsResult.rows.map((row: any) => ({
        noteId: row.noteId as string,
        friendId: row.friendId as string,
        sharedWithFriend: Boolean(row.sharedWithFriend),
        createdAt: new Date(row.createdAt as string),
      }));

      const notes: DiaryNote[] = notesResult.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        title: (row.title as string | null) ?? null,
        content: row.content as string,
        analysis: (row.analysis as string | null) ?? null,
        imageUrl: row.imageUrl as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));

      return notes.map((note) => {
        const noteTags = tags.filter((tag) => tag.noteId === note.id);
        return {
          ...note,
          friends: noteTags
            .map((tag) => {
              const friend = friendMap.get(tag.friendId);
              if (friend) {
                return { ...friend, sharedWithFriend: tag.sharedWithFriend };
              }
              return null;
            })
            .filter(Boolean) as (Friend & { sharedWithFriend: boolean })[],
        };
      });
    },
    create: async ({
      data,
    }: {
      data: { userId: string; title?: string | null; content: string; analysis?: string | null; imageUrl?: string | null; friendIds?: string[]; friendTags?: { friendId: string; sharedWithFriend: boolean }[] };
    }) => {
      await ensureTablesExist();
      const client = getClient();
      const now = new Date();

      const note: DiaryNote = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title ?? null,
        content: data.content,
        analysis: data.analysis ?? null,
        imageUrl: data.imageUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO diary_notes (id, userId, title, content, analysis, imageUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          note.id,
          note.userId,
          note.title,
          note.content,
          note.analysis,
          note.imageUrl,
          note.createdAt.toISOString(),
          note.updatedAt.toISOString(),
        ],
      });

      // Support both legacy friendIds and new friendTags with sharing
      if (data.friendTags && data.friendTags.length > 0) {
        const insertValues = data.friendTags.map(() => '(?, ?, ?, ?)').join(', ');
        await client.execute({
          sql: `INSERT INTO diary_note_tags (noteId, friendId, sharedWithFriend, createdAt) VALUES ${insertValues}`,
          args: data.friendTags.flatMap((tag) => [note.id, tag.friendId, tag.sharedWithFriend ? 1 : 0, now.toISOString()]),
        });
      } else if (data.friendIds && data.friendIds.length > 0) {
        const insertValues = data.friendIds.map(() => '(?, ?, ?, ?)').join(', ');
        await client.execute({
          sql: `INSERT INTO diary_note_tags (noteId, friendId, sharedWithFriend, createdAt) VALUES ${insertValues}`,
          args: data.friendIds.flatMap((friendId) => [note.id, friendId, 0, now.toISOString()]),
        });
      }

      return prisma.diaryNote.findMany({ userId: data.userId }).then((notes) =>
        notes.find((entry) => entry.id === note.id) || { ...note, friends: [] }
      );
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string; userId?: string };
      data: { title?: string | null; content?: string; analysis?: string | null; imageUrl?: string | null; friendIds?: string[]; friendTags?: { friendId: string; sharedWithFriend: boolean }[] };
    }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM diary_notes WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error('Note not found');
      }

      const existing = existingResult.rows[0];
      const now = new Date();
      const updated: DiaryNote = {
        id: existing.id as string,
        userId: existing.userId as string,
        title:
          data.title !== undefined ? data.title : ((existing.title as string | null) ?? null),
        content: (data.content ?? existing.content) as string,
        analysis: data.analysis !== undefined ? data.analysis : ((existing.analysis as string | null) ?? null),
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : (existing.imageUrl as string | null),
        createdAt: new Date(existing.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: 'UPDATE diary_notes SET title = ?, content = ?, analysis = ?, imageUrl = ?, updatedAt = ? WHERE id = ?',
        args: [updated.title, updated.content, updated.analysis, updated.imageUrl, updated.updatedAt.toISOString(), where.id],
      });

      // Support both legacy friendIds and new friendTags with sharing
      if (data.friendTags) {
        await client.execute({
          sql: 'DELETE FROM diary_note_tags WHERE noteId = ?',
          args: [where.id],
        });

        if (data.friendTags.length > 0) {
          const insertValues = data.friendTags.map(() => '(?, ?, ?, ?)').join(', ');
          await client.execute({
            sql: `INSERT INTO diary_note_tags (noteId, friendId, sharedWithFriend, createdAt) VALUES ${insertValues}`,
            args: data.friendTags.flatMap((tag) => [where.id, tag.friendId, tag.sharedWithFriend ? 1 : 0, now.toISOString()]),
          });
        }
      } else if (data.friendIds) {
        await client.execute({
          sql: 'DELETE FROM diary_note_tags WHERE noteId = ?',
          args: [where.id],
        });

        if (data.friendIds.length > 0) {
          const insertValues = data.friendIds.map(() => '(?, ?, ?, ?)').join(', ');
          await client.execute({
            sql: `INSERT INTO diary_note_tags (noteId, friendId, sharedWithFriend, createdAt) VALUES ${insertValues}`,
            args: data.friendIds.flatMap((friendId) => [where.id, friendId, 0, now.toISOString()]),
          });
        }
      }

      return prisma.diaryNote.findMany({ userId: where.userId }).then((notes) =>
        notes.find((note) => note.id === where.id) || {
          ...updated,
          friends: [],
        }
      );
    },
    // Update sharing status for a specific friend tag
    updateTagSharing: async ({ where, sharedWithFriend }: { where: { noteId: string; friendId: string; userId: string }; sharedWithFriend: boolean }) => {
      await ensureTablesExist();
      const client = getClient();

      // Verify the note belongs to this user
      const noteResult = await client.execute({
        sql: 'SELECT * FROM diary_notes WHERE id = ? AND userId = ?',
        args: [where.noteId, where.userId],
      });

      if (noteResult.rows.length === 0) {
        throw new Error('Note not found');
      }

      await client.execute({
        sql: 'UPDATE diary_note_tags SET sharedWithFriend = ? WHERE noteId = ? AND friendId = ?',
        args: [sharedWithFriend ? 1 : 0, where.noteId, where.friendId],
      });

      return { success: true };
    },
    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM diary_notes WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error('Note not found');
      }

      await client.execute({
        sql: 'DELETE FROM diary_note_tags WHERE noteId = ?',
        args: [where.id],
      });

      await client.execute({
        sql: 'DELETE FROM diary_notes WHERE id = ?',
        args: [where.id],
      });

      return { success: true };
    },
    // Amika friend diary note operations
    findManyByAmikaFriend: async (args: { userId: string; amikaFriendUserId: string }) => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT dn.*, dnat.sharedWithAmikaFriend
              FROM diary_notes dn
              JOIN diary_note_amika_tags dnat ON dn.id = dnat.noteId
              WHERE dn.userId = ? AND dnat.amikaFriendUserId = ?
              ORDER BY dn.createdAt DESC`,
        args: [args.userId, args.amikaFriendUserId],
      });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string | null,
        content: row.content as string,
        analysis: row.analysis as string | null,
        imageUrl: row.imageUrl as string | null,
        sharedWithAmikaFriend: Boolean(row.sharedWithAmikaFriend),
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));
    },
    createForAmikaFriend: async ({ data }: { data: { userId: string; amikaFriendUserId: string; title?: string | null; content: string; analysis?: string | null; imageUrl?: string | null; sharedWithAmikaFriend?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      // Verify the users are connected
      const isConnected = await prisma.userConnection.areConnected(data.userId, data.amikaFriendUserId);
      if (!isConnected) {
        throw new Error("Not connected with this Amika friend");
      }

      const now = new Date();
      const note = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title ?? null,
        content: data.content,
        analysis: data.analysis ?? null,
        imageUrl: data.imageUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO diary_notes (id, userId, title, content, analysis, imageUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          note.id,
          note.userId,
          note.title,
          note.content,
          note.analysis,
          note.imageUrl,
          note.createdAt.toISOString(),
          note.updatedAt.toISOString(),
        ],
      });

      // Add Amika friend tag
      await client.execute({
        sql: 'INSERT INTO diary_note_amika_tags (noteId, amikaFriendUserId, sharedWithAmikaFriend, createdAt) VALUES (?, ?, ?, ?)',
        args: [note.id, data.amikaFriendUserId, data.sharedWithAmikaFriend ? 1 : 0, now.toISOString()],
      });

      return {
        ...note,
        amikaFriendUserId: data.amikaFriendUserId,
        sharedWithAmikaFriend: data.sharedWithAmikaFriend ?? false,
      };
    },
    updateAmikaFriendSharing: async ({ where, sharedWithAmikaFriend }: { where: { noteId: string; amikaFriendUserId: string; userId: string }; sharedWithAmikaFriend: boolean }) => {
      await ensureTablesExist();
      const client = getClient();

      // Verify the note belongs to this user
      const noteResult = await client.execute({
        sql: 'SELECT * FROM diary_notes WHERE id = ? AND userId = ?',
        args: [where.noteId, where.userId],
      });

      if (noteResult.rows.length === 0) {
        throw new Error('Note not found');
      }

      await client.execute({
        sql: 'UPDATE diary_note_amika_tags SET sharedWithAmikaFriend = ? WHERE noteId = ? AND amikaFriendUserId = ?',
        args: [sharedWithAmikaFriend ? 1 : 0, where.noteId, where.amikaFriendUserId],
      });

      return { success: true };
    },
  },
  event: {
    findMany: async (args?: { userId?: string; where?: { friendId?: string }; includeFriends?: boolean }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM events';
      let sqlArgs: any[] = [];
      let conditions: string[] = [];

      if (args?.userId) {
        conditions.push('userId = ?');
        sqlArgs.push(args.userId);
      }

      // If filtering by friendId, check both the primary friendId and event_friends junction table
      if (args?.where?.friendId) {
        sql = `SELECT DISTINCT e.* FROM events e
               LEFT JOIN event_friends ef ON e.id = ef.eventId
               WHERE (e.friendId = ? OR ef.friendId = ?)`;
        sqlArgs = [args.where.friendId, args.where.friendId];
        if (args?.userId) {
          sql += ' AND e.userId = ?';
          sqlArgs.push(args.userId);
        }
        sql += ' ORDER BY e.eventDate ASC';
      } else {
        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY eventDate ASC';
      }

      const result = await client.execute({ sql, args: sqlArgs });

      // Fetch all event_friends and friends for including friend names
      const eventIds = result.rows.map((row: any) => row.id as string);
      let eventFriendsMap = new Map<string, { id: string; name: string }[]>();

      if (eventIds.length > 0) {
        // Get all event_friends entries
        const efResult = await client.execute({
          sql: 'SELECT * FROM event_friends WHERE eventId IN (' + eventIds.map(() => '?').join(',') + ')',
          args: eventIds,
        });

        // Get all friend IDs needed
        const allFriendIds = new Set<string>();
        result.rows.forEach((row: any) => allFriendIds.add(row.friendId as string));
        efResult.rows.forEach((row: any) => allFriendIds.add(row.friendId as string));

        if (allFriendIds.size > 0) {
          const friendIdsArray = Array.from(allFriendIds);
          const friendsResult = await client.execute({
            sql: 'SELECT id, name FROM friends WHERE id IN (' + friendIdsArray.map(() => '?').join(',') + ')',
            args: friendIdsArray,
          });

          const friendMap = new Map<string, { id: string; name: string }>();
          friendsResult.rows.forEach((row: any) => {
            friendMap.set(row.id as string, { id: row.id as string, name: row.name as string });
          });

          // Build event -> friends mapping
          result.rows.forEach((row: any) => {
            const eventId = row.id as string;
            const primaryFriendId = row.friendId as string;
            const friends: { id: string; name: string }[] = [];

            // Add primary friend first
            const primaryFriend = friendMap.get(primaryFriendId);
            if (primaryFriend) {
              friends.push(primaryFriend);
            }

            // Add additional friends from junction table
            efResult.rows.forEach((efRow: any) => {
              if (efRow.eventId === eventId && efRow.friendId !== primaryFriendId) {
                const friend = friendMap.get(efRow.friendId as string);
                if (friend) {
                  friends.push(friend);
                }
              }
            });

            eventFriendsMap.set(eventId, friends);
          });
        }
      }

      return result.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        eventDate: new Date(row.eventDate as string),
        location: row.location as string | null,
        category: row.category as string | null,
        friendId: row.friendId as string,
        sharedWithFriend: Boolean(row.sharedWithFriend),
        completed: Boolean(row.completed),
        createdAt: new Date(row.createdAt as string),
        friends: eventFriendsMap.get(row.id as string) || [],
      }));
    },
    create: async ({ data }: { data: { userId: string; title: string; description?: string | null; eventDate: Date; location?: string | null; category?: string | null; friendId: string; friendIds?: string[]; completed?: boolean; sharedWithFriend?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      const event: Event = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        eventDate: data.eventDate,
        location: data.location ?? null,
        category: data.category ?? null,
        friendId: data.friendId,
        sharedWithFriend: data.sharedWithFriend ?? false,
        completed: data.completed ?? false,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO events (id, userId, title, description, eventDate, location, category, friendId, sharedWithFriend, completed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          event.id,
          event.userId,
          event.title,
          event.description,
          event.eventDate.toISOString(),
          event.location,
          event.category,
          event.friendId,
          event.sharedWithFriend ? 1 : 0,
          event.completed ? 1 : 0,
          event.createdAt.toISOString(),
        ],
      });

      // Add additional friends to junction table (excluding the primary friendId)
      const additionalFriendIds = data.friendIds?.filter(id => id !== data.friendId) || [];
      if (additionalFriendIds.length > 0) {
        const now = new Date().toISOString();
        const insertValues = additionalFriendIds.map(() => '(?, ?, ?)').join(', ');
        await client.execute({
          sql: `INSERT INTO event_friends (eventId, friendId, createdAt) VALUES ${insertValues}`,
          args: additionalFriendIds.flatMap((friendId) => [event.id, friendId, now]),
        });
      }

      return event;
    },
    update: async ({ where, data }: { where: { id: string; userId?: string }; data: Partial<Event> & { friendIds?: string[] } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM events WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const existing = existingResult.rows[0];
      const updated: Event = {
        id: existing.id as string,
        userId: existing.userId as string,
        title: (data.title ?? existing.title) as string,
        description: (data.description !== undefined ? data.description : existing.description) as string | null,
        eventDate: data.eventDate ?? new Date(existing.eventDate as string),
        location: (data.location !== undefined ? data.location : existing.location) as string | null,
        category: (data.category !== undefined ? data.category : existing.category) as string | null,
        friendId: (data.friendId ?? existing.friendId) as string | null,
        sharedWithFriend: data.sharedWithFriend !== undefined ? data.sharedWithFriend : Boolean(existing.sharedWithFriend),
        completed: data.completed !== undefined ? data.completed : Boolean(existing.completed),
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE events SET title = ?, description = ?, eventDate = ?, location = ?, category = ?, friendId = ?, sharedWithFriend = ?, completed = ? WHERE id = ?',
        args: [
          updated.title,
          updated.description,
          updated.eventDate.toISOString(),
          updated.location,
          updated.category,
          updated.friendId,
          updated.sharedWithFriend ? 1 : 0,
          updated.completed ? 1 : 0,
          where.id,
        ],
      });

      // Update junction table if friendIds provided
      if (data.friendIds) {
        // Delete all existing entries
        await client.execute({
          sql: 'DELETE FROM event_friends WHERE eventId = ?',
          args: [where.id],
        });

        // Add additional friends (excluding the primary friendId)
        const additionalFriendIds = data.friendIds.filter(id => id !== updated.friendId);
        if (additionalFriendIds.length > 0) {
          const now = new Date().toISOString();
          const insertValues = additionalFriendIds.map(() => '(?, ?, ?)').join(', ');
          await client.execute({
            sql: `INSERT INTO event_friends (eventId, friendId, createdAt) VALUES ${insertValues}`,
            args: additionalFriendIds.flatMap((friendId) => [where.id, friendId, now]),
          });
        }
      }

      return updated;
    },
    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM events WHERE id = ?';
      let sqlArgs: any[] = [where.id];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      const existingResult = await client.execute({ sql, args: sqlArgs });

      if (existingResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      // Delete from junction table first
      await client.execute({
        sql: 'DELETE FROM event_friends WHERE eventId = ?',
        args: [where.id],
      });

      await client.execute({
        sql: 'DELETE FROM events WHERE id = ?',
        args: [where.id],
      });

      return { success: true };
    },
    // Amika friend event operations
    findManyByAmikaFriend: async (args: { userId: string; amikaFriendUserId: string }) => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM events WHERE userId = ? AND amikaFriendUserId = ? ORDER BY eventDate ASC',
        args: [args.userId, args.amikaFriendUserId],
      });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        eventDate: new Date(row.eventDate as string),
        location: row.location as string | null,
        category: row.category as string | null,
        amikaFriendUserId: row.amikaFriendUserId as string,
        sharedWithAmikaFriend: Boolean(row.sharedWithAmikaFriend),
        completed: Boolean(row.completed),
        createdAt: new Date(row.createdAt as string),
      }));
    },
    createForAmikaFriend: async ({ data }: { data: { userId: string; amikaFriendUserId: string; title: string; description?: string | null; eventDate: Date; location?: string | null; category?: string | null; sharedWithAmikaFriend?: boolean; completed?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      // Verify the users are connected
      const isConnected = await prisma.userConnection.areConnected(data.userId, data.amikaFriendUserId);
      if (!isConnected) {
        throw new Error("Not connected with this Amika friend");
      }

      const event = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        eventDate: data.eventDate,
        location: data.location ?? null,
        category: data.category ?? null,
        friendId: null,
        amikaFriendUserId: data.amikaFriendUserId,
        sharedWithAmikaFriend: data.sharedWithAmikaFriend ?? false,
        completed: data.completed ?? false,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO events (id, userId, title, description, eventDate, location, category, friendId, amikaFriendUserId, sharedWithAmikaFriend, completed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          event.id,
          event.userId,
          event.title,
          event.description,
          event.eventDate.toISOString(),
          event.location,
          event.category,
          event.friendId,
          event.amikaFriendUserId,
          event.sharedWithAmikaFriend ? 1 : 0,
          event.completed ? 1 : 0,
          event.createdAt.toISOString(),
        ],
      });

      return event;
    },
    updateForAmikaFriend: async ({ where, data }: { where: { id: string; userId: string }; data: { title?: string; description?: string | null; eventDate?: Date; location?: string | null; category?: string | null; sharedWithAmikaFriend?: boolean; completed?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      const existingResult = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ? AND userId = ? AND amikaFriendUserId IS NOT NULL',
        args: [where.id, where.userId],
      });

      if (existingResult.rows.length === 0) {
        throw new Error('Event not found');
      }

      const existing = existingResult.rows[0];
      const updated = {
        id: existing.id as string,
        userId: existing.userId as string,
        title: data.title ?? existing.title as string,
        description: data.description !== undefined ? data.description : existing.description as string | null,
        eventDate: data.eventDate ?? new Date(existing.eventDate as string),
        location: data.location !== undefined ? data.location : existing.location as string | null,
        category: data.category !== undefined ? data.category : existing.category as string | null,
        amikaFriendUserId: existing.amikaFriendUserId as string,
        sharedWithAmikaFriend: data.sharedWithAmikaFriend !== undefined ? data.sharedWithAmikaFriend : Boolean(existing.sharedWithAmikaFriend),
        completed: data.completed !== undefined ? data.completed : Boolean(existing.completed),
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE events SET title = ?, description = ?, eventDate = ?, location = ?, category = ?, sharedWithAmikaFriend = ?, completed = ? WHERE id = ?',
        args: [
          updated.title,
          updated.description,
          updated.eventDate.toISOString(),
          updated.location,
          updated.category,
          updated.sharedWithAmikaFriend ? 1 : 0,
          updated.completed ? 1 : 0,
          where.id,
        ],
      });

      return updated;
    },

    // Share token operations for events
    generateShareToken: async (id: string, userId: string): Promise<string | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can generate share link
      const existing = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return null;

      // Generate a unique share token
      const shareToken = randomUUID().replace(/-/g, '').substring(0, 16);

      await client.execute({
        sql: 'UPDATE events SET shareToken = ? WHERE id = ?',
        args: [shareToken, id],
      });

      return shareToken;
    },

    revokeShareToken: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can revoke share link
      const existing = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'UPDATE events SET shareToken = NULL WHERE id = ?',
        args: [id],
      });

      return true;
    },

    findByShareToken: async (shareToken: string): Promise<{
      id: string;
      title: string;
      description: string | null;
      eventDate: Date;
      location: string | null;
      category: string | null;
      ownerName: string;
      friendName: string;
    } | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT e.*, u.name as ownerName, f.name as friendName
              FROM events e
              JOIN users u ON e.userId = u.id
              LEFT JOIN friends f ON e.friendId = f.id
              WHERE e.shareToken = ?`,
        args: [shareToken],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string | null,
        eventDate: new Date(row.eventDate as string),
        location: row.location as string | null,
        category: row.category as string | null,
        ownerName: row.ownerName as string,
        friendName: row.friendName as string || 'Someone',
      };
    },

    // Join token operations for events
    generateJoinToken: async (id: string, userId: string): Promise<string | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can generate join link
      const existing = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return null;

      // Generate a unique join token
      const joinToken = randomUUID().replace(/-/g, '').substring(0, 16);

      await client.execute({
        sql: 'UPDATE events SET joinToken = ? WHERE id = ?',
        args: [joinToken, id],
      });

      return joinToken;
    },

    revokeJoinToken: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can revoke join link
      const existing = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'UPDATE events SET joinToken = NULL WHERE id = ?',
        args: [id],
      });

      return true;
    },

    findByJoinToken: async (joinToken: string): Promise<{
      id: string;
      title: string;
      description: string | null;
      eventDate: Date;
      location: string | null;
      category: string | null;
      ownerName: string;
      ownerId: string;
    } | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT e.id, e.title, e.description, e.eventDate, e.location, e.category, e.userId, u.name as ownerName
              FROM events e
              JOIN users u ON e.userId = u.id
              WHERE e.joinToken = ?`,
        args: [joinToken],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string | null,
        eventDate: new Date(row.eventDate as string),
        location: row.location as string | null,
        category: row.category as string | null,
        ownerName: row.ownerName as string,
        ownerId: row.userId as string,
      };
    },

    joinEventByToken: async (joinToken: string, userId: string, userName: string): Promise<{ eventId: string } | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Find the event by join token
      const eventResult = await client.execute({
        sql: 'SELECT id, userId, title, friendId FROM events WHERE joinToken = ?',
        args: [joinToken],
      });

      if (eventResult.rows.length === 0) return null;

      const eventId = eventResult.rows[0].id as string;
      const eventOwnerId = eventResult.rows[0].userId as string;
      const eventTitle = eventResult.rows[0].title as string;
      const eventFriendId = eventResult.rows[0].friendId as string;

      // Check if user is the owner
      if (eventOwnerId === userId) {
        return { eventId };
      }

      // Check if user already has a friend entry for the event owner with linkedUserId = userId
      const existingFriend = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [eventOwnerId, userId],
      });

      let friendId: string;

      if (existingFriend.rows.length > 0) {
        friendId = existingFriend.rows[0].id as string;
      } else {
        // Create a new friend entry for the event owner
        friendId = randomUUID();
        const now = new Date().toISOString();
        await client.execute({
          sql: `INSERT INTO friends (id, userId, name, linkedUserId, createdAt)
                VALUES (?, ?, ?, ?, ?)`,
          args: [friendId, eventOwnerId, userName, userId, now],
        });
      }

      // Check if already in event_friends junction table
      const existingEventFriend = await client.execute({
        sql: 'SELECT * FROM event_friends WHERE eventId = ? AND friendId = ?',
        args: [eventId, friendId],
      });

      if (existingEventFriend.rows.length === 0) {
        // Add user to event_friends junction table
        await client.execute({
          sql: 'INSERT INTO event_friends (eventId, friendId, createdAt) VALUES (?, ?, ?)',
          args: [eventId, friendId, new Date().toISOString()],
        });
      }

      // Also create a reverse friend entry so the joining user has the event owner as their friend
      const reverseCheck = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [userId, eventOwnerId],
      });

      if (reverseCheck.rows.length === 0) {
        // Get the owner's name
        const ownerResult = await client.execute({
          sql: 'SELECT name FROM users WHERE id = ?',
          args: [eventOwnerId],
        });

        if (ownerResult.rows.length > 0) {
          const ownerName = ownerResult.rows[0].name as string;
          const reverseFriendId = randomUUID();
          const now = new Date().toISOString();
          await client.execute({
            sql: `INSERT INTO friends (id, userId, name, linkedUserId, createdAt)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [reverseFriendId, userId, ownerName, eventOwnerId, now],
          });
        }
      }

      // Create a copy of the event for the joining user
      const originalEvent = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ?',
        args: [eventId],
      });

      if (originalEvent.rows.length > 0) {
        const orig = originalEvent.rows[0];

        // Find the friend ID for the joining user's perspective (should be the event owner as their friend)
        const joinerFriendResult = await client.execute({
          sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
          args: [userId, eventOwnerId],
        });

        if (joinerFriendResult.rows.length > 0) {
          const joinerFriendId = joinerFriendResult.rows[0].id as string;

          // Check if a similar event already exists for the joining user
          const existingJoinerEvent = await client.execute({
            sql: 'SELECT id FROM events WHERE userId = ? AND title = ? AND eventDate = ?',
            args: [userId, orig.title as string, orig.eventDate as string],
          });

          if (existingJoinerEvent.rows.length === 0) {
            const newEventId = randomUUID();
            const now = new Date().toISOString();
            await client.execute({
              sql: `INSERT INTO events (id, userId, title, description, eventDate, location, category, friendId, sharedWithFriend, completed, createdAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                newEventId,
                userId,
                orig.title as string,
                orig.description as string | null,
                orig.eventDate as string,
                orig.location as string | null,
                orig.category as string | null,
                joinerFriendId,
                1, // sharedWithFriend = true
                orig.completed ? 1 : 0,
                now,
              ],
            });
          }
        }
      }

      return { eventId };
    },

    // Find event by id with owner info and tokens
    findByIdWithDetails: async (id: string, userId: string): Promise<{
      id: string;
      userId: string;
      title: string;
      description: string | null;
      eventDate: Date;
      location: string | null;
      category: string | null;
      friendId: string;
      shareToken: string | null;
      joinToken: string | null;
      completed: boolean;
      sharedWithFriend: boolean;
      createdAt: Date;
      isOwner: boolean;
    } | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM events WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const eventUserId = row.userId as string;

      return {
        id: row.id as string,
        userId: eventUserId,
        title: row.title as string,
        description: row.description as string | null,
        eventDate: new Date(row.eventDate as string),
        location: row.location as string | null,
        category: row.category as string | null,
        friendId: row.friendId as string,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        completed: Boolean(row.completed),
        sharedWithFriend: Boolean(row.sharedWithFriend),
        createdAt: new Date(row.createdAt as string),
        isOwner: eventUserId === userId,
      };
    },
  },
  chatTranscript: {
    findMany: async (args?: { userId?: string; where?: { sessionId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM chat_transcripts';
      let sqlArgs: any[] = [];
      let conditions: string[] = [];

      if (args?.userId) {
        conditions.push('userId = ?');
        sqlArgs.push(args.userId);
      }

      if (args?.where?.sessionId) {
        conditions.push('sessionId = ?');
        sqlArgs.push(args.where.sessionId);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY createdAt ASC';

      const result = await client.execute({ sql, args: sqlArgs });
      return result.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        sessionId: row.sessionId as string,
        role: row.role as string,
        content: row.content as string,
        createdAt: new Date(row.createdAt as string),
      }));
    },
    create: async ({ data }: { data: { userId: string; sessionId: string; role: string; content: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      const transcript: ChatTranscript = {
        id: randomUUID(),
        userId: data.userId,
        sessionId: data.sessionId,
        role: data.role,
        content: data.content,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO chat_transcripts (id, userId, sessionId, role, content, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [
          transcript.id,
          transcript.userId,
          transcript.sessionId,
          transcript.role,
          transcript.content,
          transcript.createdAt.toISOString(),
        ],
      });

      return transcript;
    },
    delete: async ({ where }: { where: { sessionId: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'DELETE FROM chat_transcripts WHERE sessionId = ?';
      let sqlArgs: any[] = [where.sessionId];
      if (where.userId) {
        sql += ' AND userId = ?';
        sqlArgs.push(where.userId);
      }

      await client.execute({ sql, args: sqlArgs });

      return { success: true };
    },
  },

  // Utility to get user stats
  getUserStats: async (userId: string) => {
    await ensureTablesExist();
    const client = getClient();

    const friendsCount = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM friends WHERE userId = ?',
      args: [userId],
    });

    const memoriesCount = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM memories WHERE userId = ?',
      args: [userId],
    });

    const diaryCount = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM diary_notes WHERE userId = ?',
      args: [userId],
    });

    const eventsCount = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM events WHERE userId = ?',
      args: [userId],
    });

    return {
      friendsCount: Number(friendsCount.rows[0]?.count || 0),
      memoriesCount: Number(memoriesCount.rows[0]?.count || 0),
      diaryCount: Number(diaryCount.rows[0]?.count || 0),
      eventsCount: Number(eventsCount.rows[0]?.count || 0),
    };
  },

  // Get stats for a specific friend
  getFriendStats: async (userId: string, friendId: string) => {
    await ensureTablesExist();
    const client = getClient();

    // Count events where this friend is primary or in event_friends
    const eventsResult = await client.execute({
      sql: `SELECT COUNT(DISTINCT e.id) as count FROM events e
            LEFT JOIN event_friends ef ON e.id = ef.eventId
            WHERE e.userId = ? AND (e.friendId = ? OR ef.friendId = ?)`,
      args: [userId, friendId, friendId],
    });

    // Count memories for this friend
    const memoriesResult = await client.execute({
      sql: 'SELECT COUNT(*) as count FROM memories WHERE userId = ? AND friendId = ?',
      args: [userId, friendId],
    });

    // Count diary entries tagged with this friend
    const diaryResult = await client.execute({
      sql: `SELECT COUNT(DISTINCT dn.id) as count FROM diary_notes dn
            JOIN diary_note_tags dnt ON dn.id = dnt.noteId
            WHERE dn.userId = ? AND dnt.friendId = ?`,
      args: [userId, friendId],
    });

    // Get last contact date for this friend
    const friendResult = await client.execute({
      sql: 'SELECT lastContact FROM friends WHERE id = ? AND userId = ?',
      args: [friendId, userId],
    });

    const lastContact = friendResult.rows[0]?.lastContact
      ? new Date(friendResult.rows[0].lastContact as string)
      : null;

    // Calculate days since last contact
    let daysSinceLastContact: number | null = null;
    if (lastContact) {
      const now = new Date();
      const diffTime = now.getTime() - lastContact.getTime();
      daysSinceLastContact = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      eventsCount: Number(eventsResult.rows[0]?.count || 0),
      memoriesCount: Number(memoriesResult.rows[0]?.count || 0),
      diaryCount: Number(diaryResult.rows[0]?.count || 0),
      lastContact,
      daysSinceLastContact,
    };
  },

  // Migration helper to associate existing data with a user
  migrateDataToUser: async (userId: string) => {
    await ensureTablesExist();
    const client = getClient();

    // Update all records without a userId to belong to this user
    await client.execute({
      sql: 'UPDATE friends SET userId = ? WHERE userId IS NULL',
      args: [userId],
    });

    await client.execute({
      sql: 'UPDATE memories SET userId = ? WHERE userId IS NULL',
      args: [userId],
    });

    await client.execute({
      sql: 'UPDATE diary_notes SET userId = ? WHERE userId IS NULL',
      args: [userId],
    });

    await client.execute({
      sql: 'UPDATE events SET userId = ? WHERE userId IS NULL',
      args: [userId],
    });

    await client.execute({
      sql: 'UPDATE chat_transcripts SET userId = ? WHERE userId IS NULL',
      args: [userId],
    });

    return { success: true };
  },

  // User connections (friend requests between Amika users)
  userConnection: {
    // Send a friend request
    create: async (data: { requesterId: string; addresseeId: string }): Promise<UserConnection> => {
      await ensureTablesExist();
      const client = getClient();

      // Check if connection already exists in either direction
      const existing = await client.execute({
        sql: `SELECT * FROM user_connections
              WHERE (requesterId = ? AND addresseeId = ?)
              OR (requesterId = ? AND addresseeId = ?)`,
        args: [data.requesterId, data.addresseeId, data.addresseeId, data.requesterId],
      });

      if (existing.rows.length > 0) {
        throw new Error('Connection already exists');
      }

      // Cannot send request to yourself
      if (data.requesterId === data.addresseeId) {
        throw new Error('Cannot send friend request to yourself');
      }

      const connection: UserConnection = {
        id: randomUUID(),
        requesterId: data.requesterId,
        addresseeId: data.addresseeId,
        status: 'pending',
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO user_connections (id, requesterId, addresseeId, status, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [connection.id, connection.requesterId, connection.addresseeId, connection.status, connection.createdAt.toISOString()],
      });

      return connection;
    },

    // Find connections for a user (both sent and received)
    findMany: async (args: { userId: string; status?: string; type?: 'sent' | 'received' | 'all' }): Promise<(UserConnection & { user: { id: string; name: string; email: string; profileImage: string | null } })[]> => {
      await ensureTablesExist();
      const client = getClient();

      let sql: string;
      let sqlArgs: any[];

      if (args.type === 'sent') {
        sql = 'SELECT * FROM user_connections WHERE requesterId = ?';
        sqlArgs = [args.userId];
      } else if (args.type === 'received') {
        sql = 'SELECT * FROM user_connections WHERE addresseeId = ?';
        sqlArgs = [args.userId];
      } else {
        sql = 'SELECT * FROM user_connections WHERE requesterId = ? OR addresseeId = ?';
        sqlArgs = [args.userId, args.userId];
      }

      if (args.status) {
        sql += ' AND status = ?';
        sqlArgs.push(args.status);
      }

      sql += ' ORDER BY createdAt DESC';

      const result = await client.execute({ sql, args: sqlArgs });

      // Fetch user info for connections
      const userIds = new Set<string>();
      result.rows.forEach((row: any) => {
        if (row.requesterId !== args.userId) userIds.add(row.requesterId as string);
        if (row.addresseeId !== args.userId) userIds.add(row.addresseeId as string);
      });

      const userMap = new Map<string, { id: string; name: string; email: string; profileImage: string | null }>();

      if (userIds.size > 0) {
        const usersResult = await client.execute({
          sql: `SELECT id, name, email, profileImage FROM users WHERE id IN (${Array.from(userIds).map(() => '?').join(',')})`,
          args: Array.from(userIds),
        });
        usersResult.rows.forEach((row: any) => {
          userMap.set(row.id as string, {
            id: row.id as string,
            name: row.name as string,
            email: row.email as string,
            profileImage: row.profileImage as string | null,
          });
        });
      }

      return result.rows.map((row: any) => {
        const otherUserId = row.requesterId === args.userId ? row.addresseeId : row.requesterId;
        return {
          id: row.id as string,
          requesterId: row.requesterId as string,
          addresseeId: row.addresseeId as string,
          status: row.status as 'pending' | 'accepted' | 'rejected',
          createdAt: new Date(row.createdAt as string),
          user: userMap.get(otherUserId as string) || { id: otherUserId as string, name: 'Unknown', email: '', profileImage: null },
        };
      });
    },

    // Find accepted connections (actual friends)
    findAcceptedConnections: async (userId: string): Promise<{ id: string; name: string; email: string; profileImage: string | null; birthday: Date | null }[]> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT u.id, u.name, u.email, u.profileImage, u.birthday
              FROM users u
              INNER JOIN user_connections uc ON (
                (uc.requesterId = ? AND uc.addresseeId = u.id) OR
                (uc.addresseeId = ? AND uc.requesterId = u.id)
              )
              WHERE uc.status = 'accepted'`,
        args: [userId, userId],
      });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        name: row.name as string,
        email: row.email as string,
        profileImage: row.profileImage as string | null,
        birthday: row.birthday ? new Date(row.birthday as string) : null,
      }));
    },

    // Update connection status
    update: async (args: { id: string; userId: string; status: 'accepted' | 'rejected' }): Promise<UserConnection> => {
      await ensureTablesExist();
      const client = getClient();

      // Only the addressee can accept/reject
      const existing = await client.execute({
        sql: 'SELECT * FROM user_connections WHERE id = ? AND addresseeId = ?',
        args: [args.id, args.userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Connection not found or unauthorized');
      }

      await client.execute({
        sql: 'UPDATE user_connections SET status = ? WHERE id = ?',
        args: [args.status, args.id],
      });

      const row = existing.rows[0];
      const requesterId = row.requesterId as string;
      const addresseeId = row.addresseeId as string;

      // When connection is accepted, create Friend records for both users
      if (args.status === 'accepted') {
        // Get user details for both users
        const requesterResult = await client.execute({
          sql: 'SELECT id, name, email, profileImage, birthday FROM users WHERE id = ?',
          args: [requesterId],
        });
        const addresseeResult = await client.execute({
          sql: 'SELECT id, name, email, profileImage, birthday FROM users WHERE id = ?',
          args: [addresseeId],
        });

        const requester = requesterResult.rows[0];
        const addressee = addresseeResult.rows[0];

        // Check if friend records already exist
        const existingFriendForRequester = await client.execute({
          sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
          args: [requesterId, addresseeId],
        });
        const existingFriendForAddressee = await client.execute({
          sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
          args: [addresseeId, requesterId],
        });

        // Create friend record for requester (the addressee becomes their friend)
        if (existingFriendForRequester.rows.length === 0 && addressee) {
          await prisma.friend.create({
            data: {
              userId: requesterId,
              name: addressee.name as string,
              birthday: addressee.birthday ? new Date(addressee.birthday as string) : null,
              profileImage: addressee.profileImage as string | null,
              linkedUserId: addresseeId,
            },
          });
        }

        // Create friend record for addressee (the requester becomes their friend)
        if (existingFriendForAddressee.rows.length === 0 && requester) {
          await prisma.friend.create({
            data: {
              userId: addresseeId,
              name: requester.name as string,
              birthday: requester.birthday ? new Date(requester.birthday as string) : null,
              profileImage: requester.profileImage as string | null,
              linkedUserId: requesterId,
            },
          });
        }
      }

      return {
        id: row.id as string,
        requesterId: requesterId,
        addresseeId: addresseeId,
        status: args.status,
        createdAt: new Date(row.createdAt as string),
      };
    },

    // Delete a connection
    delete: async (args: { id: string; userId: string }): Promise<{ success: boolean }> => {
      await ensureTablesExist();
      const client = getClient();

      // Either user can delete the connection
      const existing = await client.execute({
        sql: 'SELECT * FROM user_connections WHERE id = ? AND (requesterId = ? OR addresseeId = ?)',
        args: [args.id, args.userId, args.userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Connection not found');
      }

      await client.execute({
        sql: 'DELETE FROM user_connections WHERE id = ?',
        args: [args.id],
      });

      return { success: true };
    },

    // Check if two users are connected
    areConnected: async (userId1: string, userId2: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT * FROM user_connections
              WHERE status = 'accepted' AND (
                (requesterId = ? AND addresseeId = ?) OR
                (requesterId = ? AND addresseeId = ?)
              )`,
        args: [userId1, userId2, userId2, userId1],
      });

      return result.rows.length > 0;
    },

    // Delete connection between two users (unfriend)
    deleteConnection: async (userId1: string, userId2: string): Promise<{ success: boolean }> => {
      await ensureTablesExist();
      const client = getClient();

      await client.execute({
        sql: `DELETE FROM user_connections
              WHERE (requesterId = ? AND addresseeId = ?)
              OR (requesterId = ? AND addresseeId = ?)`,
        args: [userId1, userId2, userId2, userId1],
      });

      return { success: true };
    },
  },

  // Shared items between users
  sharedItem: {
    // Share an item with a connected user
    create: async (data: { sharedByUserId: string; sharedWithUserId: string; itemType: 'memory' | 'note' | 'event' | 'trip'; itemId: string; message?: string; skipConnectionCheck?: boolean }): Promise<SharedItem> => {
      await ensureTablesExist();
      const client = getClient();

      // Check if users are connected (skip for trip invites as they have their own access control)
      if (!data.skipConnectionCheck) {
        const connected = await prisma.userConnection.areConnected(data.sharedByUserId, data.sharedWithUserId);
        if (!connected) {
          throw new Error('You can only share with connected friends');
        }
      }

      // Check if already shared
      const existing = await client.execute({
        sql: 'SELECT * FROM shared_items WHERE sharedByUserId = ? AND sharedWithUserId = ? AND itemType = ? AND itemId = ?',
        args: [data.sharedByUserId, data.sharedWithUserId, data.itemType, data.itemId],
      });

      if (existing.rows.length > 0) {
        // For trips, just skip silently instead of erroring
        if (data.itemType === 'trip') {
          return {
            id: existing.rows[0].id as string,
            sharedByUserId: existing.rows[0].sharedByUserId as string,
            sharedWithUserId: existing.rows[0].sharedWithUserId as string,
            itemType: existing.rows[0].itemType as 'memory' | 'note' | 'event' | 'trip',
            itemId: existing.rows[0].itemId as string,
            status: existing.rows[0].status as 'pending' | 'accepted' | 'rejected',
            message: existing.rows[0].message as string | null,
            createdAt: new Date(existing.rows[0].createdAt as string),
          };
        }
        throw new Error('Item already shared with this user');
      }

      const sharedItem: SharedItem = {
        id: randomUUID(),
        sharedByUserId: data.sharedByUserId,
        sharedWithUserId: data.sharedWithUserId,
        itemType: data.itemType,
        itemId: data.itemId,
        status: 'pending',
        message: data.message || null,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO shared_items (id, sharedByUserId, sharedWithUserId, itemType, itemId, status, message, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [sharedItem.id, sharedItem.sharedByUserId, sharedItem.sharedWithUserId, sharedItem.itemType, sharedItem.itemId, sharedItem.status, sharedItem.message, sharedItem.createdAt.toISOString()],
      });

      return sharedItem;
    },

    // Find shared items for a user
    findMany: async (args: { userId: string; type?: 'sent' | 'received'; status?: string; itemType?: string }): Promise<(SharedItem & { sharedBy: { id: string; name: string; email: string; profileImage: string | null }; sharedWith: { id: string; name: string; email: string; profileImage: string | null }; item?: any })[]> => {
      await ensureTablesExist();
      const client = getClient();

      let sql: string;
      let sqlArgs: any[];

      if (args.type === 'sent') {
        sql = 'SELECT * FROM shared_items WHERE sharedByUserId = ?';
        sqlArgs = [args.userId];
      } else if (args.type === 'received') {
        sql = 'SELECT * FROM shared_items WHERE sharedWithUserId = ?';
        sqlArgs = [args.userId];
      } else {
        sql = 'SELECT * FROM shared_items WHERE sharedByUserId = ? OR sharedWithUserId = ?';
        sqlArgs = [args.userId, args.userId];
      }

      if (args.status) {
        sql += ' AND status = ?';
        sqlArgs.push(args.status);
      }

      if (args.itemType) {
        sql += ' AND itemType = ?';
        sqlArgs.push(args.itemType);
      }

      sql += ' ORDER BY createdAt DESC';

      const result = await client.execute({ sql, args: sqlArgs });

      // Fetch user info
      const userIds = new Set<string>();
      result.rows.forEach((row: any) => {
        userIds.add(row.sharedByUserId as string);
        userIds.add(row.sharedWithUserId as string);
      });

      const userMap = new Map<string, { id: string; name: string; email: string; profileImage: string | null }>();

      if (userIds.size > 0) {
        const usersResult = await client.execute({
          sql: `SELECT id, name, email, profileImage FROM users WHERE id IN (${Array.from(userIds).map(() => '?').join(',')})`,
          args: Array.from(userIds),
        });
        usersResult.rows.forEach((row: any) => {
          userMap.set(row.id as string, {
            id: row.id as string,
            name: row.name as string,
            email: row.email as string,
            profileImage: row.profileImage as string | null,
          });
        });
      }

      // Fetch item details for each shared item
      const items = await Promise.all(result.rows.map(async (row: any) => {
        const itemType = row.itemType as string;
        const itemId = row.itemId as string;
        let item: any = null;

        if (itemType === 'memory') {
          const memResult = await client.execute({
            sql: 'SELECT * FROM memories WHERE id = ?',
            args: [itemId],
          });
          if (memResult.rows.length > 0) {
            const memRow = memResult.rows[0];
            item = {
              id: memRow.id as string,
              content: memRow.content as string,
              imageUrl: memRow.imageUrl as string | null,
              createdAt: new Date(memRow.createdAt as string),
            };
          }
        } else if (itemType === 'note') {
          const noteResult = await client.execute({
            sql: 'SELECT * FROM diary_notes WHERE id = ?',
            args: [itemId],
          });
          if (noteResult.rows.length > 0) {
            const noteRow = noteResult.rows[0];
            item = {
              id: noteRow.id as string,
              title: noteRow.title as string | null,
              content: noteRow.content as string,
              imageUrl: noteRow.imageUrl as string | null,
              createdAt: new Date(noteRow.createdAt as string),
            };
          }
        } else if (itemType === 'event') {
          const eventResult = await client.execute({
            sql: 'SELECT * FROM events WHERE id = ?',
            args: [itemId],
          });
          if (eventResult.rows.length > 0) {
            const eventRow = eventResult.rows[0];
            item = {
              id: eventRow.id as string,
              title: eventRow.title as string,
              description: eventRow.description as string | null,
              eventDate: new Date(eventRow.eventDate as string),
              location: eventRow.location as string | null,
              category: eventRow.category as string | null,
            };
          }
        } else if (itemType === 'trip') {
          const tripResult = await client.execute({
            sql: 'SELECT * FROM trip_sessions WHERE id = ?',
            args: [itemId],
          });
          if (tripResult.rows.length > 0) {
            const tripRow = tripResult.rows[0];
            item = {
              id: tripRow.id as string,
              title: tripRow.title as string,
              description: tripRow.description as string | null,
              location: tripRow.location as string | null,
              startDate: tripRow.startDate ? new Date(tripRow.startDate as string) : null,
              endDate: tripRow.endDate ? new Date(tripRow.endDate as string) : null,
              status: tripRow.status as string,
            };
          }
        }

        const sharedBy = userMap.get(row.sharedByUserId as string) || { id: row.sharedByUserId as string, name: 'Unknown', email: '', profileImage: null };
        const sharedWith = userMap.get(row.sharedWithUserId as string) || { id: row.sharedWithUserId as string, name: 'Unknown', email: '', profileImage: null };

        return {
          id: row.id as string,
          sharedByUserId: row.sharedByUserId as string,
          sharedWithUserId: row.sharedWithUserId as string,
          itemType: row.itemType as 'memory' | 'note' | 'event' | 'trip',
          itemId: row.itemId as string,
          status: row.status as 'pending' | 'accepted' | 'rejected',
          message: row.message as string | null,
          createdAt: new Date(row.createdAt as string),
          sharedBy,
          sharedWith,
          item,
        };
      }));

      return items;
    },

    // Update shared item status (accept/reject)
    update: async (args: { id: string; userId: string; status: 'accepted' | 'rejected' }): Promise<SharedItem> => {
      await ensureTablesExist();
      const client = getClient();

      // Only the recipient can accept/reject
      const existing = await client.execute({
        sql: 'SELECT * FROM shared_items WHERE id = ? AND sharedWithUserId = ?',
        args: [args.id, args.userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Shared item not found or unauthorized');
      }

      await client.execute({
        sql: 'UPDATE shared_items SET status = ? WHERE id = ?',
        args: [args.status, args.id],
      });

      const row = existing.rows[0];
      return {
        id: row.id as string,
        sharedByUserId: row.sharedByUserId as string,
        sharedWithUserId: row.sharedWithUserId as string,
        itemType: row.itemType as 'memory' | 'note' | 'event',
        itemId: row.itemId as string,
        status: args.status,
        message: row.message as string | null,
        createdAt: new Date(row.createdAt as string),
      };
    },

    // Delete a shared item
    delete: async (args: { id: string; userId: string }): Promise<{ success: boolean }> => {
      await ensureTablesExist();
      const client = getClient();

      // Either sharer or recipient can delete
      const existing = await client.execute({
        sql: 'SELECT * FROM shared_items WHERE id = ? AND (sharedByUserId = ? OR sharedWithUserId = ?)',
        args: [args.id, args.userId, args.userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Shared item not found');
      }

      await client.execute({
        sql: 'DELETE FROM shared_items WHERE id = ?',
        args: [args.id],
      });

      return { success: true };
    },

    // Get pending count for a user
    getPendingCount: async (userId: string): Promise<{ connectionRequests: number; sharedItems: number; chatNotifications: number }> => {
      await ensureTablesExist();
      const client = getClient();

      const connectionsResult = await client.execute({
        sql: `SELECT COUNT(*) as count FROM user_connections WHERE addresseeId = ? AND status = 'pending'`,
        args: [userId],
      });

      const sharedResult = await client.execute({
        sql: `SELECT COUNT(*) as count FROM shared_items WHERE sharedWithUserId = ? AND status = 'pending'`,
        args: [userId],
      });

      const chatResult = await client.execute({
        sql: `SELECT COUNT(*) as count FROM chat_notifications WHERE recipientUserId = ? AND isRead = 0`,
        args: [userId],
      });

      return {
        connectionRequests: Number(connectionsResult.rows[0]?.count || 0),
        sharedItems: Number(sharedResult.rows[0]?.count || 0),
        chatNotifications: Number(chatResult.rows[0]?.count || 0),
      };
    },
  },

  // Search users by email or name
  searchUsers: async (query: string, excludeUserId: string): Promise<{ id: string; name: string; email: string; profileImage: string | null }[]> => {
    await ensureTablesExist();
    const client = getClient();

    const result = await client.execute({
      sql: `SELECT id, name, email, profileImage FROM users
            WHERE id != ? AND (LOWER(email) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?))
            LIMIT 10`,
      args: [excludeUserId, `%${query}%`, `%${query}%`],
    });

    return result.rows.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      profileImage: row.profileImage as string | null,
    }));
  },

  // Friend invites for invite links
  friendInvite: {
    create: async (data: { inviterId: string; inviteeName?: string; inviteeEmail?: string }): Promise<FriendInvite> => {
      await ensureTablesExist();
      const client = getClient();

      // Generate unique invite code
      const inviteCode = crypto.randomBytes(16).toString('hex');

      const invite: FriendInvite = {
        id: randomUUID(),
        inviterId: data.inviterId,
        inviteCode,
        inviteeName: data.inviteeName ?? null,
        inviteeEmail: data.inviteeEmail ?? null,
        status: 'pending',
        acceptedByUserId: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO friend_invites (id, inviterId, inviteCode, inviteeName, inviteeEmail, status, acceptedByUserId, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          invite.id,
          invite.inviterId,
          invite.inviteCode,
          invite.inviteeName,
          invite.inviteeEmail,
          invite.status,
          invite.acceptedByUserId,
          invite.expiresAt.toISOString(),
          invite.createdAt.toISOString(),
        ],
      });

      return invite;
    },

    findByCode: async (inviteCode: string): Promise<(FriendInvite & { inviter: { id: string; name: string; profileImage: string | null } }) | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT fi.*, u.name as inviterName, u.profileImage as inviterProfileImage
              FROM friend_invites fi
              JOIN users u ON fi.inviterId = u.id
              WHERE fi.inviteCode = ?`,
        args: [inviteCode],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        inviterId: row.inviterId as string,
        inviteCode: row.inviteCode as string,
        inviteeName: row.inviteeName as string | null,
        inviteeEmail: row.inviteeEmail as string | null,
        status: row.status as 'pending' | 'accepted' | 'expired',
        acceptedByUserId: row.acceptedByUserId as string | null,
        expiresAt: new Date(row.expiresAt as string),
        createdAt: new Date(row.createdAt as string),
        inviter: {
          id: row.inviterId as string,
          name: row.inviterName as string,
          profileImage: row.inviterProfileImage as string | null,
        },
      };
    },

    findMany: async (inviterId: string): Promise<FriendInvite[]> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM friend_invites WHERE inviterId = ? ORDER BY createdAt DESC',
        args: [inviterId],
      });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        inviterId: row.inviterId as string,
        inviteCode: row.inviteCode as string,
        inviteeName: row.inviteeName as string | null,
        inviteeEmail: row.inviteeEmail as string | null,
        status: row.status as 'pending' | 'accepted' | 'expired',
        acceptedByUserId: row.acceptedByUserId as string | null,
        expiresAt: new Date(row.expiresAt as string),
        createdAt: new Date(row.createdAt as string),
      }));
    },

    accept: async (inviteCode: string, acceptedByUserId: string): Promise<FriendInvite> => {
      await ensureTablesExist();
      const client = getClient();

      // Find the invite
      const existing = await client.execute({
        sql: 'SELECT * FROM friend_invites WHERE inviteCode = ?',
        args: [inviteCode],
      });

      if (existing.rows.length === 0) {
        throw new Error('Invite not found');
      }

      const row = existing.rows[0];

      // Check if expired
      if (new Date(row.expiresAt as string) < new Date()) {
        throw new Error('Invite has expired');
      }

      // Check if already accepted
      if (row.status === 'accepted') {
        throw new Error('Invite has already been accepted');
      }

      // Check not accepting own invite
      if (row.inviterId === acceptedByUserId) {
        throw new Error('Cannot accept your own invite');
      }

      // Update the invite
      await client.execute({
        sql: 'UPDATE friend_invites SET status = ?, acceptedByUserId = ? WHERE inviteCode = ?',
        args: ['accepted', acceptedByUserId, inviteCode],
      });

      const inviterId = row.inviterId as string;

      // Get user details for both users
      const inviterResult = await client.execute({
        sql: 'SELECT id, name, email, profileImage, birthday FROM users WHERE id = ?',
        args: [inviterId],
      });
      const accepterResult = await client.execute({
        sql: 'SELECT id, name, email, profileImage, birthday FROM users WHERE id = ?',
        args: [acceptedByUserId],
      });

      const inviter = inviterResult.rows[0];
      const accepter = accepterResult.rows[0];

      // Check if friend records already exist
      const existingFriendForInviter = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [inviterId, acceptedByUserId],
      });
      const existingFriendForAccepter = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [acceptedByUserId, inviterId],
      });

      // Create friend record for inviter
      if (existingFriendForInviter.rows.length === 0 && accepter) {
        await prisma.friend.create({
          data: {
            userId: inviterId,
            name: accepter.name as string,
            birthday: accepter.birthday ? new Date(accepter.birthday as string) : null,
            profileImage: accepter.profileImage as string | null,
            linkedUserId: acceptedByUserId,
          },
        });
      }

      // Create friend record for accepter
      if (existingFriendForAccepter.rows.length === 0 && inviter) {
        await prisma.friend.create({
          data: {
            userId: acceptedByUserId,
            name: inviter.name as string,
            birthday: inviter.birthday ? new Date(inviter.birthday as string) : null,
            profileImage: inviter.profileImage as string | null,
            linkedUserId: inviterId,
          },
        });
      }

      // Also create a user_connection record if one doesn't exist
      const existingConnection = await client.execute({
        sql: `SELECT * FROM user_connections
              WHERE (requesterId = ? AND addresseeId = ?)
              OR (requesterId = ? AND addresseeId = ?)`,
        args: [inviterId, acceptedByUserId, acceptedByUserId, inviterId],
      });

      if (existingConnection.rows.length === 0) {
        await client.execute({
          sql: 'INSERT INTO user_connections (id, requesterId, addresseeId, status, createdAt) VALUES (?, ?, ?, ?, ?)',
          args: [randomUUID(), inviterId, acceptedByUserId, 'accepted', new Date().toISOString()],
        });
      }

      return {
        id: row.id as string,
        inviterId: row.inviterId as string,
        inviteCode: row.inviteCode as string,
        inviteeName: row.inviteeName as string | null,
        inviteeEmail: row.inviteeEmail as string | null,
        status: 'accepted',
        acceptedByUserId,
        expiresAt: new Date(row.expiresAt as string),
        createdAt: new Date(row.createdAt as string),
      };
    },

    delete: async (id: string, inviterId: string): Promise<{ success: boolean }> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: 'SELECT * FROM friend_invites WHERE id = ? AND inviterId = ?',
        args: [id, inviterId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Invite not found');
      }

      await client.execute({
        sql: 'DELETE FROM friend_invites WHERE id = ?',
        args: [id],
      });

      return { success: true };
    },
  },

  // Wishlist operations
  wishlist: {
    findByUserId: async (userId: string): Promise<WishlistItem[]> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM wishlist_items WHERE userId = ? ORDER BY priority DESC, createdAt DESC',
        args: [userId],
      });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        link: row.link as string | null,
        price: row.price as string | null,
        category: row.category as string | null,
        priority: Number(row.priority) || 0,
        imageUrl: row.imageUrl as string | null,
        purchased: Boolean(row.purchased),
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));
    },

    findById: async (id: string): Promise<WishlistItem | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM wishlist_items WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        link: row.link as string | null,
        price: row.price as string | null,
        category: row.category as string | null,
        priority: Number(row.priority) || 0,
        imageUrl: row.imageUrl as string | null,
        purchased: Boolean(row.purchased),
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    create: async (data: {
      userId: string;
      title: string;
      description?: string | null;
      link?: string | null;
      price?: string | null;
      category?: string | null;
      priority?: number;
      imageUrl?: string | null;
    }): Promise<WishlistItem> => {
      await ensureTablesExist();
      const client = getClient();

      const now = new Date();
      const item: WishlistItem = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        description: data.description ?? null,
        link: data.link ?? null,
        price: data.price ?? null,
        category: data.category ?? null,
        priority: data.priority ?? 0,
        imageUrl: data.imageUrl ?? null,
        purchased: false,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO wishlist_items (id, userId, title, description, link, price, category, priority, imageUrl, purchased, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          item.id,
          item.userId,
          item.title,
          item.description,
          item.link,
          item.price,
          item.category,
          item.priority,
          item.imageUrl,
          item.purchased ? 1 : 0,
          item.createdAt.toISOString(),
          item.updatedAt.toISOString(),
        ],
      });

      return item;
    },

    update: async (id: string, userId: string, data: {
      title?: string;
      description?: string | null;
      link?: string | null;
      price?: string | null;
      category?: string | null;
      priority?: number;
      imageUrl?: string | null;
      purchased?: boolean;
    }): Promise<WishlistItem | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await prisma.wishlist.findById(id);
      if (!existing || existing.userId !== userId) return null;

      const updated: WishlistItem = {
        ...existing,
        title: data.title ?? existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        link: data.link !== undefined ? data.link : existing.link,
        price: data.price !== undefined ? data.price : existing.price,
        category: data.category !== undefined ? data.category : existing.category,
        priority: data.priority !== undefined ? data.priority : existing.priority,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
        purchased: data.purchased !== undefined ? data.purchased : existing.purchased,
        updatedAt: new Date(),
      };

      await client.execute({
        sql: 'UPDATE wishlist_items SET title = ?, description = ?, link = ?, price = ?, category = ?, priority = ?, imageUrl = ?, purchased = ?, updatedAt = ? WHERE id = ?',
        args: [
          updated.title,
          updated.description,
          updated.link,
          updated.price,
          updated.category,
          updated.priority,
          updated.imageUrl,
          updated.purchased ? 1 : 0,
          updated.updatedAt.toISOString(),
          id,
        ],
      });

      return updated;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await prisma.wishlist.findById(id);
      if (!existing || existing.userId !== userId) return false;

      await client.execute({
        sql: 'DELETE FROM wishlist_items WHERE id = ?',
        args: [id],
      });

      return true;
    },

    getPublicWishlist: async (userId: string): Promise<{ items: WishlistItem[]; user: { id: string; name: string; profileImage: string | null } | null }> => {
      await ensureTablesExist();
      const client = getClient();

      const userResult = await client.execute({
        sql: 'SELECT id, name, profileImage FROM users WHERE id = ?',
        args: [userId],
      });

      if (userResult.rows.length === 0) {
        return { items: [], user: null };
      }

      const user = {
        id: userResult.rows[0].id as string,
        name: userResult.rows[0].name as string,
        profileImage: userResult.rows[0].profileImage as string | null,
      };

      const items = await prisma.wishlist.findByUserId(userId);
      // Only return non-purchased items for public view
      const publicItems = items.filter(item => !item.purchased);

      return { items: publicItems, user };
    },
  },

  // Google Account operations for Calendar integration
  googleAccount: {
    findByUserId: async (userId: string): Promise<GoogleAccount | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'SELECT * FROM google_accounts WHERE userId = ?',
        args: [userId],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        userId: row.userId as string,
        googleEmail: row.googleEmail as string,
        accessToken: row.accessToken as string,
        refreshToken: row.refreshToken as string,
        tokenExpiry: new Date(row.tokenExpiry as string),
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      };
    },

    create: async (data: {
      userId: string;
      googleEmail: string;
      accessToken: string;
      refreshToken: string;
      tokenExpiry: Date;
    }): Promise<GoogleAccount> => {
      await ensureTablesExist();
      const client = getClient();

      const now = new Date();
      const account: GoogleAccount = {
        id: randomUUID(),
        userId: data.userId,
        googleEmail: data.googleEmail,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiry: data.tokenExpiry,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO google_accounts (id, userId, googleEmail, accessToken, refreshToken, tokenExpiry, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          account.id,
          account.userId,
          account.googleEmail,
          account.accessToken,
          account.refreshToken,
          account.tokenExpiry.toISOString(),
          account.createdAt.toISOString(),
          account.updatedAt.toISOString(),
        ],
      });

      return account;
    },

    update: async (userId: string, data: {
      googleEmail?: string;
      accessToken?: string;
      refreshToken?: string;
      tokenExpiry?: Date;
    }): Promise<GoogleAccount | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await prisma.googleAccount.findByUserId(userId);
      if (!existing) return null;

      const updated: GoogleAccount = {
        ...existing,
        googleEmail: data.googleEmail ?? existing.googleEmail,
        accessToken: data.accessToken ?? existing.accessToken,
        refreshToken: data.refreshToken ?? existing.refreshToken,
        tokenExpiry: data.tokenExpiry ?? existing.tokenExpiry,
        updatedAt: new Date(),
      };

      await client.execute({
        sql: 'UPDATE google_accounts SET googleEmail = ?, accessToken = ?, refreshToken = ?, tokenExpiry = ?, updatedAt = ? WHERE userId = ?',
        args: [
          updated.googleEmail,
          updated.accessToken,
          updated.refreshToken,
          updated.tokenExpiry.toISOString(),
          updated.updatedAt.toISOString(),
          userId,
        ],
      });

      return updated;
    },

    upsert: async (data: {
      userId: string;
      googleEmail: string;
      accessToken: string;
      refreshToken: string;
      tokenExpiry: Date;
    }): Promise<GoogleAccount> => {
      const existing = await prisma.googleAccount.findByUserId(data.userId);
      if (existing) {
        const updated = await prisma.googleAccount.update(data.userId, data);
        return updated!;
      }
      return prisma.googleAccount.create(data);
    },

    delete: async (userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await prisma.googleAccount.findByUserId(userId);
      if (!existing) return false;

      await client.execute({
        sql: 'DELETE FROM google_accounts WHERE userId = ?',
        args: [userId],
      });

      return true;
    },
  },

  // Trip Session Operations
  tripSession: {
    findMany: async (userId: string): Promise<(TripSession & { collaborators: any[] })[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Find trips where user is owner or collaborator (via linked friend)
      const result = await client.execute({
        sql: `SELECT DISTINCT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.userId = ? OR tc.userId = ?
              ORDER BY ts.updatedAt DESC`,
        args: [userId, userId],
      });

      const trips: (TripSession & { collaborators: any[] })[] = [];
      for (const row of result.rows) {
        const colResult = await client.execute({
          sql: `SELECT tc.*, f.name as friendName, f.profileImage, f.customProfileImage, f.linkedUserId, f.interests
                FROM trip_collaborators tc
                JOIN friends f ON tc.friendId = f.id
                WHERE tc.tripId = ?`,
          args: [row.id as string],
        });

        trips.push({
          id: row.id as string,
          userId: row.userId as string,
          title: row.title as string,
          description: row.description as string | null,
          status: row.status as TripSession['status'],
          startDate: row.startDate ? new Date(row.startDate as string) : null,
          endDate: row.endDate ? new Date(row.endDate as string) : null,
          location: row.location as string | null,
          locationDetails: row.locationDetails as string | null,
          shareToken: row.shareToken as string | null,
          joinToken: row.joinToken as string | null,
          createdAt: new Date(row.createdAt as string),
          updatedAt: new Date(row.updatedAt as string),
          collaborators: colResult.rows.map((c: any) => ({
            id: c.id,
            tripId: c.tripId,
            friendId: c.friendId,
            userId: c.userId,
            role: c.role,
            joinedAt: new Date(c.joinedAt as string),
            friendName: c.friendName,
            profileImage: c.customProfileImage || c.profileImage,
            linkedUserId: c.linkedUserId,
            interests: c.interests,
          })),
        });
      }

      return trips;
    },

    findById: async (id: string, userId: string): Promise<(TripSession & {
      ownerName: string | null;
      ownerProfileImage: string | null;
      collaborators: any[];
      dailyPlans: any[];
      tickets: any[];
      polls: any[];
      goalProgress: any[];
    }) | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify user has access and get owner info
      const accessCheck = await client.execute({
        sql: `SELECT ts.*, u.name as ownerName, u.profileImage as ownerProfileImage FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              LEFT JOIN users u ON ts.userId = u.id
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (accessCheck.rows.length === 0) return null;

      const row = accessCheck.rows[0];

      // Get collaborators
      const colResult = await client.execute({
        sql: `SELECT tc.*, f.name as friendName, f.profileImage, f.customProfileImage, f.linkedUserId, f.interests
              FROM trip_collaborators tc
              JOIN friends f ON tc.friendId = f.id
              WHERE tc.tripId = ?`,
        args: [id],
      });

      // Get daily plans with events
      const plansResult = await client.execute({
        sql: 'SELECT * FROM trip_daily_plans WHERE tripId = ? ORDER BY dayNumber ASC',
        args: [id],
      });

      const dailyPlans: any[] = [];
      for (const plan of plansResult.rows) {
        const eventsResult = await client.execute({
          sql: 'SELECT * FROM trip_events WHERE dailyPlanId = ? ORDER BY "order" ASC',
          args: [plan.id as string],
        });
        dailyPlans.push({
          id: plan.id,
          tripId: plan.tripId,
          dayNumber: plan.dayNumber,
          date: plan.date ? new Date(plan.date as string) : null,
          events: eventsResult.rows.map((e: any) => ({
            id: e.id,
            dailyPlanId: e.dailyPlanId,
            title: e.title,
            description: e.description,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
            category: e.category,
            externalUrl: e.externalUrl,
            estimatedCost: e.estimatedCost,
            notes: e.notes,
            order: e.order,
            createdById: e.createdById,
            createdAt: new Date(e.createdAt as string),
            updatedAt: new Date(e.updatedAt as string),
          })),
        });
      }

      // Get tickets
      const ticketsResult = await client.execute({
        sql: 'SELECT * FROM trip_tickets WHERE tripId = ? ORDER BY departureTime ASC',
        args: [id],
      });

      // Get polls with options and votes
      const pollsResult = await client.execute({
        sql: 'SELECT * FROM trip_polls WHERE tripId = ? ORDER BY createdAt DESC',
        args: [id],
      });

      const polls: any[] = [];
      for (const poll of pollsResult.rows) {
        const optionsResult = await client.execute({
          sql: 'SELECT * FROM trip_poll_options WHERE pollId = ? ORDER BY "order" ASC',
          args: [poll.id as string],
        });

        const optionsWithVotes: any[] = [];
        for (const opt of optionsResult.rows) {
          // Join with users table to get voter profile information
          const votesResult = await client.execute({
            sql: `SELECT v.*, u.name as voterName, u.profileImage as voterProfileImage
                  FROM trip_poll_votes v
                  LEFT JOIN users u ON v.visitorId = u.id
                  WHERE v.optionId = ?`,
            args: [opt.id as string],
          });
          optionsWithVotes.push({
            id: opt.id,
            pollId: opt.pollId,
            label: opt.label,
            url: opt.url,
            order: opt.order,
            votes: votesResult.rows.map((v: any) => ({
              id: v.id,
              optionId: v.optionId,
              visitorId: v.visitorId,
              friendId: v.friendId,
              votedAt: new Date(v.votedAt as string),
              voterName: v.voterName,
              voterProfileImage: v.voterProfileImage,
            })),
          });
        }

        polls.push({
          id: poll.id,
          tripId: poll.tripId,
          context: poll.context,
          question: poll.question,
          status: poll.status,
          createdById: poll.createdById,
          createdAt: new Date(poll.createdAt as string),
          closedAt: poll.closedAt ? new Date(poll.closedAt as string) : null,
          options: optionsWithVotes,
        });
      }

      // Get goal progress
      const goalsResult = await client.execute({
        sql: 'SELECT * FROM trip_goal_progress WHERE tripId = ?',
        args: [id],
      });

      return {
        id: row.id as string,
        userId: row.userId as string,
        ownerName: row.ownerName as string | null,
        ownerProfileImage: row.ownerProfileImage as string | null,
        title: row.title as string,
        description: row.description as string | null,
        status: row.status as TripSession['status'],
        startDate: row.startDate ? new Date(row.startDate as string) : null,
        endDate: row.endDate ? new Date(row.endDate as string) : null,
        location: row.location as string | null,
        locationDetails: row.locationDetails as string | null,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
        collaborators: colResult.rows.map((c: any) => ({
          id: c.id,
          tripId: c.tripId,
          friendId: c.friendId,
          userId: c.userId,
          role: c.role,
          joinedAt: new Date(c.joinedAt as string),
          friendName: c.friendName,
          profileImage: c.customProfileImage || c.profileImage,
          linkedUserId: c.linkedUserId,
          interests: c.interests,
        })),
        dailyPlans,
        tickets: ticketsResult.rows.map((t: any) => ({
          id: t.id,
          tripId: t.tripId,
          collaboratorId: t.collaboratorId,
          type: t.type,
          title: t.title,
          description: t.description,
          confirmationNum: t.confirmationNum,
          departureTime: t.departureTime ? new Date(t.departureTime as string) : null,
          arrivalTime: t.arrivalTime ? new Date(t.arrivalTime as string) : null,
          location: t.location,
          cost: t.cost,
          currency: t.currency,
          url: t.url,
          createdById: t.createdById,
          createdAt: new Date(t.createdAt as string),
          updatedAt: new Date(t.updatedAt as string),
        })),
        polls,
        goalProgress: goalsResult.rows.map((g: any) => ({
          id: g.id,
          tripId: g.tripId,
          goalType: g.goalType,
          status: g.status,
          completedAt: g.completedAt ? new Date(g.completedAt as string) : null,
        })),
      };
    },

    create: async (data: {
      userId: string;
      title: string;
      description?: string;
      collaboratorFriendIds?: string[];
    }): Promise<TripSession> => {
      await ensureTablesExist();
      const client = getClient();

      const now = new Date();
      const trip: TripSession = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        status: 'planning',
        startDate: null,
        endDate: null,
        location: null,
        locationDetails: null,
        shareToken: null,
        joinToken: null,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: `INSERT INTO trip_sessions (id, userId, title, description, status, startDate, endDate, location, locationDetails, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          trip.id,
          trip.userId,
          trip.title,
          trip.description,
          trip.status,
          trip.startDate?.toISOString() || null,
          trip.endDate?.toISOString() || null,
          trip.location,
          trip.locationDetails,
          trip.createdAt.toISOString(),
          trip.updatedAt.toISOString(),
        ],
      });

      // Create initial goal progress entries
      const goalTypes = ['dates', 'location', 'daily_events', 'tickets'];
      for (const goalType of goalTypes) {
        await client.execute({
          sql: 'INSERT INTO trip_goal_progress (id, tripId, goalType, status, completedAt) VALUES (?, ?, ?, ?, ?)',
          args: [randomUUID(), trip.id, goalType, 'pending', null],
        });
      }

      // Add collaborators if provided
      if (data.collaboratorFriendIds && data.collaboratorFriendIds.length > 0) {
        for (const friendId of data.collaboratorFriendIds) {
          // Get friend info to check for linkedUserId
          const friendResult = await client.execute({
            sql: 'SELECT linkedUserId FROM friends WHERE id = ?',
            args: [friendId],
          });
          const linkedUserId = friendResult.rows[0]?.linkedUserId as string | null;

          await client.execute({
            sql: 'INSERT INTO trip_collaborators (id, tripId, friendId, userId, role, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
            args: [randomUUID(), trip.id, friendId, linkedUserId, 'collaborator', now.toISOString()],
          });

          // Send notification to the collaborator if they have an account
          if (linkedUserId) {
            try {
              await prisma.sharedItem.create({
                sharedByUserId: data.userId,
                sharedWithUserId: linkedUserId,
                itemType: 'trip',
                itemId: trip.id,
                message: `You've been invited to collaborate on the trip "${data.title}"`,
                skipConnectionCheck: true,
              });
            } catch (notifError) {
              // Don't fail the trip creation if notification fails
              console.error('Failed to send trip notification:', notifError);
            }
          }
        }
      }

      return trip;
    },

    update: async (id: string, userId: string, data: {
      title?: string;
      description?: string;
      status?: TripSession['status'];
      startDate?: Date | null;
      endDate?: Date | null;
      location?: string | null;
      locationDetails?: string | null;
    }): Promise<TripSession | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Check ownership or collaboration
      const existing = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();

      const updated: TripSession = {
        id: row.id as string,
        userId: row.userId as string,
        title: data.title ?? row.title as string,
        description: data.description !== undefined ? data.description : row.description as string | null,
        status: data.status ?? row.status as TripSession['status'],
        startDate: data.startDate !== undefined ? data.startDate : (row.startDate ? new Date(row.startDate as string) : null),
        endDate: data.endDate !== undefined ? data.endDate : (row.endDate ? new Date(row.endDate as string) : null),
        location: data.location !== undefined ? data.location : row.location as string | null,
        locationDetails: data.locationDetails !== undefined ? data.locationDetails : row.locationDetails as string | null,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: `UPDATE trip_sessions SET title = ?, description = ?, status = ?, startDate = ?, endDate = ?, location = ?, locationDetails = ?, updatedAt = ?
              WHERE id = ?`,
        args: [
          updated.title,
          updated.description,
          updated.status,
          updated.startDate?.toISOString() || null,
          updated.endDate?.toISOString() || null,
          updated.location,
          updated.locationDetails,
          updated.updatedAt.toISOString(),
          id,
        ],
      });

      // Update goal progress based on changes
      if (data.startDate !== undefined || data.endDate !== undefined) {
        const hasValidDates = updated.startDate && updated.endDate;
        await client.execute({
          sql: `UPDATE trip_goal_progress SET status = ?, completedAt = ? WHERE tripId = ? AND goalType = 'dates'`,
          args: [hasValidDates ? 'completed' : 'pending', hasValidDates ? now.toISOString() : null, id],
        });
      }

      if (data.location !== undefined) {
        const hasLocation = !!updated.location;
        await client.execute({
          sql: `UPDATE trip_goal_progress SET status = ?, completedAt = ? WHERE tripId = ? AND goalType = 'location'`,
          args: [hasLocation ? 'completed' : 'pending', hasLocation ? now.toISOString() : null, id],
        });
      }

      return updated;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can delete
      const existing = await client.execute({
        sql: 'SELECT * FROM trip_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM trip_sessions WHERE id = ?',
        args: [id],
      });

      return true;
    },

    generateShareToken: async (id: string, userId: string): Promise<string | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can generate share link
      const existing = await client.execute({
        sql: 'SELECT * FROM trip_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return null;

      // Generate a unique share token
      const shareToken = randomUUID().replace(/-/g, '').substring(0, 16);

      await client.execute({
        sql: 'UPDATE trip_sessions SET shareToken = ?, updatedAt = ? WHERE id = ?',
        args: [shareToken, new Date().toISOString(), id],
      });

      return shareToken;
    },

    revokeShareToken: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can revoke share link
      const existing = await client.execute({
        sql: 'SELECT * FROM trip_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'UPDATE trip_sessions SET shareToken = NULL, updatedAt = ? WHERE id = ?',
        args: [new Date().toISOString(), id],
      });

      return true;
    },

    findByShareToken: async (shareToken: string): Promise<(TripSession & {
      collaborators: any[];
      dailyPlans: any[];
      tickets: any[];
      polls: any[];
      goalProgress: any[];
      ownerName: string;
    }) | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT ts.*, u.name as ownerName FROM trip_sessions ts
              JOIN users u ON ts.userId = u.id
              WHERE ts.shareToken = ?`,
        args: [shareToken],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const id = row.id as string;

      // Get collaborators
      const colResult = await client.execute({
        sql: `SELECT tc.*, f.name as friendName, f.profileImage, f.customProfileImage, f.linkedUserId, f.interests
              FROM trip_collaborators tc
              JOIN friends f ON tc.friendId = f.id
              WHERE tc.tripId = ?`,
        args: [id],
      });

      // Get daily plans with events
      const plansResult = await client.execute({
        sql: 'SELECT * FROM trip_daily_plans WHERE tripId = ? ORDER BY dayNumber ASC',
        args: [id],
      });

      const dailyPlans: any[] = [];
      for (const plan of plansResult.rows) {
        const eventsResult = await client.execute({
          sql: 'SELECT * FROM trip_events WHERE dailyPlanId = ? ORDER BY "order" ASC',
          args: [plan.id as string],
        });
        dailyPlans.push({
          id: plan.id,
          tripId: plan.tripId,
          dayNumber: plan.dayNumber,
          date: plan.date ? new Date(plan.date as string) : null,
          events: eventsResult.rows.map((e: any) => ({
            id: e.id,
            dailyPlanId: e.dailyPlanId,
            title: e.title,
            description: e.description,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
            category: e.category,
            externalUrl: e.externalUrl,
            estimatedCost: e.estimatedCost,
            notes: e.notes,
            order: e.order,
            createdById: e.createdById,
            createdAt: new Date(e.createdAt as string),
            updatedAt: new Date(e.updatedAt as string),
          })),
        });
      }

      // Get tickets
      const ticketsResult = await client.execute({
        sql: 'SELECT * FROM trip_tickets WHERE tripId = ? ORDER BY departureTime ASC',
        args: [id],
      });

      // Get polls with options and votes
      const pollsResult = await client.execute({
        sql: 'SELECT * FROM trip_polls WHERE tripId = ? ORDER BY createdAt DESC',
        args: [id],
      });

      const polls: any[] = [];
      for (const poll of pollsResult.rows) {
        const optionsResult = await client.execute({
          sql: 'SELECT * FROM trip_poll_options WHERE pollId = ? ORDER BY "order" ASC',
          args: [poll.id as string],
        });

        const optionsWithVotes: any[] = [];
        for (const opt of optionsResult.rows) {
          // Join with users table to get voter profile information
          const votesResult = await client.execute({
            sql: `SELECT v.*, u.name as voterName, u.profileImage as voterProfileImage
                  FROM trip_poll_votes v
                  LEFT JOIN users u ON v.visitorId = u.id
                  WHERE v.optionId = ?`,
            args: [opt.id as string],
          });
          optionsWithVotes.push({
            id: opt.id,
            pollId: opt.pollId,
            label: opt.label,
            url: opt.url,
            order: opt.order,
            votes: votesResult.rows.map((v: any) => ({
              id: v.id,
              optionId: v.optionId,
              visitorId: v.visitorId,
              friendId: v.friendId,
              votedAt: new Date(v.votedAt as string),
              voterName: v.voterName,
              voterProfileImage: v.voterProfileImage,
            })),
          });
        }

        polls.push({
          id: poll.id,
          tripId: poll.tripId,
          context: poll.context,
          question: poll.question,
          status: poll.status,
          createdById: poll.createdById,
          createdAt: new Date(poll.createdAt as string),
          closedAt: poll.closedAt ? new Date(poll.closedAt as string) : null,
          options: optionsWithVotes,
        });
      }

      // Get goal progress
      const goalsResult = await client.execute({
        sql: 'SELECT * FROM trip_goal_progress WHERE tripId = ?',
        args: [id],
      });

      return {
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        status: row.status as TripSession['status'],
        startDate: row.startDate ? new Date(row.startDate as string) : null,
        endDate: row.endDate ? new Date(row.endDate as string) : null,
        location: row.location as string | null,
        locationDetails: row.locationDetails as string | null,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
        ownerName: row.ownerName as string,
        collaborators: colResult.rows.map((c: any) => ({
          id: c.id,
          tripId: c.tripId,
          friendId: c.friendId,
          userId: c.userId,
          role: c.role,
          joinedAt: new Date(c.joinedAt as string),
          friendName: c.friendName,
          profileImage: c.customProfileImage || c.profileImage,
          linkedUserId: c.linkedUserId,
          interests: c.interests,
        })),
        dailyPlans,
        tickets: ticketsResult.rows.map((t: any) => ({
          id: t.id,
          tripId: t.tripId,
          collaboratorId: t.collaboratorId,
          type: t.type,
          title: t.title,
          description: t.description,
          confirmationNum: t.confirmationNum,
          departureTime: t.departureTime ? new Date(t.departureTime as string) : null,
          arrivalTime: t.arrivalTime ? new Date(t.arrivalTime as string) : null,
          location: t.location,
          cost: t.cost,
          currency: t.currency,
          url: t.url,
          createdById: t.createdById,
          createdAt: new Date(t.createdAt as string),
          updatedAt: new Date(t.updatedAt as string),
        })),
        polls,
        goalProgress: goalsResult.rows.map((g: any) => ({
          id: g.id,
          tripId: g.tripId,
          goalType: g.goalType,
          status: g.status,
          completedAt: g.completedAt ? new Date(g.completedAt as string) : null,
        })),
      };
    },

    generateJoinToken: async (id: string, userId: string): Promise<string | null> => {
      try {
        console.log('generateJoinToken called with tripId:', id, 'userId:', userId);
        await ensureTablesExist();
        console.log('ensureTablesExist completed');
        // Ensure joinToken column exists (separate migration)
        await ensureJoinTokenColumn();
        console.log('ensureJoinTokenColumn completed');
        const client = getClient();
        console.log('getClient completed');

        // Only owner can generate join link
        const existing = await client.execute({
          sql: 'SELECT * FROM trip_sessions WHERE id = ? AND userId = ?',
          args: [id, userId],
        });

        console.log('Trip query result:', existing.rows.length, 'rows');

        if (existing.rows.length === 0) {
          // Check if trip exists but user is not owner
          const tripExists = await client.execute({
            sql: 'SELECT userId FROM trip_sessions WHERE id = ?',
            args: [id],
          });
          if (tripExists.rows.length > 0) {
            console.log('Trip exists but user is not owner. Trip owner:', tripExists.rows[0]?.userId, 'Current user:', userId);
          } else {
            console.log('Trip does not exist with id:', id);
          }
          return null;
        }

        // Generate a unique join token
        const joinToken = randomUUID().replace(/-/g, '').substring(0, 16);
        console.log('Generated joinToken:', joinToken);

        await client.execute({
          sql: 'UPDATE trip_sessions SET joinToken = ?, updatedAt = ? WHERE id = ?',
          args: [joinToken, new Date().toISOString(), id],
        });

        console.log('Updated trip with joinToken successfully');
        return joinToken;
      } catch (error) {
        console.error('Error in generateJoinToken:', error);
        throw error;
      }
    },

    revokeJoinToken: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can revoke join link
      const existing = await client.execute({
        sql: 'SELECT * FROM trip_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'UPDATE trip_sessions SET joinToken = NULL, updatedAt = ? WHERE id = ?',
        args: [new Date().toISOString(), id],
      });

      return true;
    },

    findByJoinToken: async (joinToken: string): Promise<{
      id: string;
      title: string;
      description: string | null;
      ownerName: string;
      collaboratorCount: number;
    } | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT ts.id, ts.title, ts.description, u.name as ownerName
              FROM trip_sessions ts
              JOIN users u ON ts.userId = u.id
              WHERE ts.joinToken = ?`,
        args: [joinToken],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      // Get collaborator count
      const colResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM trip_collaborators WHERE tripId = ?',
        args: [row.id as string],
      });

      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string | null,
        ownerName: row.ownerName as string,
        collaboratorCount: Number(colResult.rows[0].count),
      };
    },

    joinTripByToken: async (joinToken: string, userId: string, userName: string): Promise<{ tripId: string } | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Find the trip by join token
      const tripResult = await client.execute({
        sql: 'SELECT id, userId FROM trip_sessions WHERE joinToken = ?',
        args: [joinToken],
      });

      if (tripResult.rows.length === 0) return null;

      const tripId = tripResult.rows[0].id as string;
      const tripOwnerId = tripResult.rows[0].userId as string;

      // Check if user is already a collaborator via their userId in trip_collaborators
      const existingCollab = await client.execute({
        sql: 'SELECT id FROM trip_collaborators WHERE tripId = ? AND userId = ?',
        args: [tripId, userId],
      });

      if (existingCollab.rows.length > 0) {
        // Already a collaborator, just return the trip ID
        return { tripId };
      }

      // Check if user is the owner
      if (tripOwnerId === userId) {
        return { tripId };
      }

      // Check if the user has a friend entry with the trip owner that's linked to this user
      const friendResult = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [tripOwnerId, userId],
      });

      let friendId: string;

      if (friendResult.rows.length > 0) {
        friendId = friendResult.rows[0].id as string;

        // Check if this friend is already a collaborator
        const existingFriendCollab = await client.execute({
          sql: 'SELECT id FROM trip_collaborators WHERE tripId = ? AND friendId = ?',
          args: [tripId, friendId],
        });

        if (existingFriendCollab.rows.length > 0) {
          // Update the collaborator to link the userId
          await client.execute({
            sql: 'UPDATE trip_collaborators SET userId = ? WHERE tripId = ? AND friendId = ?',
            args: [userId, tripId, friendId],
          });
          return { tripId };
        }
      } else {
        // Create a new friend entry for the trip owner
        friendId = randomUUID();
        const now = new Date().toISOString();
        await client.execute({
          sql: `INSERT INTO friends (id, userId, name, linkedUserId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [friendId, tripOwnerId, userName, userId, now, now],
        });
      }

      // Add as collaborator
      const collaboratorId = randomUUID();
      await client.execute({
        sql: `INSERT INTO trip_collaborators (id, tripId, friendId, userId, role, joinedAt)
              VALUES (?, ?, ?, ?, 'collaborator', ?)`,
        args: [collaboratorId, tripId, friendId, userId, new Date().toISOString()],
      });

      return { tripId };
    },
  },

  // Trip Collaborators
  tripCollaborator: {
    add: async (tripId: string, friendIds: string[], userId: string): Promise<TripCollaborator[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify user has access to trip and get trip details
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const tripOwnerId = accessCheck.rows[0].userId as string;
      const tripTitle = accessCheck.rows[0].title as string;
      const now = new Date();
      const added: TripCollaborator[] = [];

      for (const friendId of friendIds) {
        // Check if already a collaborator
        const existing = await client.execute({
          sql: 'SELECT id FROM trip_collaborators WHERE tripId = ? AND friendId = ?',
          args: [tripId, friendId],
        });

        if (existing.rows.length > 0) continue;

        // Get friend's linkedUserId
        const friendResult = await client.execute({
          sql: 'SELECT linkedUserId FROM friends WHERE id = ?',
          args: [friendId],
        });
        const linkedUserId = friendResult.rows[0]?.linkedUserId as string | null;

        const collaborator: TripCollaborator = {
          id: randomUUID(),
          tripId,
          friendId,
          userId: linkedUserId,
          role: 'collaborator',
          joinedAt: now,
        };

        await client.execute({
          sql: 'INSERT INTO trip_collaborators (id, tripId, friendId, userId, role, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
          args: [collaborator.id, tripId, friendId, linkedUserId, 'collaborator', now.toISOString()],
        });

        added.push(collaborator);

        // Send notification to the collaborator if they have an account
        if (linkedUserId) {
          try {
            await prisma.sharedItem.create({
              sharedByUserId: tripOwnerId,
              sharedWithUserId: linkedUserId,
              itemType: 'trip',
              itemId: tripId,
              message: `You've been invited to collaborate on the trip "${tripTitle}"`,
              skipConnectionCheck: true,
            });
          } catch (notifError) {
            // Don't fail the collaborator addition if notification fails
            console.error('Failed to send trip notification:', notifError);
          }
        }
      }

      return added;
    },

    remove: async (tripId: string, friendId: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify user has access to trip
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM trip_collaborators WHERE tripId = ? AND friendId = ?',
        args: [tripId, friendId],
      });

      return true;
    },

    ensureUserAccess: async (tripId: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Check if user already has access via trip_collaborators.userId
      const existingAccess = await client.execute({
        sql: 'SELECT id FROM trip_collaborators WHERE tripId = ? AND userId = ?',
        args: [tripId, userId],
      });

      if (existingAccess.rows.length > 0) {
        // User already has access
        return true;
      }

      // Check if user is the trip owner
      const tripOwner = await client.execute({
        sql: 'SELECT userId FROM trip_sessions WHERE id = ?',
        args: [tripId],
      });

      if (tripOwner.rows.length > 0 && tripOwner.rows[0].userId === userId) {
        // User is the owner, they already have access
        return true;
      }

      // Look for a collaborator record where the friend's linkedUserId matches this user
      // This handles the case where the collaborator was added but userId wasn't set
      const collaboratorWithLinkedUser = await client.execute({
        sql: `SELECT tc.id FROM trip_collaborators tc
              JOIN friends f ON tc.friendId = f.id
              WHERE tc.tripId = ? AND f.linkedUserId = ?`,
        args: [tripId, userId],
      });

      if (collaboratorWithLinkedUser.rows.length > 0) {
        // Update the collaborator record to set the userId
        await client.execute({
          sql: 'UPDATE trip_collaborators SET userId = ? WHERE id = ?',
          args: [userId, collaboratorWithLinkedUser.rows[0].id],
        });
        return true;
      }

      // As a fallback, check if this user has a friend record pointing to the trip owner
      // and add them as a collaborator
      const userFriends = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [userId, tripOwner.rows[0]?.userId],
      });

      if (userFriends.rows.length > 0 && tripOwner.rows.length > 0) {
        // The user has the trip owner as a friend, add them as collaborator
        const now = new Date();
        await client.execute({
          sql: 'INSERT INTO trip_collaborators (id, tripId, friendId, userId, role, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
          args: [randomUUID(), tripId, userFriends.rows[0].id, userId, 'collaborator', now.toISOString()],
        });
        return true;
      }

      return false;
    },
  },

  // Trip Daily Plans and Events
  tripDailyPlan: {
    create: async (tripId: string, dayNumber: number, date: Date | null, userId: string): Promise<TripDailyPlan> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const plan: TripDailyPlan = {
        id: randomUUID(),
        tripId,
        dayNumber,
        date,
      };

      await client.execute({
        sql: 'INSERT INTO trip_daily_plans (id, tripId, dayNumber, date) VALUES (?, ?, ?, ?)',
        args: [plan.id, tripId, dayNumber, date?.toISOString() || null],
      });

      return plan;
    },

    update: async (id: string, data: { date?: Date | null }, userId: string): Promise<TripDailyPlan | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT dp.* FROM trip_daily_plans dp
              JOIN trip_sessions ts ON dp.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE dp.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const updated: TripDailyPlan = {
        id: row.id as string,
        tripId: row.tripId as string,
        dayNumber: row.dayNumber as number,
        date: data.date !== undefined ? data.date : (row.date ? new Date(row.date as string) : null),
      };

      await client.execute({
        sql: 'UPDATE trip_daily_plans SET date = ? WHERE id = ?',
        args: [updated.date?.toISOString() || null, id],
      });

      return updated;
    },
  },

  tripEvent: {
    create: async (dailyPlanId: string, data: {
      title: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      location?: string;
      category?: string;
      externalUrl?: string;
      estimatedCost?: number;
      notes?: string;
    }, userId: string): Promise<TripEvent> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access through daily plan
      const accessCheck = await client.execute({
        sql: `SELECT dp.* FROM trip_daily_plans dp
              JOIN trip_sessions ts ON dp.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE dp.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [dailyPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Daily plan not found or access denied');
      }

      // Get max order
      const maxOrderResult = await client.execute({
        sql: 'SELECT MAX("order") as maxOrder FROM trip_events WHERE dailyPlanId = ?',
        args: [dailyPlanId],
      });
      const maxOrder = (maxOrderResult.rows[0]?.maxOrder as number) || 0;

      const now = new Date();
      const event: TripEvent = {
        id: randomUUID(),
        dailyPlanId,
        title: data.title,
        description: data.description || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        location: data.location || null,
        category: data.category || null,
        externalUrl: data.externalUrl || null,
        estimatedCost: data.estimatedCost || null,
        notes: data.notes || null,
        order: maxOrder + 1,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: `INSERT INTO trip_events (id, dailyPlanId, title, description, startTime, endTime, location, category, externalUrl, estimatedCost, notes, "order", createdById, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          event.id, dailyPlanId, event.title, event.description, event.startTime, event.endTime,
          event.location, event.category, event.externalUrl, event.estimatedCost, event.notes,
          event.order, userId, now.toISOString(), now.toISOString(),
        ],
      });

      // Update goal progress
      const tripId = accessCheck.rows[0].tripId as string;
      await client.execute({
        sql: `UPDATE trip_goal_progress SET status = 'in_progress' WHERE tripId = ? AND goalType = 'daily_events' AND status = 'pending'`,
        args: [tripId],
      });

      return event;
    },

    update: async (id: string, data: Partial<Omit<TripEvent, 'id' | 'dailyPlanId' | 'createdById' | 'createdAt'>>, userId: string): Promise<TripEvent | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT e.* FROM trip_events e
              JOIN trip_daily_plans dp ON e.dailyPlanId = dp.id
              JOIN trip_sessions ts ON dp.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE e.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();
      const updated: TripEvent = {
        id: row.id as string,
        dailyPlanId: row.dailyPlanId as string,
        title: data.title ?? row.title as string,
        description: data.description !== undefined ? data.description : row.description as string | null,
        startTime: data.startTime !== undefined ? data.startTime : row.startTime as string | null,
        endTime: data.endTime !== undefined ? data.endTime : row.endTime as string | null,
        location: data.location !== undefined ? data.location : row.location as string | null,
        category: data.category !== undefined ? data.category : row.category as string | null,
        externalUrl: data.externalUrl !== undefined ? data.externalUrl : row.externalUrl as string | null,
        estimatedCost: data.estimatedCost !== undefined ? data.estimatedCost : row.estimatedCost as number | null,
        notes: data.notes !== undefined ? data.notes : row.notes as string | null,
        order: data.order ?? row.order as number,
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: `UPDATE trip_events SET title = ?, description = ?, startTime = ?, endTime = ?, location = ?, category = ?, externalUrl = ?, estimatedCost = ?, notes = ?, "order" = ?, updatedAt = ?
              WHERE id = ?`,
        args: [
          updated.title, updated.description, updated.startTime, updated.endTime, updated.location,
          updated.category, updated.externalUrl, updated.estimatedCost, updated.notes, updated.order,
          now.toISOString(), id,
        ],
      });

      return updated;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT e.* FROM trip_events e
              JOIN trip_daily_plans dp ON e.dailyPlanId = dp.id
              JOIN trip_sessions ts ON dp.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE e.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM trip_events WHERE id = ?',
        args: [id],
      });

      return true;
    },
  },

  // Trip Tickets
  tripTicket: {
    create: async (tripId: string, data: {
      type: TripTicket['type'];
      title: string;
      description?: string;
      collaboratorId?: string;
      confirmationNum?: string;
      departureTime?: Date;
      arrivalTime?: Date;
      location?: string;
      cost?: number;
      currency?: string;
      url?: string;
    }, userId: string): Promise<TripTicket> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const now = new Date();
      const ticket: TripTicket = {
        id: randomUUID(),
        tripId,
        collaboratorId: data.collaboratorId || null,
        type: data.type,
        title: data.title,
        description: data.description || null,
        confirmationNum: data.confirmationNum || null,
        departureTime: data.departureTime || null,
        arrivalTime: data.arrivalTime || null,
        location: data.location || null,
        cost: data.cost || null,
        currency: data.currency || 'USD',
        url: data.url || null,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: `INSERT INTO trip_tickets (id, tripId, collaboratorId, type, title, description, confirmationNum, departureTime, arrivalTime, location, cost, currency, url, createdById, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          ticket.id, tripId, ticket.collaboratorId, ticket.type, ticket.title, ticket.description,
          ticket.confirmationNum, ticket.departureTime?.toISOString() || null, ticket.arrivalTime?.toISOString() || null,
          ticket.location, ticket.cost, ticket.currency, ticket.url, userId, now.toISOString(), now.toISOString(),
        ],
      });

      // Update goal progress
      await client.execute({
        sql: `UPDATE trip_goal_progress SET status = 'in_progress' WHERE tripId = ? AND goalType = 'tickets' AND status = 'pending'`,
        args: [tripId],
      });

      return ticket;
    },

    update: async (id: string, data: Partial<Omit<TripTicket, 'id' | 'tripId' | 'createdById' | 'createdAt'>>, userId: string): Promise<TripTicket | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT t.* FROM trip_tickets t
              JOIN trip_sessions ts ON t.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE t.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();
      const updated: TripTicket = {
        id: row.id as string,
        tripId: row.tripId as string,
        collaboratorId: data.collaboratorId !== undefined ? data.collaboratorId : row.collaboratorId as string | null,
        type: data.type ?? row.type as TripTicket['type'],
        title: data.title ?? row.title as string,
        description: data.description !== undefined ? data.description : row.description as string | null,
        confirmationNum: data.confirmationNum !== undefined ? data.confirmationNum : row.confirmationNum as string | null,
        departureTime: data.departureTime !== undefined ? data.departureTime : (row.departureTime ? new Date(row.departureTime as string) : null),
        arrivalTime: data.arrivalTime !== undefined ? data.arrivalTime : (row.arrivalTime ? new Date(row.arrivalTime as string) : null),
        location: data.location !== undefined ? data.location : row.location as string | null,
        cost: data.cost !== undefined ? data.cost : row.cost as number | null,
        currency: data.currency ?? row.currency as string,
        url: data.url !== undefined ? data.url : row.url as string | null,
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: `UPDATE trip_tickets SET collaboratorId = ?, type = ?, title = ?, description = ?, confirmationNum = ?, departureTime = ?, arrivalTime = ?, location = ?, cost = ?, currency = ?, url = ?, updatedAt = ?
              WHERE id = ?`,
        args: [
          updated.collaboratorId, updated.type, updated.title, updated.description, updated.confirmationNum,
          updated.departureTime?.toISOString() || null, updated.arrivalTime?.toISOString() || null,
          updated.location, updated.cost, updated.currency, updated.url, now.toISOString(), id,
        ],
      });

      return updated;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT t.* FROM trip_tickets t
              JOIN trip_sessions ts ON t.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE t.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM trip_tickets WHERE id = ?',
        args: [id],
      });

      return true;
    },
  },

  // Trip Messages
  tripMessage: {
    findMany: async (tripId: string, userId: string, options?: { context?: string; since?: Date }): Promise<TripMessage[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return [];

      let sql = 'SELECT * FROM trip_messages WHERE tripId = ?';
      const args: any[] = [tripId];

      if (options?.context) {
        sql += ' AND context = ?';
        args.push(options.context);
      }

      if (options?.since) {
        sql += ' AND createdAt > ?';
        args.push(options.since.toISOString());
      }

      sql += ' ORDER BY createdAt ASC';

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.id,
        tripId: row.tripId,
        userId: row.userId,
        friendId: row.friendId,
        context: row.context,
        role: row.role,
        content: row.content,
        createdAt: new Date(row.createdAt as string),
      }));
    },

    create: async (tripId: string, data: {
      content: string;
      context?: TripMessage['context'];
      role?: TripMessage['role'];
    }, userId: string): Promise<TripMessage> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const now = new Date();
      const message: TripMessage = {
        id: randomUUID(),
        tripId,
        userId,
        friendId: null,
        context: data.context || 'general',
        role: data.role || 'user',
        content: data.content,
        createdAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO trip_messages (id, tripId, userId, friendId, context, role, content, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [message.id, tripId, userId, null, message.context, message.role, message.content, now.toISOString()],
      });

      return message;
    },
  },

  // Trip Polls
  tripPoll: {
    findMany: async (tripId: string, userId: string, context?: string): Promise<TripPoll[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return [];

      let sql = 'SELECT * FROM trip_polls WHERE tripId = ?';
      const args: any[] = [tripId];

      if (context) {
        sql += ' AND context = ?';
        args.push(context);
      }

      sql += ' ORDER BY createdAt DESC';

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.id,
        tripId: row.tripId,
        context: row.context,
        question: row.question,
        status: row.status,
        createdById: row.createdById,
        createdAt: new Date(row.createdAt as string),
        closedAt: row.closedAt ? new Date(row.closedAt as string) : null,
      }));
    },

    create: async (tripId: string, data: {
      context: TripPoll['context'];
      question: string;
      options: { label: string; url?: string }[];
    }, userId: string): Promise<TripPoll & { options: TripPollOption[] }> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const now = new Date();
      const poll: TripPoll = {
        id: randomUUID(),
        tripId,
        context: data.context,
        question: data.question,
        status: 'active',
        createdById: userId,
        createdAt: now,
        closedAt: null,
      };

      await client.execute({
        sql: 'INSERT INTO trip_polls (id, tripId, context, question, status, createdById, createdAt, closedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [poll.id, tripId, poll.context, poll.question, poll.status, userId, now.toISOString(), null],
      });

      const options: TripPollOption[] = [];
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        const option: TripPollOption = {
          id: randomUUID(),
          pollId: poll.id,
          label: opt.label,
          url: opt.url || null,
          order: i,
        };

        await client.execute({
          sql: 'INSERT INTO trip_poll_options (id, pollId, label, url, "order") VALUES (?, ?, ?, ?, ?)',
          args: [option.id, poll.id, option.label, option.url, i],
        });

        options.push(option);
      }

      return { ...poll, options };
    },

    close: async (pollId: string, userId: string): Promise<TripPoll | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT p.* FROM trip_polls p
              JOIN trip_sessions ts ON p.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE p.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [pollId, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();

      await client.execute({
        sql: 'UPDATE trip_polls SET status = ?, closedAt = ? WHERE id = ?',
        args: ['closed', now.toISOString(), pollId],
      });

      return {
        id: row.id as string,
        tripId: row.tripId as string,
        context: row.context as TripPoll['context'],
        question: row.question as string,
        status: 'closed',
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        closedAt: now,
      };
    },

    vote: async (optionId: string, userId: string): Promise<TripPollVote> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify poll is active and user has access
      const optionCheck = await client.execute({
        sql: `SELECT o.*, p.tripId, p.status as pollStatus FROM trip_poll_options o
              JOIN trip_polls p ON o.pollId = p.id
              JOIN trip_sessions ts ON p.tripId = ts.id
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE o.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [optionId, userId, userId],
      });

      if (optionCheck.rows.length === 0) {
        throw new Error('Poll option not found or access denied');
      }

      if (optionCheck.rows[0].pollStatus !== 'active') {
        throw new Error('Poll is closed');
      }

      // Check if user already voted for this specific option (multi-select allowed)
      const existingVote = await client.execute({
        sql: 'SELECT id FROM trip_poll_votes WHERE optionId = ? AND visitorId = ?',
        args: [optionId, userId],
      });

      if (existingVote.rows.length > 0) {
        throw new Error('Already voted for this option');
      }

      const now = new Date();
      const vote: TripPollVote = {
        id: randomUUID(),
        optionId,
        visitorId: userId,
        friendId: null,
        votedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO trip_poll_votes (id, optionId, visitorId, friendId, votedAt) VALUES (?, ?, ?, ?, ?)',
        args: [vote.id, optionId, userId, null, now.toISOString()],
      });

      return vote;
    },

    delete: async (pollId: string, userId: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify poll exists and user has access (must be creator)
      const existing = await client.execute({
        sql: `SELECT p.* FROM trip_polls p
              JOIN trip_sessions ts ON p.tripId = ts.id
              WHERE p.id = ? AND p.createdById = ?`,
        args: [pollId, userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Poll not found or access denied');
      }

      // Delete votes first (foreign key constraint)
      await client.execute({
        sql: `DELETE FROM trip_poll_votes WHERE optionId IN (SELECT id FROM trip_poll_options WHERE pollId = ?)`,
        args: [pollId],
      });

      // Delete options
      await client.execute({
        sql: 'DELETE FROM trip_poll_options WHERE pollId = ?',
        args: [pollId],
      });

      // Delete poll
      await client.execute({
        sql: 'DELETE FROM trip_polls WHERE id = ?',
        args: [pollId],
      });
    },

    removeVote: async (optionId: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'DELETE FROM trip_poll_votes WHERE optionId = ? AND visitorId = ?',
        args: [optionId, userId],
      });

      return result.rowsAffected > 0;
    },

    update: async (pollId: string, data: {
      question?: string;
      addOptions?: { label: string; url?: string }[];
      removeOptionIds?: string[];
    }, userId: string): Promise<TripPoll & { options: TripPollOption[] }> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify poll exists and user is the creator
      const existing = await client.execute({
        sql: `SELECT p.* FROM trip_polls p
              WHERE p.id = ? AND p.createdById = ?`,
        args: [pollId, userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Poll not found or access denied');
      }

      const row = existing.rows[0];

      // Update question if provided
      if (data.question) {
        await client.execute({
          sql: 'UPDATE trip_polls SET question = ? WHERE id = ?',
          args: [data.question, pollId],
        });
      }

      // Remove options if specified
      if (data.removeOptionIds && data.removeOptionIds.length > 0) {
        // First delete votes for these options
        for (const optionId of data.removeOptionIds) {
          await client.execute({
            sql: 'DELETE FROM trip_poll_votes WHERE optionId = ?',
            args: [optionId],
          });
          await client.execute({
            sql: 'DELETE FROM trip_poll_options WHERE id = ? AND pollId = ?',
            args: [optionId, pollId],
          });
        }
      }

      // Add new options if specified
      if (data.addOptions && data.addOptions.length > 0) {
        // Get current max order
        const maxOrderResult = await client.execute({
          sql: 'SELECT MAX("order") as maxOrder FROM trip_poll_options WHERE pollId = ?',
          args: [pollId],
        });
        let nextOrder = ((maxOrderResult.rows[0]?.maxOrder as number) || -1) + 1;

        for (const opt of data.addOptions) {
          const option: TripPollOption = {
            id: randomUUID(),
            pollId,
            label: opt.label,
            url: opt.url || null,
            order: nextOrder++,
          };

          await client.execute({
            sql: 'INSERT INTO trip_poll_options (id, pollId, label, url, "order") VALUES (?, ?, ?, ?, ?)',
            args: [option.id, pollId, option.label, option.url, option.order],
          });
        }
      }

      // Fetch updated poll and options
      const updatedOptions = await client.execute({
        sql: 'SELECT * FROM trip_poll_options WHERE pollId = ? ORDER BY "order"',
        args: [pollId],
      });

      const options: TripPollOption[] = updatedOptions.rows.map((r: any) => ({
        id: r.id,
        pollId: r.pollId,
        label: r.label,
        url: r.url,
        order: r.order,
      }));

      return {
        id: row.id as string,
        tripId: row.tripId as string,
        context: row.context as TripPoll['context'],
        question: (data.question || row.question) as string,
        status: row.status as 'active' | 'closed',
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        closedAt: row.closedAt ? new Date(row.closedAt as string) : null,
        options,
      };
    },
  },

  // Trip Goal Progress
  tripGoalProgress: {
    findByTripId: async (tripId: string, userId: string): Promise<TripGoalProgress[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return [];

      const result = await client.execute({
        sql: 'SELECT * FROM trip_goal_progress WHERE tripId = ?',
        args: [tripId],
      });

      return result.rows.map((row: any) => ({
        id: row.id,
        tripId: row.tripId,
        goalType: row.goalType,
        status: row.status,
        completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
      }));
    },

    update: async (tripId: string, goalType: string, status: TripGoalProgress['status'], userId: string): Promise<TripGoalProgress | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return null;

      const now = status === 'completed' ? new Date() : null;

      await client.execute({
        sql: 'UPDATE trip_goal_progress SET status = ?, completedAt = ? WHERE tripId = ? AND goalType = ?',
        args: [status, now?.toISOString() || null, tripId, goalType],
      });

      const result = await client.execute({
        sql: 'SELECT * FROM trip_goal_progress WHERE tripId = ? AND goalType = ?',
        args: [tripId, goalType],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        tripId: row.tripId as string,
        goalType: row.goalType as TripGoalProgress['goalType'],
        status: row.status as TripGoalProgress['status'],
        completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
      };
    },
  },

  // Trip Sync - for real-time collaborative updates
  tripSync: {
    getChanges: async (tripId: string, userId: string, lastSync: Date): Promise<{
      messages: TripMessage[];
      polls: TripPoll[];
      goalProgress: TripGoalProgress[];
      tripUpdated: boolean;
      lastUpdated: Date;
    }> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const tripRow = accessCheck.rows[0];
      const tripUpdatedAt = new Date(tripRow.updatedAt as string);
      const tripUpdated = tripUpdatedAt > lastSync;

      // Get new messages
      const messagesResult = await client.execute({
        sql: 'SELECT * FROM trip_messages WHERE tripId = ? AND createdAt > ? ORDER BY createdAt ASC',
        args: [tripId, lastSync.toISOString()],
      });

      // Get recently updated polls (created, closed, or with new votes)
      // First, find polls with recent votes
      const pollsWithRecentVotes = await client.execute({
        sql: `SELECT DISTINCT p.id FROM trip_polls p
              JOIN trip_poll_options o ON p.id = o.pollId
              JOIN trip_poll_votes v ON o.id = v.optionId
              WHERE p.tripId = ? AND v.votedAt > ?`,
        args: [tripId, lastSync.toISOString()],
      });

      const pollIdsWithVotes = pollsWithRecentVotes.rows.map((r: any) => r.id as string);

      // Get polls that were created, closed, or have recent votes
      const pollsResult = await client.execute({
        sql: 'SELECT * FROM trip_polls WHERE tripId = ? AND (createdAt > ? OR closedAt > ?) ORDER BY createdAt DESC',
        args: [tripId, lastSync.toISOString(), lastSync.toISOString()],
      });

      // Combine poll IDs (created/closed + with votes)
      const allUpdatedPollIds = new Set<string>([
        ...pollsResult.rows.map((r: any) => r.id as string),
        ...pollIdsWithVotes,
      ]);

      // Fetch full poll data with options and votes for all updated polls
      const polls: any[] = [];
      for (const pollId of Array.from(allUpdatedPollIds)) {
        const pollResult = await client.execute({
          sql: 'SELECT * FROM trip_polls WHERE id = ?',
          args: [pollId],
        });

        if (pollResult.rows.length === 0) continue;
        const poll = pollResult.rows[0];

        const optionsResult = await client.execute({
          sql: 'SELECT * FROM trip_poll_options WHERE pollId = ? ORDER BY "order" ASC',
          args: [pollId],
        });

        const optionsWithVotes: any[] = [];
        for (const opt of optionsResult.rows) {
          // Join with users table to get voter profile information
          const votesResult = await client.execute({
            sql: `SELECT v.*, u.name as voterName, u.profileImage as voterProfileImage
                  FROM trip_poll_votes v
                  LEFT JOIN users u ON v.visitorId = u.id
                  WHERE v.optionId = ?`,
            args: [opt.id as string],
          });
          optionsWithVotes.push({
            id: opt.id,
            pollId: opt.pollId,
            label: opt.label,
            url: opt.url,
            order: opt.order,
            votes: votesResult.rows.map((v: any) => ({
              id: v.id,
              optionId: v.optionId,
              visitorId: v.visitorId,
              friendId: v.friendId,
              votedAt: new Date(v.votedAt as string),
              voterName: v.voterName,
              voterProfileImage: v.voterProfileImage,
            })),
          });
        }

        polls.push({
          id: poll.id,
          tripId: poll.tripId,
          context: poll.context,
          question: poll.question,
          status: poll.status,
          createdById: poll.createdById,
          createdAt: new Date(poll.createdAt as string),
          closedAt: poll.closedAt ? new Date(poll.closedAt as string) : null,
          options: optionsWithVotes,
        });
      }

      // Get goal progress
      const goalsResult = await client.execute({
        sql: 'SELECT * FROM trip_goal_progress WHERE tripId = ?',
        args: [tripId],
      });

      return {
        messages: messagesResult.rows.map((row: any) => ({
          id: row.id,
          tripId: row.tripId,
          userId: row.userId,
          friendId: row.friendId,
          context: row.context,
          role: row.role,
          content: row.content,
          createdAt: new Date(row.createdAt as string),
        })),
        polls,
        goalProgress: goalsResult.rows.map((row: any) => ({
          id: row.id,
          tripId: row.tripId,
          goalType: row.goalType,
          status: row.status,
          completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
        })),
        tripUpdated,
        lastUpdated: new Date(),
      };
    },
  },

  // Trip Presence - for typing indicators and active user tracking
  tripPresence: {
    // Update typing status for a user
    updateTyping: async (tripId: string, userId: string, isTyping: boolean, context: string = 'general'): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const now = new Date().toISOString();

      // Upsert presence record
      await client.execute({
        sql: `INSERT INTO trip_presence (id, tripId, userId, context, isTyping, lastSeen)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT (tripId, userId) DO UPDATE SET
                context = excluded.context,
                isTyping = excluded.isTyping,
                lastSeen = excluded.lastSeen`,
        args: [randomUUID(), tripId, userId, context, isTyping ? 1 : 0, now],
      });
    },

    // Update presence (heartbeat) for a user
    updatePresence: async (tripId: string, userId: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      const now = new Date().toISOString();

      // Upsert presence record (keep typing status if exists)
      await client.execute({
        sql: `INSERT INTO trip_presence (id, tripId, userId, context, isTyping, lastSeen)
              VALUES (?, ?, ?, 'general', 0, ?)
              ON CONFLICT (tripId, userId) DO UPDATE SET
                lastSeen = excluded.lastSeen`,
        args: [randomUUID(), tripId, userId, now],
      });
    },

    // Get users currently typing
    getTypingUsers: async (tripId: string, userId: string, context?: string): Promise<{
      id: string;
      name: string;
    }[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      // Get typing users (typing within last 5 seconds)
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

      let sql = `SELECT p.userId, u.name
                 FROM trip_presence p
                 JOIN users u ON p.userId = u.id
                 WHERE p.tripId = ? AND p.isTyping = 1 AND p.lastSeen > ?`;
      let args: any[] = [tripId, fiveSecondsAgo];

      if (context) {
        sql += ' AND p.context = ?';
        args.push(context);
      }

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.userId as string,
        name: row.name as string,
      }));
    },

    // Get active users (seen within last 30 seconds)
    getActiveUsers: async (tripId: string, userId: string): Promise<{
      id: string;
      name: string;
      profileImage: string | null;
      lastSeen: Date;
    }[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify access
      const accessCheck = await client.execute({
        sql: `SELECT ts.* FROM trip_sessions ts
              LEFT JOIN trip_collaborators tc ON ts.id = tc.tripId
              WHERE ts.id = ? AND (ts.userId = ? OR tc.userId = ?)`,
        args: [tripId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Trip not found or access denied');
      }

      // Get active users (seen within last 30 seconds)
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

      const result = await client.execute({
        sql: `SELECT p.userId, p.lastSeen, u.name, u.profileImage
              FROM trip_presence p
              JOIN users u ON p.userId = u.id
              WHERE p.tripId = ? AND p.lastSeen > ?
              ORDER BY p.lastSeen DESC`,
        args: [tripId, thirtySecondsAgo],
      });

      return result.rows.map((row: any) => ({
        id: row.userId as string,
        name: row.name as string,
        profileImage: row.profileImage as string | null,
        lastSeen: new Date(row.lastSeen as string),
      }));
    },

    // Clean up old presence records (called periodically)
    cleanup: async (): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      // Remove presence records older than 1 minute
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

      await client.execute({
        sql: 'DELETE FROM trip_presence WHERE lastSeen < ?',
        args: [oneMinuteAgo],
      });
    },
  },

  // Event Plan Session Operations
  eventPlanSession: {
    findMany: async (userId: string): Promise<(EventPlanSession & { collaborators: any[] })[]> => {
      await ensureTablesExist();
      const client = getClient();

      // Find event plans where user is owner or collaborator (via linked friend)
      const result = await client.execute({
        sql: `SELECT DISTINCT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.userId = ? OR epc.userId = ?
              ORDER BY eps.updatedAt DESC`,
        args: [userId, userId],
      });

      const eventPlans: (EventPlanSession & { collaborators: any[] })[] = [];
      for (const row of result.rows) {
        const colResult = await client.execute({
          sql: `SELECT epc.*, f.name as friendName, f.profileImage, f.customProfileImage, f.linkedUserId
                FROM event_plan_collaborators epc
                JOIN friends f ON epc.friendId = f.id
                WHERE epc.eventPlanId = ?`,
          args: [row.id as string],
        });

        eventPlans.push({
          id: row.id as string,
          userId: row.userId as string,
          title: row.title as string,
          description: row.description as string | null,
          status: row.status as EventPlanSession['status'],
          eventDate: row.eventDate ? new Date(row.eventDate as string) : null,
          eventTime: row.eventTime as string | null,
          eventLocation: row.eventLocation as string | null,
          selectedEventId: row.selectedEventId as string | null,
          shareToken: row.shareToken as string | null,
          joinToken: row.joinToken as string | null,
          createdAt: new Date(row.createdAt as string),
          updatedAt: new Date(row.updatedAt as string),
          collaborators: colResult.rows.map((c: any) => ({
            id: c.id,
            eventPlanId: c.eventPlanId,
            friendId: c.friendId,
            userId: c.userId,
            role: c.role,
            joinedAt: new Date(c.joinedAt as string),
            friendName: c.friendName,
            profileImage: c.customProfileImage || c.profileImage,
            linkedUserId: c.linkedUserId,
          })),
        });
      }

      return eventPlans;
    },

    findById: async (id: string, userId: string): Promise<(EventPlanSession & {
      collaborators: any[];
      candidates: any[];
      polls: any[];
      goalProgress: any[];
    }) | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify user has access
      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (accessCheck.rows.length === 0) return null;

      const row = accessCheck.rows[0];

      // Get collaborators
      const colResult = await client.execute({
        sql: `SELECT epc.*, f.name as friendName, f.profileImage, f.customProfileImage, f.linkedUserId, f.interests
              FROM event_plan_collaborators epc
              JOIN friends f ON epc.friendId = f.id
              WHERE epc.eventPlanId = ?`,
        args: [id],
      });

      // Get candidates
      const candidatesResult = await client.execute({
        sql: 'SELECT * FROM event_plan_candidates WHERE eventPlanId = ? ORDER BY "order" ASC',
        args: [id],
      });

      // Get polls with options and votes
      const pollsResult = await client.execute({
        sql: 'SELECT * FROM event_plan_polls WHERE eventPlanId = ? ORDER BY createdAt DESC',
        args: [id],
      });

      const polls: any[] = [];
      for (const poll of pollsResult.rows) {
        const optionsResult = await client.execute({
          sql: 'SELECT * FROM event_plan_poll_options WHERE pollId = ? ORDER BY "order" ASC',
          args: [poll.id as string],
        });

        const optionsWithVotes: any[] = [];
        for (const opt of optionsResult.rows) {
          // Join with users table to get voter profile information
          const votesResult = await client.execute({
            sql: `SELECT v.*, u.name as voterName, u.profileImage as voterProfileImage
                  FROM event_plan_poll_votes v
                  LEFT JOIN users u ON v.visitorId = u.id
                  WHERE v.optionId = ?`,
            args: [opt.id as string],
          });
          optionsWithVotes.push({
            id: opt.id,
            pollId: opt.pollId,
            label: opt.label,
            url: opt.url,
            order: opt.order,
            votes: votesResult.rows.map((v: any) => ({
              id: v.id,
              optionId: v.optionId,
              visitorId: v.visitorId,
              friendId: v.friendId,
              votedAt: new Date(v.votedAt as string),
              voterName: v.voterName,
              voterProfileImage: v.voterProfileImage,
            })),
          });
        }

        polls.push({
          id: poll.id,
          eventPlanId: poll.eventPlanId,
          context: poll.context,
          question: poll.question,
          status: poll.status,
          createdById: poll.createdById,
          createdAt: new Date(poll.createdAt as string),
          closedAt: poll.closedAt ? new Date(poll.closedAt as string) : null,
          options: optionsWithVotes,
        });
      }

      // Get goal progress
      const goalsResult = await client.execute({
        sql: 'SELECT * FROM event_plan_goal_progress WHERE eventPlanId = ?',
        args: [id],
      });

      return {
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        status: row.status as EventPlanSession['status'],
        eventDate: row.eventDate ? new Date(row.eventDate as string) : null,
        eventTime: row.eventTime as string | null,
        eventLocation: row.eventLocation as string | null,
        selectedEventId: row.selectedEventId as string | null,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
        collaborators: colResult.rows.map((c: any) => ({
          id: c.id,
          eventPlanId: c.eventPlanId,
          friendId: c.friendId,
          userId: c.userId,
          role: c.role,
          joinedAt: new Date(c.joinedAt as string),
          friendName: c.friendName,
          profileImage: c.customProfileImage || c.profileImage,
          linkedUserId: c.linkedUserId,
          interests: c.interests,
        })),
        candidates: candidatesResult.rows.map((c: any) => ({
          id: c.id,
          eventPlanId: c.eventPlanId,
          title: c.title,
          description: c.description,
          location: c.location,
          category: c.category,
          externalUrl: c.externalUrl,
          imageUrl: c.imageUrl,
          eventDate: c.eventDate ? new Date(c.eventDate as string) : null,
          eventTime: c.eventTime,
          estimatedCost: c.estimatedCost,
          notes: c.notes,
          order: c.order,
          createdById: c.createdById,
          createdAt: new Date(c.createdAt as string),
          updatedAt: new Date(c.updatedAt as string),
        })),
        polls,
        goalProgress: goalsResult.rows.map((g: any) => ({
          id: g.id,
          eventPlanId: g.eventPlanId,
          goalType: g.goalType,
          status: g.status,
          completedAt: g.completedAt ? new Date(g.completedAt as string) : null,
        })),
      };
    },

    create: async (data: {
      userId: string;
      title: string;
      description?: string;
      collaboratorFriendIds?: string[];
    }): Promise<EventPlanSession> => {
      await ensureTablesExist();
      const client = getClient();

      const now = new Date();
      const eventPlan: EventPlanSession = {
        id: randomUUID(),
        userId: data.userId,
        title: data.title,
        description: data.description || null,
        status: 'planning',
        eventDate: null,
        eventTime: null,
        eventLocation: null,
        selectedEventId: null,
        shareToken: null,
        joinToken: null,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: `INSERT INTO event_plan_sessions (id, userId, title, description, status, eventDate, eventTime, eventLocation, selectedEventId, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          eventPlan.id,
          eventPlan.userId,
          eventPlan.title,
          eventPlan.description,
          eventPlan.status,
          eventPlan.eventDate?.toISOString() || null,
          eventPlan.eventTime,
          eventPlan.eventLocation,
          eventPlan.selectedEventId,
          eventPlan.createdAt.toISOString(),
          eventPlan.updatedAt.toISOString(),
        ],
      });

      // Create initial goal progress entries (only 2 goals: date and event)
      const goalTypes = ['date', 'event'];
      for (const goalType of goalTypes) {
        await client.execute({
          sql: 'INSERT INTO event_plan_goal_progress (id, eventPlanId, goalType, status, completedAt) VALUES (?, ?, ?, ?, ?)',
          args: [randomUUID(), eventPlan.id, goalType, 'pending', null],
        });
      }

      // Add collaborators if provided
      if (data.collaboratorFriendIds && data.collaboratorFriendIds.length > 0) {
        for (const friendId of data.collaboratorFriendIds) {
          // Get friend info to check for linkedUserId
          const friendResult = await client.execute({
            sql: 'SELECT linkedUserId FROM friends WHERE id = ?',
            args: [friendId],
          });
          const linkedUserId = friendResult.rows[0]?.linkedUserId as string | null;

          await client.execute({
            sql: 'INSERT INTO event_plan_collaborators (id, eventPlanId, friendId, userId, role, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
            args: [randomUUID(), eventPlan.id, friendId, linkedUserId, 'collaborator', now.toISOString()],
          });

          // Send notification to the collaborator if they have an account
          if (linkedUserId) {
            try {
              await prisma.sharedItem.create({
                sharedByUserId: data.userId,
                sharedWithUserId: linkedUserId,
                itemType: 'event',
                itemId: eventPlan.id,
                message: `You've been invited to collaborate on the event "${data.title}"`,
                skipConnectionCheck: true,
              });
            } catch (notifError) {
              console.error('Failed to send event plan notification:', notifError);
            }
          }
        }
      }

      return eventPlan;
    },

    update: async (id: string, userId: string, data: {
      title?: string;
      description?: string;
      status?: EventPlanSession['status'];
      eventDate?: Date | null;
      eventTime?: string | null;
      eventLocation?: string | null;
      selectedEventId?: string | null;
    }): Promise<EventPlanSession | null> => {
      await ensureTablesExist();
      const client = getClient();

      // Check ownership or collaboration
      const existing = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();

      const updated: EventPlanSession = {
        id: row.id as string,
        userId: row.userId as string,
        title: data.title ?? row.title as string,
        description: data.description !== undefined ? data.description : row.description as string | null,
        status: data.status ?? row.status as EventPlanSession['status'],
        eventDate: data.eventDate !== undefined ? data.eventDate : (row.eventDate ? new Date(row.eventDate as string) : null),
        eventTime: data.eventTime !== undefined ? data.eventTime : row.eventTime as string | null,
        eventLocation: data.eventLocation !== undefined ? data.eventLocation : row.eventLocation as string | null,
        selectedEventId: data.selectedEventId !== undefined ? data.selectedEventId : row.selectedEventId as string | null,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: `UPDATE event_plan_sessions SET title = ?, description = ?, status = ?, eventDate = ?, eventTime = ?, eventLocation = ?, selectedEventId = ?, updatedAt = ?
              WHERE id = ?`,
        args: [
          updated.title,
          updated.description,
          updated.status,
          updated.eventDate?.toISOString() || null,
          updated.eventTime,
          updated.eventLocation,
          updated.selectedEventId,
          updated.updatedAt.toISOString(),
          id,
        ],
      });

      // Update goal progress based on changes
      if (data.eventDate !== undefined) {
        const hasValidDate = !!updated.eventDate;
        await client.execute({
          sql: `UPDATE event_plan_goal_progress SET status = ?, completedAt = ? WHERE eventPlanId = ? AND goalType = 'date'`,
          args: [hasValidDate ? 'completed' : 'pending', hasValidDate ? now.toISOString() : null, id],
        });
      }

      if (data.selectedEventId !== undefined) {
        const hasSelectedEvent = !!updated.selectedEventId;
        await client.execute({
          sql: `UPDATE event_plan_goal_progress SET status = ?, completedAt = ? WHERE eventPlanId = ? AND goalType = 'event'`,
          args: [hasSelectedEvent ? 'completed' : 'pending', hasSelectedEvent ? now.toISOString() : null, id],
        });
      }

      return updated;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      // Only owner can delete
      const existing = await client.execute({
        sql: 'SELECT * FROM event_plan_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM event_plan_sessions WHERE id = ?',
        args: [id],
      });

      return true;
    },

    generateShareToken: async (id: string, userId: string): Promise<string | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: 'SELECT * FROM event_plan_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return null;

      const shareToken = randomUUID().replace(/-/g, '').substring(0, 16);

      await client.execute({
        sql: 'UPDATE event_plan_sessions SET shareToken = ?, updatedAt = ? WHERE id = ?',
        args: [shareToken, new Date().toISOString(), id],
      });

      return shareToken;
    },

    revokeShareToken: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: 'SELECT * FROM event_plan_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'UPDATE event_plan_sessions SET shareToken = NULL, updatedAt = ? WHERE id = ?',
        args: [new Date().toISOString(), id],
      });

      return true;
    },

    findByShareToken: async (shareToken: string): Promise<(EventPlanSession & {
      collaborators: any[];
      candidates: any[];
      polls: any[];
      goalProgress: any[];
      ownerName: string;
    }) | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT eps.*, u.name as ownerName FROM event_plan_sessions eps
              JOIN users u ON eps.userId = u.id
              WHERE eps.shareToken = ?`,
        args: [shareToken],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const id = row.id as string;

      // Get collaborators
      const colResult = await client.execute({
        sql: `SELECT epc.*, f.name as friendName, f.profileImage, f.customProfileImage, f.linkedUserId
              FROM event_plan_collaborators epc
              JOIN friends f ON epc.friendId = f.id
              WHERE epc.eventPlanId = ?`,
        args: [id],
      });

      // Get candidates
      const candidatesResult = await client.execute({
        sql: 'SELECT * FROM event_plan_candidates WHERE eventPlanId = ? ORDER BY "order" ASC',
        args: [id],
      });

      // Get polls with options and votes
      const pollsResult = await client.execute({
        sql: 'SELECT * FROM event_plan_polls WHERE eventPlanId = ? ORDER BY createdAt DESC',
        args: [id],
      });

      const polls: any[] = [];
      for (const poll of pollsResult.rows) {
        const optionsResult = await client.execute({
          sql: 'SELECT * FROM event_plan_poll_options WHERE pollId = ? ORDER BY "order" ASC',
          args: [poll.id as string],
        });

        const optionsWithVotes: any[] = [];
        for (const opt of optionsResult.rows) {
          // Join with users table to get voter profile information
          const votesResult = await client.execute({
            sql: `SELECT v.*, u.name as voterName, u.profileImage as voterProfileImage
                  FROM event_plan_poll_votes v
                  LEFT JOIN users u ON v.visitorId = u.id
                  WHERE v.optionId = ?`,
            args: [opt.id as string],
          });
          optionsWithVotes.push({
            id: opt.id,
            pollId: opt.pollId,
            label: opt.label,
            url: opt.url,
            order: opt.order,
            votes: votesResult.rows.map((v: any) => ({
              id: v.id,
              optionId: v.optionId,
              visitorId: v.visitorId,
              friendId: v.friendId,
              votedAt: new Date(v.votedAt as string),
              voterName: v.voterName,
              voterProfileImage: v.voterProfileImage,
            })),
          });
        }

        polls.push({
          id: poll.id,
          eventPlanId: poll.eventPlanId,
          context: poll.context,
          question: poll.question,
          status: poll.status,
          createdById: poll.createdById,
          createdAt: new Date(poll.createdAt as string),
          closedAt: poll.closedAt ? new Date(poll.closedAt as string) : null,
          options: optionsWithVotes,
        });
      }

      // Get goal progress
      const goalsResult = await client.execute({
        sql: 'SELECT * FROM event_plan_goal_progress WHERE eventPlanId = ?',
        args: [id],
      });

      return {
        id: row.id as string,
        userId: row.userId as string,
        title: row.title as string,
        description: row.description as string | null,
        status: row.status as EventPlanSession['status'],
        eventDate: row.eventDate ? new Date(row.eventDate as string) : null,
        eventTime: row.eventTime as string | null,
        eventLocation: row.eventLocation as string | null,
        selectedEventId: row.selectedEventId as string | null,
        shareToken: row.shareToken as string | null,
        joinToken: row.joinToken as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
        ownerName: row.ownerName as string,
        collaborators: colResult.rows.map((c: any) => ({
          id: c.id,
          eventPlanId: c.eventPlanId,
          friendId: c.friendId,
          userId: c.userId,
          role: c.role,
          joinedAt: new Date(c.joinedAt as string),
          friendName: c.friendName,
          profileImage: c.customProfileImage || c.profileImage,
          linkedUserId: c.linkedUserId,
        })),
        candidates: candidatesResult.rows.map((c: any) => ({
          id: c.id,
          eventPlanId: c.eventPlanId,
          title: c.title,
          description: c.description,
          location: c.location,
          category: c.category,
          externalUrl: c.externalUrl,
          imageUrl: c.imageUrl,
          eventDate: c.eventDate ? new Date(c.eventDate as string) : null,
          eventTime: c.eventTime,
          estimatedCost: c.estimatedCost,
          notes: c.notes,
          order: c.order,
          createdById: c.createdById,
          createdAt: new Date(c.createdAt as string),
          updatedAt: new Date(c.updatedAt as string),
        })),
        polls,
        goalProgress: goalsResult.rows.map((g: any) => ({
          id: g.id,
          eventPlanId: g.eventPlanId,
          goalType: g.goalType,
          status: g.status,
          completedAt: g.completedAt ? new Date(g.completedAt as string) : null,
        })),
      };
    },

    generateJoinToken: async (id: string, userId: string): Promise<string | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: 'SELECT * FROM event_plan_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return null;

      const joinToken = randomUUID().replace(/-/g, '').substring(0, 16);

      await client.execute({
        sql: 'UPDATE event_plan_sessions SET joinToken = ?, updatedAt = ? WHERE id = ?',
        args: [joinToken, new Date().toISOString(), id],
      });

      return joinToken;
    },

    revokeJoinToken: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: 'SELECT * FROM event_plan_sessions WHERE id = ? AND userId = ?',
        args: [id, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'UPDATE event_plan_sessions SET joinToken = NULL, updatedAt = ? WHERE id = ?',
        args: [new Date().toISOString(), id],
      });

      return true;
    },

    findByJoinToken: async (joinToken: string): Promise<{
      id: string;
      title: string;
      description: string | null;
      ownerName: string;
      collaboratorCount: number;
    } | null> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT eps.id, eps.title, eps.description, u.name as ownerName
              FROM event_plan_sessions eps
              JOIN users u ON eps.userId = u.id
              WHERE eps.joinToken = ?`,
        args: [joinToken],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];

      const colResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM event_plan_collaborators WHERE eventPlanId = ?',
        args: [row.id as string],
      });

      return {
        id: row.id as string,
        title: row.title as string,
        description: row.description as string | null,
        ownerName: row.ownerName as string,
        collaboratorCount: Number(colResult.rows[0].count),
      };
    },

    joinByToken: async (joinToken: string, userId: string, userName: string): Promise<{ eventPlanId: string } | null> => {
      await ensureTablesExist();
      const client = getClient();

      const eventPlanResult = await client.execute({
        sql: 'SELECT id, userId FROM event_plan_sessions WHERE joinToken = ?',
        args: [joinToken],
      });

      if (eventPlanResult.rows.length === 0) return null;

      const eventPlanId = eventPlanResult.rows[0].id as string;
      const eventPlanOwnerId = eventPlanResult.rows[0].userId as string;

      // Check if user is already a collaborator
      const existingCollab = await client.execute({
        sql: 'SELECT id FROM event_plan_collaborators WHERE eventPlanId = ? AND userId = ?',
        args: [eventPlanId, userId],
      });

      if (existingCollab.rows.length > 0) {
        return { eventPlanId };
      }

      // Check if user is the owner
      if (eventPlanOwnerId === userId) {
        return { eventPlanId };
      }

      // Check if the user has a friend entry with the event plan owner
      const friendResult = await client.execute({
        sql: 'SELECT id FROM friends WHERE userId = ? AND linkedUserId = ?',
        args: [eventPlanOwnerId, userId],
      });

      let friendId: string;

      if (friendResult.rows.length > 0) {
        friendId = friendResult.rows[0].id as string;

        const existingFriendCollab = await client.execute({
          sql: 'SELECT id FROM event_plan_collaborators WHERE eventPlanId = ? AND friendId = ?',
          args: [eventPlanId, friendId],
        });

        if (existingFriendCollab.rows.length > 0) {
          await client.execute({
            sql: 'UPDATE event_plan_collaborators SET userId = ? WHERE eventPlanId = ? AND friendId = ?',
            args: [userId, eventPlanId, friendId],
          });
          return { eventPlanId };
        }
      } else {
        // Create a new friend entry for the event plan owner
        friendId = randomUUID();
        const now = new Date().toISOString();
        await client.execute({
          sql: `INSERT INTO friends (id, userId, name, linkedUserId, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [friendId, eventPlanOwnerId, userName, userId, now, now],
        });
      }

      // Add as collaborator
      const collaboratorId = randomUUID();
      await client.execute({
        sql: `INSERT INTO event_plan_collaborators (id, eventPlanId, friendId, userId, role, joinedAt)
              VALUES (?, ?, ?, ?, 'collaborator', ?)`,
        args: [collaboratorId, eventPlanId, friendId, userId, new Date().toISOString()],
      });

      return { eventPlanId };
    },
  },

  // Event Plan Collaborators
  eventPlanCollaborator: {
    add: async (eventPlanId: string, friendIds: string[], userId: string): Promise<EventPlanCollaborator[]> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const eventPlanOwnerId = accessCheck.rows[0].userId as string;
      const eventPlanTitle = accessCheck.rows[0].title as string;
      const now = new Date();
      const added: EventPlanCollaborator[] = [];

      for (const friendId of friendIds) {
        const existing = await client.execute({
          sql: 'SELECT id FROM event_plan_collaborators WHERE eventPlanId = ? AND friendId = ?',
          args: [eventPlanId, friendId],
        });

        if (existing.rows.length > 0) continue;

        const friendResult = await client.execute({
          sql: 'SELECT linkedUserId FROM friends WHERE id = ?',
          args: [friendId],
        });
        const linkedUserId = friendResult.rows[0]?.linkedUserId as string | null;

        const collaborator: EventPlanCollaborator = {
          id: randomUUID(),
          eventPlanId,
          friendId,
          userId: linkedUserId,
          role: 'collaborator',
          joinedAt: now,
        };

        await client.execute({
          sql: 'INSERT INTO event_plan_collaborators (id, eventPlanId, friendId, userId, role, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
          args: [collaborator.id, eventPlanId, friendId, linkedUserId, 'collaborator', now.toISOString()],
        });

        added.push(collaborator);

        if (linkedUserId) {
          try {
            await prisma.sharedItem.create({
              sharedByUserId: eventPlanOwnerId,
              sharedWithUserId: linkedUserId,
              itemType: 'event',
              itemId: eventPlanId,
              message: `You've been invited to collaborate on the event "${eventPlanTitle}"`,
              skipConnectionCheck: true,
            });
          } catch (notifError) {
            console.error('Failed to send event plan notification:', notifError);
          }
        }
      }

      return added;
    },

    remove: async (eventPlanId: string, friendId: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM event_plan_collaborators WHERE eventPlanId = ? AND friendId = ?',
        args: [eventPlanId, friendId],
      });

      return true;
    },
  },

  // Event Plan Candidates
  eventPlanCandidate: {
    create: async (eventPlanId: string, data: {
      title: string;
      description?: string;
      location?: string;
      category?: string;
      externalUrl?: string;
      imageUrl?: string;
      eventDate?: Date;
      eventTime?: string;
      estimatedCost?: number;
      notes?: string;
    }, userId: string): Promise<EventPlanCandidate> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const maxOrderResult = await client.execute({
        sql: 'SELECT MAX("order") as maxOrder FROM event_plan_candidates WHERE eventPlanId = ?',
        args: [eventPlanId],
      });
      const maxOrder = (maxOrderResult.rows[0]?.maxOrder as number) || 0;

      const now = new Date();
      const candidate: EventPlanCandidate = {
        id: randomUUID(),
        eventPlanId,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        category: data.category || null,
        externalUrl: data.externalUrl || null,
        imageUrl: data.imageUrl || null,
        eventDate: data.eventDate || null,
        eventTime: data.eventTime || null,
        estimatedCost: data.estimatedCost || null,
        notes: data.notes || null,
        order: maxOrder + 1,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: `INSERT INTO event_plan_candidates (id, eventPlanId, title, description, location, category, externalUrl, imageUrl, eventDate, eventTime, estimatedCost, notes, "order", createdById, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          candidate.id, eventPlanId, candidate.title, candidate.description, candidate.location,
          candidate.category, candidate.externalUrl, candidate.imageUrl,
          candidate.eventDate?.toISOString() || null, candidate.eventTime,
          candidate.estimatedCost, candidate.notes, candidate.order, userId, now.toISOString(), now.toISOString(),
        ],
      });

      // Update goal progress
      await client.execute({
        sql: `UPDATE event_plan_goal_progress SET status = 'in_progress' WHERE eventPlanId = ? AND goalType = 'event' AND status = 'pending'`,
        args: [eventPlanId],
      });

      return candidate;
    },

    update: async (id: string, data: Partial<Omit<EventPlanCandidate, 'id' | 'eventPlanId' | 'createdById' | 'createdAt'>>, userId: string): Promise<EventPlanCandidate | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT c.* FROM event_plan_candidates c
              JOIN event_plan_sessions eps ON c.eventPlanId = eps.id
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE c.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();
      const updated: EventPlanCandidate = {
        id: row.id as string,
        eventPlanId: row.eventPlanId as string,
        title: data.title ?? row.title as string,
        description: data.description !== undefined ? data.description : row.description as string | null,
        location: data.location !== undefined ? data.location : row.location as string | null,
        category: data.category !== undefined ? data.category : row.category as string | null,
        externalUrl: data.externalUrl !== undefined ? data.externalUrl : row.externalUrl as string | null,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : row.imageUrl as string | null,
        eventDate: data.eventDate !== undefined ? data.eventDate : (row.eventDate ? new Date(row.eventDate as string) : null),
        eventTime: data.eventTime !== undefined ? data.eventTime : row.eventTime as string | null,
        estimatedCost: data.estimatedCost !== undefined ? data.estimatedCost : row.estimatedCost as number | null,
        notes: data.notes !== undefined ? data.notes : row.notes as string | null,
        order: data.order ?? row.order as number,
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: `UPDATE event_plan_candidates SET title = ?, description = ?, location = ?, category = ?, externalUrl = ?, imageUrl = ?, eventDate = ?, eventTime = ?, estimatedCost = ?, notes = ?, "order" = ?, updatedAt = ?
              WHERE id = ?`,
        args: [
          updated.title, updated.description, updated.location, updated.category,
          updated.externalUrl, updated.imageUrl, updated.eventDate?.toISOString() || null,
          updated.eventTime, updated.estimatedCost, updated.notes, updated.order,
          now.toISOString(), id,
        ],
      });

      return updated;
    },

    delete: async (id: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT c.* FROM event_plan_candidates c
              JOIN event_plan_sessions eps ON c.eventPlanId = eps.id
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE c.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [id, userId, userId],
      });

      if (existing.rows.length === 0) return false;

      await client.execute({
        sql: 'DELETE FROM event_plan_candidates WHERE id = ?',
        args: [id],
      });

      return true;
    },
  },

  // Event Plan Messages
  eventPlanMessage: {
    findMany: async (eventPlanId: string, userId: string, options?: { context?: string; since?: Date }): Promise<EventPlanMessage[]> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return [];

      let sql = 'SELECT * FROM event_plan_messages WHERE eventPlanId = ?';
      const args: any[] = [eventPlanId];

      if (options?.context) {
        sql += ' AND context = ?';
        args.push(options.context);
      }

      if (options?.since) {
        sql += ' AND createdAt > ?';
        args.push(options.since.toISOString());
      }

      sql += ' ORDER BY createdAt ASC';

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.id,
        eventPlanId: row.eventPlanId,
        userId: row.userId,
        friendId: row.friendId,
        context: row.context,
        role: row.role,
        content: row.content,
        toolResults: row.toolResults || null,
        createdAt: new Date(row.createdAt as string),
      }));
    },

    create: async (eventPlanId: string, data: {
      content: string;
      context?: EventPlanMessage['context'];
      role?: EventPlanMessage['role'];
      toolResults?: string | null;
    }, userId: string): Promise<EventPlanMessage> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const now = new Date();
      const message: EventPlanMessage = {
        id: randomUUID(),
        eventPlanId,
        userId,
        friendId: null,
        context: data.context || 'general',
        role: data.role || 'user',
        content: data.content,
        toolResults: data.toolResults || null,
        createdAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO event_plan_messages (id, eventPlanId, userId, friendId, context, role, content, toolResults, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [message.id, eventPlanId, userId, null, message.context, message.role, message.content, message.toolResults, now.toISOString()],
      });

      return message;
    },
  },

  // Event Plan Polls
  eventPlanPoll: {
    findMany: async (eventPlanId: string, userId: string, context?: string): Promise<EventPlanPoll[]> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return [];

      let sql = 'SELECT * FROM event_plan_polls WHERE eventPlanId = ?';
      const args: any[] = [eventPlanId];

      if (context) {
        sql += ' AND context = ?';
        args.push(context);
      }

      sql += ' ORDER BY createdAt DESC';

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.id,
        eventPlanId: row.eventPlanId,
        context: row.context,
        question: row.question,
        status: row.status,
        createdById: row.createdById,
        createdAt: new Date(row.createdAt as string),
        closedAt: row.closedAt ? new Date(row.closedAt as string) : null,
      }));
    },

    create: async (eventPlanId: string, data: {
      context: EventPlanPoll['context'];
      question: string;
      options: { label: string; url?: string }[];
    }, userId: string): Promise<EventPlanPoll & { options: EventPlanPollOption[] }> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const now = new Date();
      const poll: EventPlanPoll = {
        id: randomUUID(),
        eventPlanId,
        context: data.context,
        question: data.question,
        status: 'active',
        createdById: userId,
        createdAt: now,
        closedAt: null,
      };

      await client.execute({
        sql: 'INSERT INTO event_plan_polls (id, eventPlanId, context, question, status, createdById, createdAt, closedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [poll.id, eventPlanId, poll.context, poll.question, poll.status, userId, now.toISOString(), null],
      });

      const options: EventPlanPollOption[] = [];
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        const option: EventPlanPollOption = {
          id: randomUUID(),
          pollId: poll.id,
          label: opt.label,
          url: opt.url || null,
          order: i,
        };

        await client.execute({
          sql: 'INSERT INTO event_plan_poll_options (id, pollId, label, url, "order") VALUES (?, ?, ?, ?, ?)',
          args: [option.id, poll.id, option.label, option.url, i],
        });

        options.push(option);
      }

      return { ...poll, options };
    },

    close: async (pollId: string, userId: string): Promise<EventPlanPoll | null> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT p.* FROM event_plan_polls p
              JOIN event_plan_sessions eps ON p.eventPlanId = eps.id
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE p.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [pollId, userId, userId],
      });

      if (existing.rows.length === 0) return null;

      const row = existing.rows[0];
      const now = new Date();

      await client.execute({
        sql: 'UPDATE event_plan_polls SET status = ?, closedAt = ? WHERE id = ?',
        args: ['closed', now.toISOString(), pollId],
      });

      return {
        id: row.id as string,
        eventPlanId: row.eventPlanId as string,
        context: row.context as EventPlanPoll['context'],
        question: row.question as string,
        status: 'closed',
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        closedAt: now,
      };
    },

    vote: async (optionId: string, userId: string): Promise<EventPlanPollVote> => {
      await ensureTablesExist();
      const client = getClient();

      const optionCheck = await client.execute({
        sql: `SELECT o.*, p.eventPlanId, p.status as pollStatus FROM event_plan_poll_options o
              JOIN event_plan_polls p ON o.pollId = p.id
              JOIN event_plan_sessions eps ON p.eventPlanId = eps.id
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE o.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [optionId, userId, userId],
      });

      if (optionCheck.rows.length === 0) {
        throw new Error('Poll option not found or access denied');
      }

      if (optionCheck.rows[0].pollStatus !== 'active') {
        throw new Error('Poll is closed');
      }

      // Check if user already voted for this specific option (multi-select allowed)
      const existingVote = await client.execute({
        sql: 'SELECT id FROM event_plan_poll_votes WHERE optionId = ? AND visitorId = ?',
        args: [optionId, userId],
      });

      if (existingVote.rows.length > 0) {
        throw new Error('Already voted for this option');
      }

      const now = new Date();
      const vote: EventPlanPollVote = {
        id: randomUUID(),
        optionId,
        visitorId: userId,
        friendId: null,
        votedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO event_plan_poll_votes (id, optionId, visitorId, friendId, votedAt) VALUES (?, ?, ?, ?, ?)',
        args: [vote.id, optionId, userId, null, now.toISOString()],
      });

      return vote;
    },

    delete: async (pollId: string, userId: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await client.execute({
        sql: `SELECT p.* FROM event_plan_polls p
              JOIN event_plan_sessions eps ON p.eventPlanId = eps.id
              WHERE p.id = ? AND p.createdById = ?`,
        args: [pollId, userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Poll not found or access denied');
      }

      await client.execute({
        sql: `DELETE FROM event_plan_poll_votes WHERE optionId IN (SELECT id FROM event_plan_poll_options WHERE pollId = ?)`,
        args: [pollId],
      });

      await client.execute({
        sql: 'DELETE FROM event_plan_poll_options WHERE pollId = ?',
        args: [pollId],
      });

      await client.execute({
        sql: 'DELETE FROM event_plan_polls WHERE id = ?',
        args: [pollId],
      });
    },

    removeVote: async (optionId: string, userId: string): Promise<boolean> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: 'DELETE FROM event_plan_poll_votes WHERE optionId = ? AND visitorId = ?',
        args: [optionId, userId],
      });

      return result.rowsAffected > 0;
    },

    update: async (pollId: string, data: {
      question?: string;
      addOptions?: { label: string; url?: string }[];
      removeOptionIds?: string[];
    }, userId: string): Promise<EventPlanPoll & { options: EventPlanPollOption[] }> => {
      await ensureTablesExist();
      const client = getClient();

      // Verify poll exists and user is the creator
      const existing = await client.execute({
        sql: `SELECT p.* FROM event_plan_polls p
              WHERE p.id = ? AND p.createdById = ?`,
        args: [pollId, userId],
      });

      if (existing.rows.length === 0) {
        throw new Error('Poll not found or access denied');
      }

      const row = existing.rows[0];

      // Update question if provided
      if (data.question) {
        await client.execute({
          sql: 'UPDATE event_plan_polls SET question = ? WHERE id = ?',
          args: [data.question, pollId],
        });
      }

      // Remove options if specified
      if (data.removeOptionIds && data.removeOptionIds.length > 0) {
        // First delete votes for these options
        for (const optionId of data.removeOptionIds) {
          await client.execute({
            sql: 'DELETE FROM event_plan_poll_votes WHERE optionId = ?',
            args: [optionId],
          });
          await client.execute({
            sql: 'DELETE FROM event_plan_poll_options WHERE id = ? AND pollId = ?',
            args: [optionId, pollId],
          });
        }
      }

      // Add new options if specified
      if (data.addOptions && data.addOptions.length > 0) {
        // Get current max order
        const maxOrderResult = await client.execute({
          sql: 'SELECT MAX("order") as maxOrder FROM event_plan_poll_options WHERE pollId = ?',
          args: [pollId],
        });
        let nextOrder = ((maxOrderResult.rows[0]?.maxOrder as number) || -1) + 1;

        for (const opt of data.addOptions) {
          const option: EventPlanPollOption = {
            id: randomUUID(),
            pollId,
            label: opt.label,
            url: opt.url || null,
            order: nextOrder++,
          };

          await client.execute({
            sql: 'INSERT INTO event_plan_poll_options (id, pollId, label, url, "order") VALUES (?, ?, ?, ?, ?)',
            args: [option.id, pollId, option.label, option.url, option.order],
          });
        }
      }

      // Fetch updated poll and options
      const updatedOptions = await client.execute({
        sql: 'SELECT * FROM event_plan_poll_options WHERE pollId = ? ORDER BY "order"',
        args: [pollId],
      });

      const options: EventPlanPollOption[] = updatedOptions.rows.map((r: any) => ({
        id: r.id,
        pollId: r.pollId,
        label: r.label,
        url: r.url,
        order: r.order,
      }));

      return {
        id: row.id as string,
        eventPlanId: row.eventPlanId as string,
        context: row.context as EventPlanPoll['context'],
        question: (data.question || row.question) as string,
        status: row.status as 'active' | 'closed',
        createdById: row.createdById as string,
        createdAt: new Date(row.createdAt as string),
        closedAt: row.closedAt ? new Date(row.closedAt as string) : null,
        options,
      };
    },
  },

  // Event Plan Goal Progress
  eventPlanGoalProgress: {
    findByEventPlanId: async (eventPlanId: string, userId: string): Promise<EventPlanGoalProgress[]> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return [];

      const result = await client.execute({
        sql: 'SELECT * FROM event_plan_goal_progress WHERE eventPlanId = ?',
        args: [eventPlanId],
      });

      return result.rows.map((row: any) => ({
        id: row.id,
        eventPlanId: row.eventPlanId,
        goalType: row.goalType,
        status: row.status,
        completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
      }));
    },

    update: async (eventPlanId: string, goalType: string, status: EventPlanGoalProgress['status'], userId: string): Promise<EventPlanGoalProgress | null> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) return null;

      const now = status === 'completed' ? new Date() : null;

      await client.execute({
        sql: 'UPDATE event_plan_goal_progress SET status = ?, completedAt = ? WHERE eventPlanId = ? AND goalType = ?',
        args: [status, now?.toISOString() || null, eventPlanId, goalType],
      });

      const result = await client.execute({
        sql: 'SELECT * FROM event_plan_goal_progress WHERE eventPlanId = ? AND goalType = ?',
        args: [eventPlanId, goalType],
      });

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id as string,
        eventPlanId: row.eventPlanId as string,
        goalType: row.goalType as EventPlanGoalProgress['goalType'],
        status: row.status as EventPlanGoalProgress['status'],
        completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
      };
    },
  },

  // Event Plan Sync - for real-time collaborative updates
  eventPlanSync: {
    getChanges: async (eventPlanId: string, userId: string, lastSync: Date): Promise<{
      messages: EventPlanMessage[];
      polls: EventPlanPoll[];
      goalProgress: EventPlanGoalProgress[];
      eventPlanUpdated: boolean;
      lastUpdated: Date;
    }> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const eventPlanRow = accessCheck.rows[0];
      const eventPlanUpdatedAt = new Date(eventPlanRow.updatedAt as string);
      const eventPlanUpdated = eventPlanUpdatedAt > lastSync;

      // Get new messages
      const messagesResult = await client.execute({
        sql: 'SELECT * FROM event_plan_messages WHERE eventPlanId = ? AND createdAt > ? ORDER BY createdAt ASC',
        args: [eventPlanId, lastSync.toISOString()],
      });

      // Get recently updated polls
      const pollsWithRecentVotes = await client.execute({
        sql: `SELECT DISTINCT p.id FROM event_plan_polls p
              JOIN event_plan_poll_options o ON p.id = o.pollId
              JOIN event_plan_poll_votes v ON o.id = v.optionId
              WHERE p.eventPlanId = ? AND v.votedAt > ?`,
        args: [eventPlanId, lastSync.toISOString()],
      });

      const pollIdsWithVotes = pollsWithRecentVotes.rows.map((r: any) => r.id as string);

      const pollsResult = await client.execute({
        sql: 'SELECT * FROM event_plan_polls WHERE eventPlanId = ? AND (createdAt > ? OR closedAt > ?) ORDER BY createdAt DESC',
        args: [eventPlanId, lastSync.toISOString(), lastSync.toISOString()],
      });

      const allUpdatedPollIds = new Set<string>([
        ...pollsResult.rows.map((r: any) => r.id as string),
        ...pollIdsWithVotes,
      ]);

      const polls: any[] = [];
      for (const pollId of Array.from(allUpdatedPollIds)) {
        const pollResult = await client.execute({
          sql: 'SELECT * FROM event_plan_polls WHERE id = ?',
          args: [pollId],
        });

        if (pollResult.rows.length === 0) continue;
        const poll = pollResult.rows[0];

        const optionsResult = await client.execute({
          sql: 'SELECT * FROM event_plan_poll_options WHERE pollId = ? ORDER BY "order" ASC',
          args: [pollId],
        });

        const optionsWithVotes: any[] = [];
        for (const opt of optionsResult.rows) {
          // Join with users table to get voter profile information
          const votesResult = await client.execute({
            sql: `SELECT v.*, u.name as voterName, u.profileImage as voterProfileImage
                  FROM event_plan_poll_votes v
                  LEFT JOIN users u ON v.visitorId = u.id
                  WHERE v.optionId = ?`,
            args: [opt.id as string],
          });
          optionsWithVotes.push({
            id: opt.id,
            pollId: opt.pollId,
            label: opt.label,
            url: opt.url,
            order: opt.order,
            votes: votesResult.rows.map((v: any) => ({
              id: v.id,
              optionId: v.optionId,
              visitorId: v.visitorId,
              friendId: v.friendId,
              votedAt: new Date(v.votedAt as string),
              voterName: v.voterName,
              voterProfileImage: v.voterProfileImage,
            })),
          });
        }

        polls.push({
          id: poll.id,
          eventPlanId: poll.eventPlanId,
          context: poll.context,
          question: poll.question,
          status: poll.status,
          createdById: poll.createdById,
          createdAt: new Date(poll.createdAt as string),
          closedAt: poll.closedAt ? new Date(poll.closedAt as string) : null,
          options: optionsWithVotes,
        });
      }

      // Get goal progress
      const goalsResult = await client.execute({
        sql: 'SELECT * FROM event_plan_goal_progress WHERE eventPlanId = ?',
        args: [eventPlanId],
      });

      return {
        messages: messagesResult.rows.map((row: any) => ({
          id: row.id,
          eventPlanId: row.eventPlanId,
          userId: row.userId,
          friendId: row.friendId,
          context: row.context,
          role: row.role,
          content: row.content,
          toolResults: row.toolResults || null,
          createdAt: new Date(row.createdAt as string),
        })),
        polls,
        goalProgress: goalsResult.rows.map((row: any) => ({
          id: row.id,
          eventPlanId: row.eventPlanId,
          goalType: row.goalType,
          status: row.status,
          completedAt: row.completedAt ? new Date(row.completedAt as string) : null,
        })),
        eventPlanUpdated,
        lastUpdated: new Date(),
      };
    },
  },

  // Event Plan Presence - for typing indicators and active user tracking
  eventPlanPresence: {
    updateTyping: async (eventPlanId: string, userId: string, isTyping: boolean, context: string = 'general'): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const now = new Date().toISOString();

      await client.execute({
        sql: `INSERT INTO event_plan_presence (id, eventPlanId, userId, context, isTyping, lastSeen)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT (eventPlanId, userId) DO UPDATE SET
                context = excluded.context,
                isTyping = excluded.isTyping,
                lastSeen = excluded.lastSeen`,
        args: [randomUUID(), eventPlanId, userId, context, isTyping ? 1 : 0, now],
      });
    },

    updatePresence: async (eventPlanId: string, userId: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const now = new Date().toISOString();

      await client.execute({
        sql: `INSERT INTO event_plan_presence (id, eventPlanId, userId, context, isTyping, lastSeen)
              VALUES (?, ?, ?, 'general', 0, ?)
              ON CONFLICT (eventPlanId, userId) DO UPDATE SET
                lastSeen = excluded.lastSeen`,
        args: [randomUUID(), eventPlanId, userId, now],
      });
    },

    getTypingUsers: async (eventPlanId: string, userId: string, context?: string): Promise<{
      id: string;
      name: string;
    }[]> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();

      let sql = `SELECT p.userId, u.name
                 FROM event_plan_presence p
                 JOIN users u ON p.userId = u.id
                 WHERE p.eventPlanId = ? AND p.isTyping = 1 AND p.lastSeen > ?`;
      let args: any[] = [eventPlanId, fiveSecondsAgo];

      if (context) {
        sql += ' AND p.context = ?';
        args.push(context);
      }

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.userId as string,
        name: row.name as string,
      }));
    },

    getActiveUsers: async (eventPlanId: string, userId: string): Promise<{
      id: string;
      name: string;
      profileImage: string | null;
      lastSeen: Date;
    }[]> => {
      await ensureTablesExist();
      const client = getClient();

      const accessCheck = await client.execute({
        sql: `SELECT eps.* FROM event_plan_sessions eps
              LEFT JOIN event_plan_collaborators epc ON eps.id = epc.eventPlanId
              WHERE eps.id = ? AND (eps.userId = ? OR epc.userId = ?)`,
        args: [eventPlanId, userId, userId],
      });

      if (accessCheck.rows.length === 0) {
        throw new Error('Event plan not found or access denied');
      }

      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

      const result = await client.execute({
        sql: `SELECT p.userId, p.lastSeen, u.name, u.profileImage
              FROM event_plan_presence p
              JOIN users u ON p.userId = u.id
              WHERE p.eventPlanId = ? AND p.lastSeen > ?
              ORDER BY p.lastSeen DESC`,
        args: [eventPlanId, thirtySecondsAgo],
      });

      return result.rows.map((row: any) => ({
        id: row.userId as string,
        name: row.name as string,
        profileImage: row.profileImage as string | null,
        lastSeen: new Date(row.lastSeen as string),
      }));
    },

    cleanup: async (): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

      await client.execute({
        sql: 'DELETE FROM event_plan_presence WHERE lastSeen < ?',
        args: [oneMinuteAgo],
      });
    },
  },

  // Chat Notifications
  chatNotification: {
    // Create or update a chat notification for a recipient
    createOrUpdate: async (data: {
      recipientUserId: string;
      senderUserId: string;
      senderName: string;
      chatType: 'event_plan' | 'trip';
      chatId: string;
      chatTitle: string;
      messagePreview: string;
    }): Promise<ChatNotification> => {
      await ensureTablesExist();
      const client = getClient();
      const now = new Date().toISOString();

      // Try to update existing notification first (increment count)
      const existing = await client.execute({
        sql: `SELECT * FROM chat_notifications
              WHERE recipientUserId = ? AND chatType = ? AND chatId = ? AND isRead = 0`,
        args: [data.recipientUserId, data.chatType, data.chatId],
      });

      if (existing.rows.length > 0) {
        const row = existing.rows[0];
        const newCount = (Number(row.messageCount) || 1) + 1;

        await client.execute({
          sql: `UPDATE chat_notifications
                SET senderUserId = ?, senderName = ?, messagePreview = ?, messageCount = ?, updatedAt = ?
                WHERE id = ?`,
          args: [data.senderUserId, data.senderName, data.messagePreview, newCount, now, row.id],
        });

        return {
          id: row.id as string,
          recipientUserId: row.recipientUserId as string,
          senderUserId: data.senderUserId,
          senderName: data.senderName,
          chatType: row.chatType as 'event_plan' | 'trip',
          chatId: row.chatId as string,
          chatTitle: row.chatTitle as string,
          messagePreview: data.messagePreview,
          messageCount: newCount,
          isRead: false,
          createdAt: new Date(row.createdAt as string),
          updatedAt: new Date(now),
        };
      }

      // Create new notification
      const id = randomUUID();
      await client.execute({
        sql: `INSERT INTO chat_notifications (id, recipientUserId, senderUserId, senderName, chatType, chatId, chatTitle, messagePreview, messageCount, isRead, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
        args: [id, data.recipientUserId, data.senderUserId, data.senderName, data.chatType, data.chatId, data.chatTitle, data.messagePreview, now, now],
      });

      return {
        id,
        recipientUserId: data.recipientUserId,
        senderUserId: data.senderUserId,
        senderName: data.senderName,
        chatType: data.chatType,
        chatId: data.chatId,
        chatTitle: data.chatTitle,
        messagePreview: data.messagePreview,
        messageCount: 1,
        isRead: false,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      };
    },

    // Get unread chat notifications for a user
    findMany: async (userId: string, options?: { unreadOnly?: boolean }): Promise<ChatNotification[]> => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM chat_notifications WHERE recipientUserId = ?';
      const args: any[] = [userId];

      if (options?.unreadOnly) {
        sql += ' AND isRead = 0';
      }

      sql += ' ORDER BY updatedAt DESC';

      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        recipientUserId: row.recipientUserId as string,
        senderUserId: row.senderUserId as string,
        senderName: row.senderName as string,
        chatType: row.chatType as 'event_plan' | 'trip',
        chatId: row.chatId as string,
        chatTitle: row.chatTitle as string,
        messagePreview: row.messagePreview as string,
        messageCount: Number(row.messageCount) || 1,
        isRead: row.isRead === 1,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(row.updatedAt as string),
      }));
    },

    // Mark notifications as read for a specific chat
    markAsRead: async (userId: string, chatType: 'event_plan' | 'trip', chatId: string): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      await client.execute({
        sql: `UPDATE chat_notifications SET isRead = 1, updatedAt = ?
              WHERE recipientUserId = ? AND chatType = ? AND chatId = ?`,
        args: [new Date().toISOString(), userId, chatType, chatId],
      });
    },

    // Get unread count for a user
    getUnreadCount: async (userId: string): Promise<number> => {
      await ensureTablesExist();
      const client = getClient();

      const result = await client.execute({
        sql: `SELECT COUNT(*) as count FROM chat_notifications WHERE recipientUserId = ? AND isRead = 0`,
        args: [userId],
      });

      return Number(result.rows[0]?.count || 0);
    },

    // Delete old read notifications (cleanup)
    cleanup: async (): Promise<void> => {
      await ensureTablesExist();
      const client = getClient();

      // Delete read notifications older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      await client.execute({
        sql: 'DELETE FROM chat_notifications WHERE isRead = 1 AND updatedAt < ?',
        args: [sevenDaysAgo],
      });
    },
  },
};
