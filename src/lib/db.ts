import { createClient } from '@libsql/client';
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

// Initialize Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || ''
});

// Initialize database tables
async function initTables() {
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
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

// Initialize tables on module load
initTables();

export const prisma = {
  friend: {
    findMany: async (args?: { include?: { memories?: { orderBy?: { createdAt: string } } }; orderBy?: { createdAt: string } }) => {
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
};
