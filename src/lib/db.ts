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
  visibility: 'private' | 'friends' | 'public';
  memoryDate: Date;
  sharedWithFriend: boolean; // Whether to share with linked Amika friend
  createdAt: Date;
};

type MemoryReaction = {
  id: string;
  memoryId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
};

type MemoryComment = {
  id: string;
  memoryId: string;
  userId: string;
  content: string;
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

type ChatTranscript = {
  id: string;
  userId: string;
  sessionId: string;
  role: string;
  content: string;
  createdAt: Date;
};

type DirectMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
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
  itemType: 'memory' | 'note';
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
  const addColumn = async (table: string, column: string, definition: string) => {
    try {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    } catch {
      // Existing installations may already have the column.
    }
  };

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        name TEXT NOT NULL,
        birthday TEXT,
        profileImage TEXT,
        phone TEXT,
        location TEXT,
        googleId TEXT,
        isTemporary INTEGER NOT NULL DEFAULT 0,
        interests TEXT,
        createdAt TEXT NOT NULL
      )
    `);

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
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        birthday TEXT,
        howWeMet TEXT,
        notes TEXT,
        interests TEXT,
        lastContact TEXT,
        profileImage TEXT,
        customProfileImage TEXT,
        linkedUserId TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        friendId TEXT,
        amikaFriendUserId TEXT,
        content TEXT NOT NULL,
        imageUrl TEXT,
        visibility TEXT NOT NULL DEFAULT 'friends',
        memoryDate TEXT,
        sharedWithFriend INTEGER NOT NULL DEFAULT 0,
        sharedWithAmikaFriend INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE SET NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS memory_reactions (
        id TEXT PRIMARY KEY,
        memoryId TEXT NOT NULL,
        userId TEXT NOT NULL,
        emoji TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        UNIQUE(memoryId, userId, emoji),
        FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS memory_comments (
        id TEXT PRIMARY KEY,
        memoryId TEXT NOT NULL,
        userId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id TEXT PRIMARY KEY,
        senderId TEXT NOT NULL,
        recipientId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        readAt TEXT,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipientId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS diary_notes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
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
        sharedWithFriend INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (noteId, friendId),
        FOREIGN KEY (noteId) REFERENCES diary_notes(id) ON DELETE CASCADE,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS diary_note_amika_tags (
        noteId TEXT NOT NULL,
        amikaFriendUserId TEXT NOT NULL,
        sharedWithAmikaFriend INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        PRIMARY KEY (noteId, amikaFriendUserId),
        FOREIGN KEY (noteId) REFERENCES diary_notes(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS chat_transcripts (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        sessionId TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_connections (
        id TEXT PRIMARY KEY,
        requesterId TEXT NOT NULL,
        addresseeId TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        UNIQUE(requesterId, addresseeId),
        FOREIGN KEY (requesterId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (addresseeId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS shared_items (
        id TEXT PRIMARY KEY,
        sharedByUserId TEXT NOT NULL,
        sharedWithUserId TEXT NOT NULL,
        itemType TEXT NOT NULL,
        itemId TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (sharedByUserId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sharedWithUserId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS friend_invites (
        id TEXT PRIMARY KEY,
        inviterId TEXT NOT NULL,
        inviteCode TEXT UNIQUE NOT NULL,
        inviteeName TEXT,
        inviteeEmail TEXT,
        status TEXT NOT NULL,
        acceptedByUserId TEXT,
        expiresAt TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (inviterId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await addColumn('users', 'phone', 'TEXT');
    await addColumn('users', 'location', 'TEXT');
    await addColumn('users', 'googleId', 'TEXT');
    await addColumn('users', 'isTemporary', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('users', 'interests', 'TEXT');
    await addColumn('friends', 'email', 'TEXT');
    await addColumn('friends', 'interests', 'TEXT');
    await addColumn('friends', 'profileImage', 'TEXT');
    await addColumn('friends', 'customProfileImage', 'TEXT');
    await addColumn('friends', 'linkedUserId', 'TEXT');
    await addColumn('memories', 'imageUrl', 'TEXT');
    await addColumn('memories', 'amikaFriendUserId', 'TEXT');
    await addColumn('memories', 'visibility', "TEXT NOT NULL DEFAULT 'friends'");
    await addColumn('memories', 'memoryDate', 'TEXT');
    await addColumn('memories', 'sharedWithFriend', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('memories', 'sharedWithAmikaFriend', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('diary_notes', 'analysis', 'TEXT');
    await addColumn('diary_notes', 'imageUrl', 'TEXT');
    await addColumn('diary_note_tags', 'sharedWithFriend', 'INTEGER NOT NULL DEFAULT 0');
    await addColumn('chat_transcripts', 'userId', 'TEXT');

    await client.execute('CREATE INDEX IF NOT EXISTS idx_memories_feed ON memories(visibility, createdAt)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_memories_user_date ON memories(userId, memoryDate)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_direct_messages_pair ON direct_messages(senderId, recipientId, createdAt)');
    await client.execute('CREATE INDEX IF NOT EXISTS idx_memory_comments_memory ON memory_comments(memoryId, createdAt)');
    tablesInitialized = true;
  } catch (error) {
    console.error('Error initializing memory-first database tables:', error);
    throw error;
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
          visibility: (row.visibility as Memory['visibility']) || (Boolean(row.sharedWithFriend) ? 'friends' : 'private'),
          memoryDate: new Date((row.memoryDate as string) || (row.createdAt as string)),
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
      const sqlArgs: any[] = [where.id];
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
      const sqlArgs: any[] = [where.id];
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
        visibility: (row.visibility as Memory['visibility']) || (Boolean(row.sharedWithFriend) ? 'friends' : 'private'),
        memoryDate: new Date((row.memoryDate as string) || (row.createdAt as string)),
        sharedWithFriend: Boolean(row.sharedWithFriend),
        createdAt: new Date(row.createdAt as string),
        friend: friendMap.get(row.friendId as string) || null,
      }));
    },
    findFeed: async ({ userId, scope = 'friends' }: { userId: string; scope?: 'friends' | 'public' }) => {
      await ensureTablesExist();
      const client = getClient();

      const visibilitySql = `COALESCE(m.visibility, CASE WHEN m.sharedWithFriend = 1 THEN 'friends' ELSE 'private' END)`;
      const sql = scope === 'public'
        ? `SELECT m.*, u.name AS authorName, u.profileImage AS authorImage,
                  f.name AS friendName, f.profileImage AS friendImage,
                  (SELECT COUNT(*) FROM memory_reactions mr WHERE mr.memoryId = m.id) AS reactionCount,
                  (SELECT COUNT(*) FROM memory_comments mc WHERE mc.memoryId = m.id) AS commentCount,
                  EXISTS(SELECT 1 FROM memory_reactions mine WHERE mine.memoryId = m.id AND mine.userId = ?) AS reactedByMe
           FROM memories m
           JOIN users u ON u.id = m.userId
           LEFT JOIN friends f ON f.id = m.friendId
           WHERE ${visibilitySql} = 'public'
           ORDER BY COALESCE(m.memoryDate, m.createdAt) DESC`
        : `SELECT m.*, u.name AS authorName, u.profileImage AS authorImage,
                  f.name AS friendName, f.profileImage AS friendImage,
                  (SELECT COUNT(*) FROM memory_reactions mr WHERE mr.memoryId = m.id) AS reactionCount,
                  (SELECT COUNT(*) FROM memory_comments mc WHERE mc.memoryId = m.id) AS commentCount,
                  EXISTS(SELECT 1 FROM memory_reactions mine WHERE mine.memoryId = m.id AND mine.userId = ?) AS reactedByMe
           FROM memories m
           JOIN users u ON u.id = m.userId
           LEFT JOIN friends f ON f.id = m.friendId
           WHERE m.userId = ?
              OR (
                ${visibilitySql} IN ('friends', 'public')
                AND m.userId IN (
                  SELECT CASE WHEN requesterId = ? THEN addresseeId ELSE requesterId END
                  FROM user_connections
                  WHERE status = 'accepted' AND (requesterId = ? OR addresseeId = ?)
                )
              )
           ORDER BY COALESCE(m.memoryDate, m.createdAt) DESC`;

      const args = scope === 'public'
        ? [userId]
        : [userId, userId, userId, userId, userId];
      const result = await client.execute({ sql, args });

      return result.rows.map((row: any) => ({
        id: row.id as string,
        userId: row.userId as string,
        friendId: row.friendId as string | null,
        content: row.content as string,
        imageUrl: row.imageUrl as string | null,
        visibility: (row.visibility as Memory['visibility']) || (Boolean(row.sharedWithFriend) ? 'friends' : 'private'),
        memoryDate: new Date((row.memoryDate as string) || (row.createdAt as string)),
        sharedWithFriend: Boolean(row.sharedWithFriend),
        createdAt: new Date(row.createdAt as string),
        author: {
          id: row.userId as string,
          name: row.authorName as string,
          profileImage: row.authorImage as string | null,
        },
        friend: row.friendId ? {
          id: row.friendId as string,
          name: row.friendName as string,
          profileImage: row.friendImage as string | null,
        } : null,
        reactionCount: Number(row.reactionCount || 0),
        commentCount: Number(row.commentCount || 0),
        reactedByMe: Boolean(row.reactedByMe),
        isOwn: row.userId === userId,
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
        visibility: (row.visibility as Memory['visibility']) || (Boolean(row.sharedWithFriend) ? 'friends' : 'private'),
        memoryDate: new Date((row.memoryDate as string) || (row.createdAt as string)),
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
    create: async ({ data }: { data: { userId: string; friendId: string; content: string; imageUrl?: string | null; visibility?: Memory['visibility']; memoryDate?: Date; sharedWithFriend?: boolean } }) => {
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
        visibility: data.visibility ?? (data.sharedWithFriend ? 'friends' : 'private'),
        memoryDate: data.memoryDate ?? new Date(),
        sharedWithFriend: data.sharedWithFriend ?? (data.visibility === 'friends' || data.visibility === 'public'),
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO memories (id, userId, friendId, content, imageUrl, visibility, memoryDate, sharedWithFriend, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          memory.id,
          memory.userId,
          memory.friendId,
          memory.content,
          memory.imageUrl,
          memory.visibility,
          memory.memoryDate.toISOString(),
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
    update: async ({ where, data }: { where: { id: string; userId?: string }; data: { content?: string; imageUrl?: string | null; visibility?: Memory['visibility']; memoryDate?: Date; sharedWithFriend?: boolean } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM memories WHERE id = ?';
      const sqlArgs: any[] = [where.id];
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
        visibility: data.visibility ?? ((existing.visibility as Memory['visibility']) || (Boolean(existing.sharedWithFriend) ? 'friends' : 'private')),
        memoryDate: data.memoryDate ?? new Date((existing.memoryDate as string) || (existing.createdAt as string)),
        sharedWithFriend: data.sharedWithFriend !== undefined ? data.sharedWithFriend : Boolean(existing.sharedWithFriend),
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE memories SET content = ?, imageUrl = ?, visibility = ?, memoryDate = ?, sharedWithFriend = ? WHERE id = ?',
        args: [updated.content, updated.imageUrl, updated.visibility, updated.memoryDate.toISOString(), updated.sharedWithFriend ? 1 : 0, where.id],
      });

      return updated;
    },
    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      let sql = 'SELECT * FROM memories WHERE id = ?';
      const sqlArgs: any[] = [where.id];
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
  memoryReaction: {
    toggle: async ({ memoryId, userId, emoji = 'heart' }: { memoryId: string; userId: string; emoji?: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const visible = await client.execute({
        sql: "SELECT m.id FROM memories m WHERE m.id = ? AND (m.userId = ? OR m.visibility = 'public' OR (m.visibility = 'friends' AND EXISTS (SELECT 1 FROM user_connections uc WHERE uc.status = 'accepted' AND ((uc.requesterId = m.userId AND uc.addresseeId = ?) OR (uc.addresseeId = m.userId AND uc.requesterId = ?)))))",
        args: [memoryId, userId, userId, userId],
      });
      if (visible.rows.length === 0) throw new Error('Memory not found');

      const existing = await client.execute({
        sql: 'SELECT id FROM memory_reactions WHERE memoryId = ? AND userId = ? AND emoji = ?',
        args: [memoryId, userId, emoji],
      });
      if (existing.rows.length > 0) {
        await client.execute({ sql: 'DELETE FROM memory_reactions WHERE id = ?', args: [existing.rows[0].id as string] });
        return { active: false };
      }

      const reaction: MemoryReaction = { id: randomUUID(), memoryId, userId, emoji, createdAt: new Date() };
      await client.execute({
        sql: 'INSERT INTO memory_reactions (id, memoryId, userId, emoji, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [reaction.id, reaction.memoryId, reaction.userId, reaction.emoji, reaction.createdAt.toISOString()],
      });
      return { active: true };
    },
  },

  memoryComment: {
    findMany: async ({ memoryId, userId }: { memoryId: string; userId: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const visible = await client.execute({
        sql: "SELECT m.id FROM memories m WHERE m.id = ? AND (m.userId = ? OR m.visibility = 'public' OR (m.visibility = 'friends' AND EXISTS (SELECT 1 FROM user_connections uc WHERE uc.status = 'accepted' AND ((uc.requesterId = m.userId AND uc.addresseeId = ?) OR (uc.addresseeId = m.userId AND uc.requesterId = ?)))))",
        args: [memoryId, userId, userId, userId],
      });
      if (visible.rows.length === 0) throw new Error('Memory not found');
      const result = await client.execute({
        sql: 'SELECT mc.*, u.name AS userName, u.profileImage AS userProfileImage FROM memory_comments mc JOIN users u ON u.id = mc.userId WHERE mc.memoryId = ? ORDER BY mc.createdAt ASC',
        args: [memoryId],
      });
      return result.rows.map((row: any) => ({
        id: row.id as string,
        memoryId: row.memoryId as string,
        userId: row.userId as string,
        content: row.content as string,
        createdAt: new Date(row.createdAt as string),
        author: { id: row.userId as string, name: row.userName as string, profileImage: row.userProfileImage as string | null },
      }));
    },
    create: async ({ memoryId, userId, content }: { memoryId: string; userId: string; content: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const visible = await client.execute({
        sql: "SELECT m.id FROM memories m WHERE m.id = ? AND (m.userId = ? OR m.visibility = 'public' OR (m.visibility = 'friends' AND EXISTS (SELECT 1 FROM user_connections uc WHERE uc.status = 'accepted' AND ((uc.requesterId = m.userId AND uc.addresseeId = ?) OR (uc.addresseeId = m.userId AND uc.requesterId = ?)))))",
        args: [memoryId, userId, userId, userId],
      });
      if (visible.rows.length === 0) throw new Error('Memory not found');

      const comment: MemoryComment = { id: randomUUID(), memoryId, userId, content, createdAt: new Date() };
      await client.execute({
        sql: 'INSERT INTO memory_comments (id, memoryId, userId, content, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [comment.id, comment.memoryId, comment.userId, comment.content, comment.createdAt.toISOString()],
      });
      return comment;
    },
  },

  directMessage: {
    listThreads: async (userId: string) => {
      await ensureTablesExist();
      const client = getClient();
      const connections = await prisma.userConnection.findAcceptedConnections(userId);
      const threads = await Promise.all(connections.map(async (friend: any) => {
        const last = await client.execute({
          sql: 'SELECT content, createdAt FROM direct_messages WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?) ORDER BY createdAt DESC LIMIT 1',
          args: [userId, friend.id, friend.id, userId],
        });
        const unread = await client.execute({
          sql: 'SELECT COUNT(*) AS count FROM direct_messages WHERE senderId = ? AND recipientId = ? AND readAt IS NULL',
          args: [friend.id, userId],
        });
        return {
          id: friend.id,
          name: friend.name,
          email: friend.email,
          profileImage: friend.profileImage,
          lastMessage: last.rows[0]?.content as string | null || null,
          lastMessageAt: last.rows[0]?.createdAt as string | null || null,
          unreadCount: Number(unread.rows[0]?.count || 0),
        };
      }));
      return threads.sort((a, b) => {
        if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;
        return new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime();
      });
    },
    findConversation: async ({ userId, otherUserId }: { userId: string; otherUserId: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({
        sql: 'SELECT dm.*, u.name AS senderName, u.profileImage AS senderImage FROM direct_messages dm JOIN users u ON u.id = dm.senderId WHERE (dm.senderId = ? AND dm.recipientId = ?) OR (dm.senderId = ? AND dm.recipientId = ?) ORDER BY dm.createdAt ASC',
        args: [userId, otherUserId, otherUserId, userId],
      });
      await client.execute({
        sql: 'UPDATE direct_messages SET readAt = ? WHERE senderId = ? AND recipientId = ? AND readAt IS NULL',
        args: [new Date().toISOString(), otherUserId, userId],
      });
      return result.rows.map((row: any) => ({
        id: row.id as string,
        senderId: row.senderId as string,
        recipientId: row.recipientId as string,
        content: row.content as string,
        createdAt: new Date(row.createdAt as string),
        readAt: row.readAt ? new Date(row.readAt as string) : null,
        sender: { id: row.senderId as string, name: row.senderName as string, profileImage: row.senderImage as string | null },
      }));
    },
    create: async ({ senderId, recipientId, content }: { senderId: string; recipientId: string; content: string }) => {
      await ensureTablesExist();
      if (!(await prisma.userConnection.areConnected(senderId, recipientId))) throw new Error('You can only message friends.');
      const client = getClient();
      const message: DirectMessage = { id: randomUUID(), senderId, recipientId, content, createdAt: new Date(), readAt: null };
      await client.execute({
        sql: 'INSERT INTO direct_messages (id, senderId, recipientId, content, createdAt, readAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [message.id, message.senderId, message.recipientId, message.content, message.createdAt.toISOString(), null],
      });
      return message;
    },
  },

  diaryNote: {
    findMany: async ({ userId }: { userId: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({ sql: 'SELECT * FROM diary_notes WHERE userId = ? ORDER BY createdAt DESC', args: [userId] });
      return Promise.all(result.rows.map(async (row: any) => {
        const tags = await client.execute({
          sql: 'SELECT f.*, dnt.sharedWithFriend FROM diary_note_tags dnt JOIN friends f ON f.id = dnt.friendId WHERE dnt.noteId = ?',
          args: [row.id as string],
        });
        return {
          id: row.id as string,
          userId: row.userId as string,
          title: row.title as string | null,
          content: row.content as string,
          analysis: row.analysis as string | null,
          imageUrl: row.imageUrl as string | null,
          createdAt: new Date(row.createdAt as string),
          updatedAt: new Date(row.updatedAt as string),
          friends: tags.rows.map((tag: any) => ({
            id: tag.id as string,
            name: tag.name as string,
            profileImage: tag.profileImage as string | null,
            customProfileImage: tag.customProfileImage as string | null,
            linkedUserId: tag.linkedUserId as string | null,
            sharedWithFriend: Boolean(tag.sharedWithFriend),
          })),
        };
      }));
    },
    create: async ({ data }: { data: { userId: string; title?: string | null; content: string; analysis?: string | null; imageUrl?: string | null; friendIds?: string[]; friendTags?: { friendId: string; sharedWithFriend?: boolean }[] } }) => {
      await ensureTablesExist();
      const client = getClient();
      const now = new Date();
      const note: DiaryNote = {
        id: randomUUID(), userId: data.userId, title: data.title ?? null, content: data.content,
        analysis: data.analysis ?? null, imageUrl: data.imageUrl ?? null, createdAt: now, updatedAt: now,
      };
      await client.execute({
        sql: 'INSERT INTO diary_notes (id, userId, title, content, analysis, imageUrl, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [note.id, note.userId, note.title, note.content, note.analysis, note.imageUrl, now.toISOString(), now.toISOString()],
      });
      const tags = data.friendTags ?? (data.friendIds || []).map(friendId => ({ friendId, sharedWithFriend: false }));
      for (const tag of tags) {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO diary_note_tags (noteId, friendId, sharedWithFriend, createdAt) VALUES (?, ?, ?, ?)',
          args: [note.id, tag.friendId, tag.sharedWithFriend ? 1 : 0, now.toISOString()],
        });
      }
      return note;
    },
    update: async ({ where, data }: { where: { id: string; userId: string }; data: { title?: string | null; content?: string; analysis?: string | null; imageUrl?: string | null; friendIds?: string[] } }) => {
      await ensureTablesExist();
      const client = getClient();
      const existingResult = await client.execute({ sql: 'SELECT * FROM diary_notes WHERE id = ? AND userId = ?', args: [where.id, where.userId] });
      if (existingResult.rows.length === 0) throw new Error('Note not found');
      const row = existingResult.rows[0];
      const note: DiaryNote = {
        id: row.id as string,
        userId: row.userId as string,
        title: data.title !== undefined ? data.title : row.title as string | null,
        content: data.content !== undefined ? data.content : row.content as string,
        analysis: data.analysis !== undefined ? data.analysis : row.analysis as string | null,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl : row.imageUrl as string | null,
        createdAt: new Date(row.createdAt as string),
        updatedAt: new Date(),
      };
      await client.execute({
        sql: 'UPDATE diary_notes SET title = ?, content = ?, analysis = ?, imageUrl = ?, updatedAt = ? WHERE id = ? AND userId = ?',
        args: [note.title, note.content, note.analysis, note.imageUrl, note.updatedAt.toISOString(), where.id, where.userId],
      });
      if (data.friendIds) {
        await client.execute({ sql: 'DELETE FROM diary_note_tags WHERE noteId = ?', args: [where.id] });
        for (const friendId of data.friendIds) {
          await client.execute({
            sql: 'INSERT INTO diary_note_tags (noteId, friendId, sharedWithFriend, createdAt) VALUES (?, ?, ?, ?)',
            args: [where.id, friendId, 0, note.updatedAt.toISOString()],
          });
        }
      }
      return note;
    },
    delete: async ({ where }: { where: { id: string; userId?: string } }) => {
      await ensureTablesExist();
      const client = getClient();
      const existing = await client.execute({
        sql: where.userId ? 'SELECT id FROM diary_notes WHERE id = ? AND userId = ?' : 'SELECT id FROM diary_notes WHERE id = ?',
        args: where.userId ? [where.id, where.userId] : [where.id],
      });
      if (existing.rows.length === 0) throw new Error('Note not found');
      await client.execute({ sql: 'DELETE FROM diary_note_tags WHERE noteId = ?', args: [where.id] });
      await client.execute({ sql: 'DELETE FROM diary_note_amika_tags WHERE noteId = ?', args: [where.id] });
      await client.execute({ sql: 'DELETE FROM diary_notes WHERE id = ?', args: [where.id] });
      return { success: true };
    },
    findManyByAmikaFriend: async ({ userId, amikaFriendUserId }: { userId: string; amikaFriendUserId: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({
        sql: 'SELECT dn.*, dnat.sharedWithAmikaFriend FROM diary_notes dn JOIN diary_note_amika_tags dnat ON dn.id = dnat.noteId WHERE dn.userId = ? AND dnat.amikaFriendUserId = ? ORDER BY dn.createdAt DESC',
        args: [userId, amikaFriendUserId],
      });
      return result.rows.map((row: any) => ({
        id: row.id as string, userId: row.userId as string, title: row.title as string | null,
        content: row.content as string, analysis: row.analysis as string | null, imageUrl: row.imageUrl as string | null,
        sharedWithAmikaFriend: Boolean(row.sharedWithAmikaFriend), createdAt: new Date(row.createdAt as string), updatedAt: new Date(row.updatedAt as string),
      }));
    },
    createForAmikaFriend: async ({ data }: { data: { userId: string; amikaFriendUserId: string; title?: string | null; content: string; analysis?: string | null; imageUrl?: string | null; sharedWithAmikaFriend?: boolean } }) => {
      await ensureTablesExist();
      if (!(await prisma.userConnection.areConnected(data.userId, data.amikaFriendUserId))) throw new Error('Not connected with this Amika friend');
      const client = getClient();
      const note = await prisma.diaryNote.create({ data: {
        userId: data.userId, title: data.title, content: data.content, analysis: data.analysis, imageUrl: data.imageUrl,
      }});
      await client.execute({
        sql: 'INSERT INTO diary_note_amika_tags (noteId, amikaFriendUserId, sharedWithAmikaFriend, createdAt) VALUES (?, ?, ?, ?)',
        args: [note.id, data.amikaFriendUserId, data.sharedWithAmikaFriend ? 1 : 0, new Date().toISOString()],
      });
      return { ...note, amikaFriendUserId: data.amikaFriendUserId, sharedWithAmikaFriend: Boolean(data.sharedWithAmikaFriend) };
    },
    updateAmikaFriendSharing: async ({ where, sharedWithAmikaFriend }: { where: { noteId: string; amikaFriendUserId: string; userId: string }; sharedWithAmikaFriend: boolean }) => {
      await ensureTablesExist();
      const client = getClient();
      const note = await client.execute({ sql: 'SELECT id FROM diary_notes WHERE id = ? AND userId = ?', args: [where.noteId, where.userId] });
      if (note.rows.length === 0) throw new Error('Note not found');
      await client.execute({
        sql: 'UPDATE diary_note_amika_tags SET sharedWithAmikaFriend = ? WHERE noteId = ? AND amikaFriendUserId = ?',
        args: [sharedWithAmikaFriend ? 1 : 0, where.noteId, where.amikaFriendUserId],
      });
      return { success: true };
    },
  },

  chatTranscript: {
    create: async ({ data }: { data: { userId: string; sessionId: string; role: string; content: string } }) => {
      await ensureTablesExist();
      const client = getClient();
      const transcript: ChatTranscript = { id: randomUUID(), ...data, createdAt: new Date() };
      await client.execute({
        sql: 'INSERT INTO chat_transcripts (id, userId, sessionId, role, content, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [transcript.id, transcript.userId, transcript.sessionId, transcript.role, transcript.content, transcript.createdAt.toISOString()],
      });
      return transcript;
    },
    findMany: async ({ userId, sessionId }: { userId: string; sessionId?: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({
        sql: sessionId ? 'SELECT * FROM chat_transcripts WHERE userId = ? AND sessionId = ? ORDER BY createdAt ASC' : 'SELECT * FROM chat_transcripts WHERE userId = ? ORDER BY createdAt ASC',
        args: sessionId ? [userId, sessionId] : [userId],
      });
      return result.rows;
    },
  },

  getUserStats: async (userId: string) => {
    await ensureTablesExist();
    const client = getClient();
    const [friends, memories, diary] = await Promise.all([
      client.execute({ sql: 'SELECT COUNT(*) AS count FROM friends WHERE userId = ?', args: [userId] }),
      client.execute({ sql: 'SELECT COUNT(*) AS count FROM memories WHERE userId = ?', args: [userId] }),
      client.execute({ sql: 'SELECT COUNT(*) AS count FROM diary_notes WHERE userId = ?', args: [userId] }),
    ]);
    return {
      friendsCount: Number(friends.rows[0]?.count || 0),
      memoriesCount: Number(memories.rows[0]?.count || 0),
      diaryCount: Number(diary.rows[0]?.count || 0),
    };
  },

  getFriendStats: async (userId: string, friendId: string) => {
    await ensureTablesExist();
    const client = getClient();
    const [memories, diary, friend] = await Promise.all([
      client.execute({ sql: 'SELECT COUNT(*) AS count FROM memories WHERE userId = ? AND friendId = ?', args: [userId, friendId] }),
      client.execute({ sql: 'SELECT COUNT(DISTINCT dn.id) AS count FROM diary_notes dn JOIN diary_note_tags dnt ON dn.id = dnt.noteId WHERE dn.userId = ? AND dnt.friendId = ?', args: [userId, friendId] }),
      client.execute({ sql: 'SELECT lastContact FROM friends WHERE id = ? AND userId = ?', args: [friendId, userId] }),
    ]);
    const lastContact = friend.rows[0]?.lastContact ? new Date(friend.rows[0].lastContact as string) : null;
    const daysSinceLastContact = lastContact ? Math.floor((Date.now() - lastContact.getTime()) / 86400000) : null;
    return {
      memoriesCount: Number(memories.rows[0]?.count || 0),
      diaryCount: Number(diary.rows[0]?.count || 0),
      lastContact,
      daysSinceLastContact,
    };
  },

  migrateDataToUser: async (userId: string) => {
    await ensureTablesExist();
    const client = getClient();
    await client.execute({ sql: 'UPDATE friends SET userId = ? WHERE userId IS NULL', args: [userId] });
    await client.execute({ sql: 'UPDATE memories SET userId = ? WHERE userId IS NULL', args: [userId] });
    await client.execute({ sql: 'UPDATE diary_notes SET userId = ? WHERE userId IS NULL', args: [userId] });
    await client.execute({ sql: 'UPDATE chat_transcripts SET userId = ? WHERE userId IS NULL', args: [userId] });
    return { success: true };
  },

  userConnection: {
    create: async (data: { requesterId: string; addresseeId: string }): Promise<UserConnection> => {
      await ensureTablesExist();
      if (data.requesterId === data.addresseeId) throw new Error('You cannot add yourself');
      const client = getClient();
      const existing = await client.execute({
        sql: 'SELECT * FROM user_connections WHERE (requesterId = ? AND addresseeId = ?) OR (requesterId = ? AND addresseeId = ?)',
        args: [data.requesterId, data.addresseeId, data.addresseeId, data.requesterId],
      });
      if (existing.rows.length > 0) throw new Error('A connection already exists');
      const connection: UserConnection = { id: randomUUID(), ...data, status: 'pending', createdAt: new Date() };
      await client.execute({
        sql: 'INSERT INTO user_connections (id, requesterId, addresseeId, status, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [connection.id, connection.requesterId, connection.addresseeId, connection.status, connection.createdAt.toISOString()],
      });
      return connection;
    },
    findMany: async ({ userId, type = 'all', status }: { userId: string; type?: 'sent' | 'received' | 'all'; status?: string }) => {
      await ensureTablesExist();
      const client = getClient();
      let sql = type === 'sent' ? 'SELECT * FROM user_connections WHERE requesterId = ?' : type === 'received' ? 'SELECT * FROM user_connections WHERE addresseeId = ?' : 'SELECT * FROM user_connections WHERE requesterId = ? OR addresseeId = ?';
      const args: any[] = type === 'all' ? [userId, userId] : [userId];
      if (status) { sql += ' AND status = ?'; args.push(status); }
      sql += ' ORDER BY createdAt DESC';
      const result = await client.execute({ sql, args });
      return Promise.all(result.rows.map(async (row: any) => {
        const otherId = row.requesterId === userId ? row.addresseeId as string : row.requesterId as string;
        const other = await prisma.user.findById(otherId);
        return {
          id: row.id as string, requesterId: row.requesterId as string, addresseeId: row.addresseeId as string,
          status: row.status as UserConnection['status'], createdAt: new Date(row.createdAt as string), otherUser: other,
        };
      }));
    },
    findAcceptedConnections: async (userId: string) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({
        sql: "SELECT u.id, u.name, u.email, u.profileImage, u.birthday, u.interests, uc.createdAt FROM user_connections uc JOIN users u ON u.id = CASE WHEN uc.requesterId = ? THEN uc.addresseeId ELSE uc.requesterId END WHERE uc.status = 'accepted' AND (uc.requesterId = ? OR uc.addresseeId = ?) ORDER BY uc.createdAt DESC",
        args: [userId, userId, userId],
      });
      return result.rows.map((row: any) => ({
        id: row.id as string, name: row.name as string, email: row.email as string,
        profileImage: row.profileImage as string | null, birthday: row.birthday ? new Date(row.birthday as string) : null,
        interests: row.interests as string | null, createdAt: new Date(row.createdAt as string),
      }));
    },
    update: async ({ id, userId, status }: { id: string; userId: string; status: 'accepted' | 'rejected' }) => {
      await ensureTablesExist();
      const client = getClient();
      const existing = await client.execute({ sql: 'SELECT * FROM user_connections WHERE id = ? AND addresseeId = ?', args: [id, userId] });
      if (existing.rows.length === 0) throw new Error('Connection request not found');
      await client.execute({ sql: 'UPDATE user_connections SET status = ? WHERE id = ?', args: [status, id] });
      return { ...existing.rows[0], status };
    },
    delete: async ({ id, userId }: { id: string; userId: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const existing = await client.execute({ sql: 'SELECT id FROM user_connections WHERE id = ? AND (requesterId = ? OR addresseeId = ?)', args: [id, userId, userId] });
      if (existing.rows.length === 0) throw new Error('Connection not found');
      await client.execute({ sql: 'DELETE FROM user_connections WHERE id = ?', args: [id] });
      return { success: true };
    },
    rejectAllPending: async (userId: string) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({ sql: "UPDATE user_connections SET status = 'rejected' WHERE addresseeId = ? AND status = 'pending'", args: [userId] });
      return { count: result.rowsAffected };
    },
    areConnected: async (userId1: string, userId2: string) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({
        sql: "SELECT id FROM user_connections WHERE status = 'accepted' AND ((requesterId = ? AND addresseeId = ?) OR (requesterId = ? AND addresseeId = ?))",
        args: [userId1, userId2, userId2, userId1],
      });
      return result.rows.length > 0;
    },
    deleteConnection: async (userId1: string, userId2: string) => {
      await ensureTablesExist();
      const client = getClient();
      await client.execute({
        sql: 'DELETE FROM user_connections WHERE (requesterId = ? AND addresseeId = ?) OR (requesterId = ? AND addresseeId = ?)',
        args: [userId1, userId2, userId2, userId1],
      });
      return { success: true };
    },
  },

  sharedItem: {
    create: async (data: { sharedByUserId: string; sharedWithUserId: string; itemType: 'memory' | 'note'; itemId: string; message?: string }): Promise<SharedItem> => {
      await ensureTablesExist();
      if (!(await prisma.userConnection.areConnected(data.sharedByUserId, data.sharedWithUserId))) throw new Error('You can only share with connected friends');
      const client = getClient();
      const existing = await client.execute({
        sql: 'SELECT id FROM shared_items WHERE sharedByUserId = ? AND sharedWithUserId = ? AND itemType = ? AND itemId = ?',
        args: [data.sharedByUserId, data.sharedWithUserId, data.itemType, data.itemId],
      });
      if (existing.rows.length > 0) throw new Error('Item already shared with this user');
      const item: SharedItem = {
        id: randomUUID(), sharedByUserId: data.sharedByUserId, sharedWithUserId: data.sharedWithUserId,
        itemType: data.itemType, itemId: data.itemId, status: 'pending', message: data.message || null, createdAt: new Date(),
      };
      await client.execute({
        sql: 'INSERT INTO shared_items (id, sharedByUserId, sharedWithUserId, itemType, itemId, status, message, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [item.id, item.sharedByUserId, item.sharedWithUserId, item.itemType, item.itemId, item.status, item.message, item.createdAt.toISOString()],
      });
      return item;
    },
    findMany: async (args: { userId: string; type?: 'sent' | 'received'; status?: string; itemType?: string }) => {
      await ensureTablesExist();
      const client = getClient();
      let sql = args.type === 'sent' ? 'SELECT * FROM shared_items WHERE sharedByUserId = ?' : args.type === 'received' ? 'SELECT * FROM shared_items WHERE sharedWithUserId = ?' : 'SELECT * FROM shared_items WHERE sharedByUserId = ? OR sharedWithUserId = ?';
      const sqlArgs: any[] = args.type ? [args.userId] : [args.userId, args.userId];
      if (args.status) { sql += ' AND status = ?'; sqlArgs.push(args.status); }
      if (args.itemType) { sql += ' AND itemType = ?'; sqlArgs.push(args.itemType); }
      sql += ' ORDER BY createdAt DESC';
      const result = await client.execute({ sql, args: sqlArgs });
      return Promise.all(result.rows.map(async (row: any) => {
        const [sharedBy, sharedWith] = await Promise.all([
          prisma.user.findById(row.sharedByUserId as string),
          prisma.user.findById(row.sharedWithUserId as string),
        ]);
        let item: any = null;
        if (row.itemType === 'memory') {
          const found = await client.execute({ sql: 'SELECT id, content, imageUrl, createdAt FROM memories WHERE id = ?', args: [row.itemId as string] });
          if (found.rows[0]) item = { ...found.rows[0], createdAt: new Date(found.rows[0].createdAt as string) };
        } else if (row.itemType === 'note') {
          const found = await client.execute({ sql: 'SELECT id, title, content, imageUrl, createdAt FROM diary_notes WHERE id = ?', args: [row.itemId as string] });
          if (found.rows[0]) item = { ...found.rows[0], createdAt: new Date(found.rows[0].createdAt as string) };
        }
        return {
          id: row.id as string, sharedByUserId: row.sharedByUserId as string, sharedWithUserId: row.sharedWithUserId as string,
          itemType: row.itemType as SharedItem['itemType'], itemId: row.itemId as string, status: row.status as SharedItem['status'],
          message: row.message as string | null, createdAt: new Date(row.createdAt as string),
          sharedBy: sharedBy || { id: row.sharedByUserId as string, name: 'Unknown', email: '', profileImage: null },
          sharedWith: sharedWith || { id: row.sharedWithUserId as string, name: 'Unknown', email: '', profileImage: null },
          item,
        };
      }));
    },
    update: async ({ id, userId, status }: { id: string; userId: string; status: 'accepted' | 'rejected' }): Promise<SharedItem> => {
      await ensureTablesExist();
      const client = getClient();
      const existing = await client.execute({ sql: 'SELECT * FROM shared_items WHERE id = ? AND sharedWithUserId = ?', args: [id, userId] });
      if (existing.rows.length === 0) throw new Error('Shared item not found or unauthorized');
      await client.execute({ sql: 'UPDATE shared_items SET status = ? WHERE id = ?', args: [status, id] });
      const row = existing.rows[0];
      return {
        id: row.id as string, sharedByUserId: row.sharedByUserId as string, sharedWithUserId: row.sharedWithUserId as string,
        itemType: row.itemType as SharedItem['itemType'], itemId: row.itemId as string, status,
        message: row.message as string | null, createdAt: new Date(row.createdAt as string),
      };
    },
    delete: async ({ id, userId }: { id: string; userId: string }) => {
      await ensureTablesExist();
      const client = getClient();
      const existing = await client.execute({ sql: 'SELECT id FROM shared_items WHERE id = ? AND (sharedByUserId = ? OR sharedWithUserId = ?)', args: [id, userId, userId] });
      if (existing.rows.length === 0) throw new Error('Shared item not found');
      await client.execute({ sql: 'DELETE FROM shared_items WHERE id = ?', args: [id] });
      return { success: true };
    },
    rejectAllPending: async (userId: string) => {
      await ensureTablesExist();
      const client = getClient();
      const result = await client.execute({ sql: "UPDATE shared_items SET status = 'rejected' WHERE sharedWithUserId = ? AND status = 'pending'", args: [userId] });
      return { count: result.rowsAffected };
    },
    getPendingCount: async (userId: string) => {
      await ensureTablesExist();
      const client = getClient();
      const [connections, shared, messages] = await Promise.all([
        client.execute({ sql: "SELECT COUNT(*) AS count FROM user_connections WHERE addresseeId = ? AND status = 'pending'", args: [userId] }),
        client.execute({ sql: "SELECT COUNT(*) AS count FROM shared_items WHERE sharedWithUserId = ? AND status = 'pending'", args: [userId] }),
        client.execute({ sql: 'SELECT COUNT(*) AS count FROM direct_messages WHERE recipientId = ? AND readAt IS NULL', args: [userId] }),
      ]);
      return {
        connectionRequests: Number(connections.rows[0]?.count || 0),
        sharedItems: Number(shared.rows[0]?.count || 0),
        chatNotifications: Number(messages.rows[0]?.count || 0),
      };
    },
  },

  searchUsers: async (query: string, excludeUserId: string) => {
    await ensureTablesExist();
    const client = getClient();
    const pattern = '%' + query + '%';
    const result = await client.execute({
      sql: 'SELECT id, name, email, profileImage FROM users WHERE id != ? AND (LOWER(email) LIKE LOWER(?) OR LOWER(name) LIKE LOWER(?)) LIMIT 10',
      args: [excludeUserId, pattern, pattern],
    });
    return result.rows.map((row: any) => ({
      id: row.id as string, name: row.name as string, email: row.email as string, profileImage: row.profileImage as string | null,
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

};
