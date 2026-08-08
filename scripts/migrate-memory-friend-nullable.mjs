#!/usr/bin/env node

import { createClient } from '@libsql/client';

const execute = process.argv.includes('--execute');
const databaseUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_TURSO_AUTH_TOKEN;

if (!databaseUrl) throw new Error('TURSO_DATABASE_URL or DATABASE_TURSO_DATABASE_URL is required');

const client = createClient({ url: databaseUrl, authToken });

function count(result) {
  return Number(result.rows[0]?.count || 0);
}

try {
  const columns = await client.execute('PRAGMA table_info(memories)');
  const friendId = columns.rows.find((column) => column.name === 'friendId');
  if (!friendId) throw new Error('memories.friendId does not exist');

  const before = {
    memories: count(await client.execute('SELECT COUNT(*) AS count FROM memories')),
    reactions: count(await client.execute('SELECT COUNT(*) AS count FROM memory_reactions')),
    comments: count(await client.execute('SELECT COUNT(*) AS count FROM memory_comments')),
  };

  if (Number(friendId.notnull) === 0) {
    console.log(`alreadyNullable memories=${before.memories} reactions=${before.reactions} comments=${before.comments}`);
    process.exit(0);
  }

  const missingOwners = count(await client.execute("SELECT COUNT(*) AS count FROM memories WHERE userId IS NULL OR userId = ''"));
  if (missingOwners > 0) throw new Error(`Cannot migrate: ${missingOwners} memories do not have an owner`);

  const staleTables = await client.execute(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name IN (
      'memories_friend_nullable_old',
      'memory_reactions_friend_nullable_old',
      'memory_comments_friend_nullable_old'
    )
  `);
  if (staleTables.rows.length) {
    throw new Error(`Cannot migrate while stale migration tables exist: ${staleTables.rows.map((row) => row.name).join(', ')}`);
  }

  console.log(`migrationNeeded memories=${before.memories} reactions=${before.reactions} comments=${before.comments} execute=${execute}`);
  if (!execute) process.exit(0);

  await client.batch([
    'ALTER TABLE memory_reactions RENAME TO memory_reactions_friend_nullable_old',
    'ALTER TABLE memory_comments RENAME TO memory_comments_friend_nullable_old',
    'ALTER TABLE memories RENAME TO memories_friend_nullable_old',
    'DROP INDEX IF EXISTS idx_memories_feed',
    'DROP INDEX IF EXISTS idx_memories_user_date',
    'DROP INDEX IF EXISTS idx_memories_user_sort',
    'DROP INDEX IF EXISTS idx_memory_comments_memory',
    `CREATE TABLE memories (
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
    )`,
    `INSERT INTO memories (
      id, userId, friendId, amikaFriendUserId, content, imageUrl, visibility,
      memoryDate, sharedWithFriend, sharedWithAmikaFriend, createdAt
    ) SELECT
      id, userId, friendId, amikaFriendUserId, content, imageUrl, visibility,
      memoryDate, COALESCE(sharedWithFriend, 0), COALESCE(sharedWithAmikaFriend, 0), createdAt
    FROM memories_friend_nullable_old`,
    `CREATE TABLE memory_reactions (
      id TEXT PRIMARY KEY,
      memoryId TEXT NOT NULL,
      userId TEXT NOT NULL,
      emoji TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      UNIQUE(memoryId, userId, emoji),
      FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `INSERT INTO memory_reactions (id, memoryId, userId, emoji, createdAt)
     SELECT id, memoryId, userId, emoji, createdAt FROM memory_reactions_friend_nullable_old`,
    `CREATE TABLE memory_comments (
      id TEXT PRIMARY KEY,
      memoryId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `INSERT INTO memory_comments (id, memoryId, userId, content, createdAt)
     SELECT id, memoryId, userId, content, createdAt FROM memory_comments_friend_nullable_old`,
    'DROP TABLE memory_reactions_friend_nullable_old',
    'DROP TABLE memory_comments_friend_nullable_old',
    'DROP TABLE memories_friend_nullable_old',
    'CREATE INDEX idx_memories_feed ON memories(visibility, createdAt)',
    'CREATE INDEX idx_memories_user_date ON memories(userId, memoryDate)',
    'CREATE INDEX idx_memories_user_sort ON memories(userId, COALESCE(memoryDate, createdAt) DESC, id DESC)',
    'CREATE INDEX idx_memory_comments_memory ON memory_comments(memoryId, createdAt)',
  ], 'write');

  const after = {
    memories: count(await client.execute('SELECT COUNT(*) AS count FROM memories')),
    reactions: count(await client.execute('SELECT COUNT(*) AS count FROM memory_reactions')),
    comments: count(await client.execute('SELECT COUNT(*) AS count FROM memory_comments')),
  };
  if (JSON.stringify(after) !== JSON.stringify(before)) {
    throw new Error(`Migration count mismatch: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  }

  const migratedColumns = await client.execute('PRAGMA table_info(memories)');
  const migratedFriendId = migratedColumns.rows.find((column) => column.name === 'friendId');
  if (!migratedFriendId || Number(migratedFriendId.notnull) !== 0) {
    throw new Error('Migration finished without making memories.friendId nullable');
  }

  const foreignKeyViolations = await client.execute('PRAGMA foreign_key_check');
  if (foreignKeyViolations.rows.length) {
    throw new Error(`Migration introduced ${foreignKeyViolations.rows.length} foreign-key violations`);
  }

  console.log(`migrationComplete memories=${after.memories} reactions=${after.reactions} comments=${after.comments} friendIdNullable=true`);
} finally {
  await client.close();
}
