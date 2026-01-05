import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';
import { randomUUID } from "crypto";

type Friend = {
  id: string;
  name: string;
  birthday: Date | null;
  howWeMet: string | null;
  notes: string | null;
  lastContact: Date | null;
  createdAt: Date;
};

type Memory = {
  id: string;
  friendId: string;
  content: string;
  createdAt: Date;
};

type DiaryNote = {
  id: string;
  title: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type DiaryNoteTag = {
  noteId: string;
  friendId: string;
  createdAt: Date;
};

let clientInstance: Client | null = null;
let tablesInitialized = false;

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
    await client.execute(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birthday TEXT,
        howWeMet TEXT,
        notes TEXT,
        lastContact TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        friendId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (friendId) REFERENCES friends(id) ON DELETE CASCADE
      )
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS diary_notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
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

    tablesInitialized = true;
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

export const prisma = {
  friend: {
    findMany: async (args?: { include?: { memories?: { orderBy?: { createdAt: string } } }; orderBy?: { createdAt: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      const friendsResult = await client.execute('SELECT * FROM friends ORDER BY createdAt DESC');
      const friends: Friend[] = friendsResult.rows.map((row: any) => ({
        id: row.id as string,
        name: row.name as string,
        birthday: row.birthday ? new Date(row.birthday as string) : null,
        howWeMet: row.howWeMet as string | null,
        notes: row.notes as string | null,
        lastContact: row.lastContact ? new Date(row.lastContact as string) : null,
        createdAt: new Date(row.createdAt as string),
      }));

      if (args?.include?.memories) {
        const memoriesResult = await client.execute('SELECT * FROM memories ORDER BY createdAt DESC');
        const memories: Memory[] = memoriesResult.rows.map((row: any) => ({
          id: row.id as string,
          friendId: row.friendId as string,
          content: row.content as string,
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
    create: async ({ data }: { data: Partial<Friend> }) => {
      await ensureTablesExist();
      const client = getClient();

      const newFriend: Friend = {
        id: randomUUID(),
        name: data.name ?? "",
        birthday: data.birthday ?? null,
        howWeMet: data.howWeMet ?? null,
        notes: data.notes ?? null,
        lastContact: data.lastContact ?? null,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO friends (id, name, birthday, howWeMet, notes, lastContact, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          newFriend.id,
          newFriend.name,
          newFriend.birthday ? newFriend.birthday.toISOString() : null,
          newFriend.howWeMet,
          newFriend.notes,
          newFriend.lastContact ? newFriend.lastContact.toISOString() : null,
          newFriend.createdAt.toISOString(),
        ],
      });

      return newFriend;
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<Friend> }) => {
      await ensureTablesExist();
      const client = getClient();

      const existingResult = await client.execute({
        sql: 'SELECT * FROM friends WHERE id = ?',
        args: [where.id],
      });

      if (existingResult.rows.length === 0) {
        throw new Error("Friend not found");
      }

      const existing = existingResult.rows[0];
      const updated: Friend = {
        id: existing.id as string,
        name: (data.name ?? existing.name) as string,
        birthday: data.birthday !== undefined ? data.birthday : (existing.birthday ? new Date(existing.birthday as string) : null),
        howWeMet: (data.howWeMet !== undefined ? data.howWeMet : existing.howWeMet) as string | null,
        notes: (data.notes !== undefined ? data.notes : existing.notes) as string | null,
        lastContact: data.lastContact !== undefined ? data.lastContact : (existing.lastContact ? new Date(existing.lastContact as string) : null),
        createdAt: new Date(existing.createdAt as string),
      };

      await client.execute({
        sql: 'UPDATE friends SET name = ?, birthday = ?, howWeMet = ?, notes = ?, lastContact = ? WHERE id = ?',
        args: [
          updated.name,
          updated.birthday ? updated.birthday.toISOString() : null,
          updated.howWeMet,
          updated.notes,
          updated.lastContact ? updated.lastContact.toISOString() : null,
          where.id,
        ],
      });

      return updated;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      const existingResult = await client.execute({
        sql: 'SELECT * FROM friends WHERE id = ?',
        args: [where.id],
      });

      if (existingResult.rows.length === 0) {
        throw new Error("Friend not found");
      }

      // Delete related memories first (if not using CASCADE)
      await client.execute({
        sql: 'DELETE FROM memories WHERE friendId = ?',
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
    create: async ({ data }: { data: { friendId: string; content: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      const friendResult = await client.execute({
        sql: 'SELECT * FROM friends WHERE id = ?',
        args: [data.friendId],
      });

      if (friendResult.rows.length === 0) {
        throw new Error("Friend not found");
      }

      const memory: Memory = {
        id: randomUUID(),
        friendId: data.friendId,
        content: data.content,
        createdAt: new Date(),
      };

      await client.execute({
        sql: 'INSERT INTO memories (id, friendId, content, createdAt) VALUES (?, ?, ?, ?)',
        args: [
          memory.id,
          memory.friendId,
          memory.content,
          memory.createdAt.toISOString(),
        ],
      });

      return memory;
    },
    delete: async ({ where }: { where: { id: string } }) => {
      await ensureTablesExist();
      const client = getClient();

      const existingResult = await client.execute({
        sql: 'SELECT * FROM memories WHERE id = ?',
        args: [where.id],
      });

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
    findMany: async () => {
      await ensureTablesExist();
      const client = getClient();

      const notesResult = await client.execute(
        'SELECT * FROM diary_notes ORDER BY createdAt DESC'
      );
      const tagsResult = await client.execute('SELECT * FROM diary_note_tags');
      const friendsResult = await client.execute('SELECT id, name FROM friends');

      const friendMap = new Map<string, Friend>(
        friendsResult.rows.map((row: any) => [
          row.id as string,
          {
            id: row.id as string,
            name: row.name as string,
            birthday: null,
            howWeMet: null,
            notes: null,
            lastContact: null,
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
        title: (row.title as string | null) ?? null,
        content: row.content as string,
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
      data: { title?: string | null; content: string; friendIds?: string[] };
    }) => {
      await ensureTablesExist();
      const client = getClient();
      const now = new Date();

      const note: DiaryNote = {
        id: randomUUID(),
        title: data.title ?? null,
        content: data.content,
        createdAt: now,
        updatedAt: now,
      };

      await client.execute({
        sql: 'INSERT INTO diary_notes (id, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        args: [
          note.id,
          note.title,
          note.content,
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

      return prisma.diaryNote.findMany().then((notes) =>
        notes.find((entry) => entry.id === note.id) || { ...note, friends: [] }
      );
    },
    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: { title?: string | null; content?: string; friendIds?: string[] };
    }) => {
      await ensureTablesExist();
      const client = getClient();

      const existingResult = await client.execute({
        sql: 'SELECT * FROM diary_notes WHERE id = ?',
        args: [where.id],
      });

      if (existingResult.rows.length === 0) {
        throw new Error('Note not found');
      }

      const existing = existingResult.rows[0];
      const now = new Date();
      const updated: DiaryNote = {
        id: existing.id as string,
        title:
          data.title !== undefined ? data.title : ((existing.title as string | null) ?? null),
        content: (data.content ?? existing.content) as string,
        createdAt: new Date(existing.createdAt as string),
        updatedAt: now,
      };

      await client.execute({
        sql: 'UPDATE diary_notes SET title = ?, content = ?, updatedAt = ? WHERE id = ?',
        args: [updated.title, updated.content, updated.updatedAt.toISOString(), where.id],
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

      return prisma.diaryNote.findMany().then((notes) =>
        notes.find((note) => note.id === where.id) || {
          ...updated,
          friends: [],
        }
      );
    },
    delete: async ({ where }: { where: { id: string } }) => {
      await ensureTablesExist();
      const client = getClient();

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
};
