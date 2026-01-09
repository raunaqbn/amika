#!/usr/bin/env node
/**
 * Run a specific migration against the Turso database
 * Usage: node scripts/run-migration.js <migration-folder-name>
 * Example: node scripts/run-migration.js 20260108230000_add_event_planning_models
 */

const { createClient } = require('@libsql/client');
const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
require('dotenv').config();

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set');
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function runMigration(migrationName) {
  const migrationsDir = join(process.cwd(), 'prisma', 'migrations');

  // If no migration name provided, list available migrations
  if (!migrationName) {
    console.log('Available migrations:');
    const folders = readdirSync(migrationsDir).filter(f => !f.startsWith('.'));
    folders.forEach(f => console.log(`  - ${f}`));
    console.log('\nUsage: node scripts/run-migration.js <migration-folder-name>');
    return;
  }

  const migrationPath = join(migrationsDir, migrationName, 'migration.sql');

  try {
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log(`Running migration: ${migrationName}`);
    console.log('---');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.execute(stmt);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        // Check if it's a "table already exists" error - that's ok
        if (err.message?.includes('already exists')) {
          console.log(`⚠ Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`✗ Statement ${i + 1}/${statements.length} failed:`, err.message);
          console.error('SQL:', stmt.substring(0, 100) + '...');
          throw err;
        }
      }
    }

    console.log('---');
    console.log('Migration completed successfully!');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Error: Migration not found: ${migrationPath}`);
      process.exit(1);
    }
    throw err;
  }
}

const migrationName = process.argv[2];
runMigration(migrationName)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
