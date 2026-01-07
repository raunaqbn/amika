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
  itemType: 'memory' | 'note' | 'event';
  itemId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
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

let clientInstance: Client | null = null;
let tablesInitialized = false;

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

      const result = await client.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email.toLowerCase()],
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
        interests: row.interests as string | null,
        createdAt: new Date(row.createdAt as string),
      };
    },

    create: async (data: { email: string; password: string; name: string; birthday?: Date | null }): Promise<User> => {
      await ensureTablesExist();
      const client = getClient();

      const existing = await prisma.user.findByEmail(data.email);
      if (existing) {
        throw new Error('User with this email already exists');
      }

      const user: User = {
        id: randomUUID(),
        email: data.email.toLowerCase(),
        passwordHash: hashPassword(data.password),
        name: data.name,
        birthday: data.birthday ?? null,
        profileImage: null,
        interests: null,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO users (id, email, passwordHash, name, birthday, profileImage, interests, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          user.id,
          user.email,
          user.passwordHash,
          user.name,
          user.birthday ? user.birthday.toISOString() : null,
          user.profileImage,
          user.interests,
          user.createdAt.toISOString(),
        ],
      });

      return user;
    },

    update: async (id: string, data: { name?: string; birthday?: Date | null; profileImage?: string | null; interests?: string | null }): Promise<User> => {
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
        interests: data.interests !== undefined ? data.interests : existing.interests,
      };

      await client.execute({
        sql: 'UPDATE users SET name = ?, birthday = ?, profileImage = ?, interests = ? WHERE id = ?',
        args: [
          updated.name,
          updated.birthday ? updated.birthday.toISOString() : null,
          updated.profileImage,
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
        sql: 'INSERT INTO friends (id, userId, name, birthday, howWeMet, notes, interests, lastContact, profileImage, customProfileImage, linkedUserId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          newFriend.id,
          newFriend.userId,
          newFriend.name,
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
    update: async ({ where, data }: { where: { id: string; userId?: string }; data: Partial<Friend> }) => {
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
        sql: 'UPDATE friends SET name = ?, birthday = ?, howWeMet = ?, notes = ?, interests = ?, lastContact = ?, profileImage = ?, customProfileImage = ? WHERE id = ?',
        args: [
          updated.name,
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

      // Delete related events
      await client.execute({
        sql: 'DELETE FROM events WHERE friendId = ?',
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
  },

  // Shared items between users
  sharedItem: {
    // Share an item with a connected user
    create: async (data: { sharedByUserId: string; sharedWithUserId: string; itemType: 'memory' | 'note' | 'event'; itemId: string; message?: string }): Promise<SharedItem> => {
      await ensureTablesExist();
      const client = getClient();

      // Check if users are connected
      const connected = await prisma.userConnection.areConnected(data.sharedByUserId, data.sharedWithUserId);
      if (!connected) {
        throw new Error('You can only share with connected friends');
      }

      // Check if already shared
      const existing = await client.execute({
        sql: 'SELECT * FROM shared_items WHERE sharedByUserId = ? AND sharedWithUserId = ? AND itemType = ? AND itemId = ?',
        args: [data.sharedByUserId, data.sharedWithUserId, data.itemType, data.itemId],
      });

      if (existing.rows.length > 0) {
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
        }

        const sharedBy = userMap.get(row.sharedByUserId as string) || { id: row.sharedByUserId as string, name: 'Unknown', email: '', profileImage: null };
        const sharedWith = userMap.get(row.sharedWithUserId as string) || { id: row.sharedWithUserId as string, name: 'Unknown', email: '', profileImage: null };

        return {
          id: row.id as string,
          sharedByUserId: row.sharedByUserId as string,
          sharedWithUserId: row.sharedWithUserId as string,
          itemType: row.itemType as 'memory' | 'note' | 'event',
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
    getPendingCount: async (userId: string): Promise<{ connectionRequests: number; sharedItems: number }> => {
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

      return {
        connectionRequests: Number(connectionsResult.rows[0]?.count || 0),
        sharedItems: Number(sharedResult.rows[0]?.count || 0),
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
};
