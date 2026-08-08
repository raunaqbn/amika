#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@libsql/client';
import { del } from '@vercel/blob';

if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
  throw new Error('Blob credentials are required for the migration integration test');
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'amika-media-migration-'));
const databaseUrl = `file:${join(temporaryDirectory, 'test.db')}`;
const testId = randomUUID();
const png = `data:image/png;base64,${Buffer.from(`png-${testId}`).toString('base64')}`;
const jpeg = `data:image/jpeg;base64,${Buffer.from(`jpeg-${testId}`).toString('base64')}`;
const gif = `data:image/gif;base64,${Buffer.from(`gif-${testId}`).toString('base64')}`;
let createdPathnames = [];
let manifestPathname;

function runMigration(...args) {
  return execFileSync(process.execPath, ['scripts/migrate-images-to-vercel-blob.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      DATABASE_TURSO_DATABASE_URL: databaseUrl,
      DATABASE_TURSO_AUTH_TOKEN: 'local-test-token',
      TURSO_DATABASE_URL: databaseUrl,
      TURSO_AUTH_TOKEN: 'local-test-token',
    },
  });
}

async function readValues() {
  const client = createClient({ url: databaseUrl });
  try {
    const [users, friends, memories, notes] = await Promise.all([
      client.execute('SELECT id, profileImage FROM users ORDER BY id'),
      client.execute('SELECT id, profileImage, customProfileImage FROM friends ORDER BY id'),
      client.execute('SELECT id, imageUrl FROM memories ORDER BY id'),
      client.execute('SELECT id, imageUrl FROM diary_notes ORDER BY id'),
    ]);
    return { users: users.rows, friends: friends.rows, memories: memories.rows, notes: notes.rows };
  } finally {
    await client.close();
  }
}

try {
  const client = createClient({ url: databaseUrl });
  await client.batch([
    'CREATE TABLE users (id TEXT PRIMARY KEY, profileImage TEXT)',
    'CREATE TABLE friends (id TEXT PRIMARY KEY, profileImage TEXT, customProfileImage TEXT)',
    'CREATE TABLE memories (id TEXT PRIMARY KEY, imageUrl TEXT)',
    'CREATE TABLE diary_notes (id TEXT PRIMARY KEY, imageUrl TEXT)',
  ], 'write');
  await client.batch([
    { sql: 'INSERT INTO users VALUES (?, ?)', args: ['u1', png] },
    { sql: 'INSERT INTO users VALUES (?, ?)', args: ['u2', 'https://example.com/external.jpg'] },
    { sql: 'INSERT INTO friends VALUES (?, ?, ?)', args: ['f1', png, jpeg] },
    { sql: 'INSERT INTO memories VALUES (?, ?)', args: ['m1', jpeg] },
    { sql: 'INSERT INTO diary_notes VALUES (?, ?)', args: ['d1', gif] },
  ], 'write');
  await client.close();

  const dryRun = runMigration('--dry-run');
  assert.match(dryRun, /references=5 uniqueBlobs=3/);

  const execution = runMigration('--execute');
  assert.match(execution, /migrationComplete/);
  manifestPathname = execution.match(/migrationComplete manifest=([^\s]+)/)?.[1];
  assert.ok(manifestPathname, 'migration manifest was not reported');

  const migrated = await readValues();
  const migratedReferences = [
    migrated.users[0].profileImage,
    migrated.friends[0].profileImage,
    migrated.friends[0].customProfileImage,
    migrated.memories[0].imageUrl,
    migrated.notes[0].imageUrl,
  ].map(String);
  migratedReferences.forEach((value) => assert.match(value, /^vercel-blob:images\/migrated\//));
  assert.equal(migrated.users[1].profileImage, 'https://example.com/external.jpg');
  createdPathnames = [...new Set(migratedReferences.map((value) => value.slice('vercel-blob:'.length)))];

  const verification = runMigration('--verify');
  assert.match(verification, /legacyDataUrls=0 blobReferences=5 uniqueBlobs=3/);

  const rollback = runMigration('--rollback', manifestPathname);
  assert.match(rollback, /rollbackComplete restored=5/);
  const restored = await readValues();
  assert.equal(restored.users[0].profileImage, png);
  assert.equal(restored.friends[0].profileImage, png);
  assert.equal(restored.friends[0].customProfileImage, jpeg);
  assert.equal(restored.memories[0].imageUrl, jpeg);
  assert.equal(restored.notes[0].imageUrl, gif);
  assert.equal(restored.users[1].profileImage, 'https://example.com/external.jpg');

  console.log('migrationIntegration=PASS staged=3 references=5 rollback=5');
} finally {
  const blobCleanup = [...createdPathnames, ...(manifestPathname ? [manifestPathname] : [])];
  if (blobCleanup.length) await del(blobCleanup);
  if (temporaryDirectory.startsWith(join(tmpdir(), 'amika-media-migration-'))) {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
