#!/usr/bin/env node
/**
 * Run pending database migrations against Turso
 * This script is designed to run during Vercel build process
 */

const { createClient } = require('@libsql/client');
const { readFileSync, readdirSync, existsSync } = require('fs');
const { join } = require('path');

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.log('[migrate-db] TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set, skipping migration');
  process.exit(0);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function getAppliedMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS _prisma_migrations (
        id TEXT PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await client.execute('SELECT migration_name FROM _prisma_migrations');
    return new Set(result.rows.map(r => r.migration_name));
  } catch (err) {
    console.error('[migrate-db] Error getting applied migrations:', err.message);
    return new Set();
  }
}

async function markMigrationApplied(name) {
  const id = require('crypto').randomUUID();
  await client.execute({
    sql: 'INSERT INTO _prisma_migrations (id, migration_name) VALUES (?, ?)',
    args: [id, name]
  });
}

async function runMigration(name, sql) {
  console.log(`[migrate-db] Running migration: ${name}`);

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.execute(stmt);
    } catch (err) {
      // Ignore "already exists" errors
      if (err.message?.includes('already exists')) {
        console.log(`[migrate-db]   ⚠ Skipped (already exists): ${stmt.substring(0, 50)}...`);
      } else {
        throw err;
      }
    }
  }

  await markMigrationApplied(name);
  console.log(`[migrate-db]   ✓ Migration ${name} completed`);
}

async function main() {
  console.log('[migrate-db] Starting database migration check...');

  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');

  if (!existsSync(migrationsDir)) {
    console.log('[migrate-db] No migrations directory found');
    return;
  }

  const appliedMigrations = await getAppliedMigrations();
  const migrationFolders = readdirSync(migrationsDir)
    .filter(f => !f.startsWith('.') && !f.startsWith('migration_lock'))
    .sort();

  let migrationsRun = 0;

  for (const folder of migrationFolders) {
    if (appliedMigrations.has(folder)) {
      continue;
    }

    const migrationPath = join(migrationsDir, folder, 'migration.sql');
    if (!existsSync(migrationPath)) {
      continue;
    }

    const sql = readFileSync(migrationPath, 'utf-8');
    await runMigration(folder, sql);
    migrationsRun++;
  }

  if (migrationsRun === 0) {
    console.log('[migrate-db] No new migrations to apply');
  } else {
    console.log(`[migrate-db] Applied ${migrationsRun} migration(s)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[migrate-db] Migration failed:', err);
    process.exit(1);
  });
