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
  lastContact: Date | null;
  profileImage: string | null;
  createdAt: Date;
};

type Memory = {
  id: string;
  userId: string;
  friendId: string;
  content: string;
  imageUrl: string | null;
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
  friendId: string; // Primary friend (for backward compatibility)
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
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO users (id, email, passwordHash, name, birthday, profileImage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          user.id,
          user.email,
          user.passwordHash,
          user.name,
          user.birthday ? user.birthday.toISOString() : null,
          user.profileImage,
          user.createdAt.toISOString(),
        ],
      });

      return user;
    },

    update: async (id: string, data: { name?: string; birthday?: Date | null; profileImage?: string | null }): Promise<User> => {
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
      };

      await client.execute({
        sql: 'UPDATE users SET name = ?, birthday = ?, profileImage = ? WHERE id = ?',
        args: [
          updated.name,
          updated.birthday ? updated.birthday.toISOString() : null,
          updated.profileImage,
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
        lastContact: row.lastContact ? new Date(row.lastContact as string) : null,
        profileImage: row.profileImage as string | null,
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
          friendId: row.friendId as string,
          content: row.content as string,
          imageUrl: row.imageUrl as string | null,
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
        lastContact: data.lastContact ?? null,
        profileImage: data.profileImage ?? null,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO friends (id, userId, name, birthday, howWeMet, notes, lastContact, profileImage, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          newFriend.id,
          newFriend.userId,
          newFriend.name,
          newFriend.birthday ? newFriend.birthday.toISOString() : null,
          newFriend.howWeMet,
          newFriend.notes,
          newFriend.lastContact ? newFriend.lastContact.toISOString() : null,
          newFriend.profileImage,
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
        lastContact: data.lastContact !== undefined ? data.lastContact : (existing.lastContact ? new Date(existing.lastContact as string) : null),
        profileImage: (data.profileImage !== undefined ? data.profileImage : existing.profileImage) as string | null,
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE friends SET name = ?, birthday = ?, howWeMet = ?, notes = ?, lastContact = ?, profileImage = ? WHERE id = ?',
        args: [
          updated.name,
          updated.birthday ? updated.birthday.toISOString() : null,
          updated.howWeMet,
          updated.notes,
          updated.lastContact ? updated.lastContact.toISOString() : null,
          updated.profileImage,
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

      let sql = 'SELECT * FROM memories';
      let sqlArgs: any[] = [];
      if (args?.userId) {
        sql += ' WHERE userId = ?';
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
        createdAt: new Date(row.createdAt as string),
        friend: friendMap.get(row.friendId as string) || null,
      }));
    },
    create: async ({ data }: { data: { userId: string; friendId: string; content: string; imageUrl?: string | null } }) => {
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
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO memories (id, userId, friendId, content, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [
          memory.id,
          memory.userId,
          memory.friendId,
          memory.content,
          memory.imageUrl,
          memory.createdAt.toISOString(),
        ],
      });

      return memory;
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

      let friendSql = 'SELECT id, name FROM friends';
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
            lastContact: null,
            profileImage: null,
            createdAt: new Date(),
          },
        ])
      );

      const tags: DiaryNoteTag[] = tagsResult.rows.map((row: any) => ({
        noteId: row.noteId as string,
        friendId: row.friendId as string,
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

      return notes.map((note) => ({
        ...note,
        friends: tags
          .filter((tag) => tag.noteId === note.id)
          .map((tag) => friendMap.get(tag.friendId))
          .filter(Boolean) as Friend[],
      }));
    },
    create: async ({
      data,
    }: {
      data: { userId: string; title?: string | null; content: string; analysis?: string | null; imageUrl?: string | null; friendIds?: string[] };
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

      const friendIds = data.friendIds || [];
      if (friendIds.length > 0) {
        const insertValues = friendIds.map(() => '(?, ?, ?)').join(', ');
        await client.execute({
          sql: `INSERT INTO diary_note_tags (noteId, friendId, createdAt) VALUES ${insertValues}`,
          args: friendIds.flatMap((friendId) => [note.id, friendId, now.toISOString()]),
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
      data: { title?: string | null; content?: string; analysis?: string | null; imageUrl?: string | null; friendIds?: string[] };
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

      if (data.friendIds) {
        await client.execute({
          sql: 'DELETE FROM diary_note_tags WHERE noteId = ?',
          args: [where.id],
        });

        if (data.friendIds.length > 0) {
          const insertValues = data.friendIds.map(() => '(?, ?, ?)').join(', ');
          await client.execute({
            sql: `INSERT INTO diary_note_tags (noteId, friendId, createdAt) VALUES ${insertValues}`,
            args: data.friendIds.flatMap((friendId) => [where.id, friendId, now.toISOString()]),
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
        completed: Boolean(row.completed),
        createdAt: new Date(row.createdAt as string),
        friends: eventFriendsMap.get(row.id as string) || [],
      }));
    },
    create: async ({ data }: { data: { userId: string; title: string; description?: string | null; eventDate: Date; location?: string | null; category?: string | null; friendId: string; friendIds?: string[]; completed?: boolean } }) => {
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
        completed: data.completed ?? false,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO events (id, userId, title, description, eventDate, location, category, friendId, completed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [
          event.id,
          event.userId,
          event.title,
          event.description,
          event.eventDate.toISOString(),
          event.location,
          event.category,
          event.friendId,
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
        friendId: (data.friendId ?? existing.friendId) as string,
        completed: data.completed !== undefined ? data.completed : Boolean(existing.completed),
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE events SET title = ?, description = ?, eventDate = ?, location = ?, category = ?, friendId = ?, completed = ? WHERE id = ?',
        args: [
          updated.title,
          updated.description,
          updated.eventDate.toISOString(),
          updated.location,
          updated.category,
          updated.friendId,
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
};
