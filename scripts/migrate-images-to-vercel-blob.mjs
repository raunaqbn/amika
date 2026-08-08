#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@libsql/client';
import { get, head, put } from '@vercel/blob';

const PREFIX = 'vercel-blob:';
const DATA_URL = /^data:([^;,]+);base64,([\s\S]+)$/;
const EXTENSIONS = new Map([
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['image/heic', 'heic'],
  ['image/heif', 'heif'],
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);
const FIELDS = [
  { table: 'users', column: 'profileImage' },
  { table: 'friends', column: 'profileImage' },
  { table: 'friends', column: 'customProfileImage' },
  { table: 'memories', column: 'imageUrl' },
  { table: 'diary_notes', column: 'imageUrl' },
];

const mode = process.argv[2] || '--dry-run';
const modeArg = process.argv[3];
if (!['--dry-run', '--execute', '--verify', '--rollback'].includes(mode)) {
  throw new Error('Usage: migrate-images-to-vercel-blob.mjs [--dry-run|--execute|--verify|--rollback <manifest-path>]');
}
if (mode === '--rollback' && !modeArg) throw new Error('--rollback requires a manifest pathname');

const databaseUrl = process.env.DATABASE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.DATABASE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;
if (!databaseUrl || !authToken) throw new Error('Production Turso configuration is missing');
if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
  throw new Error('Vercel Blob credentials are missing');
}

const db = createClient({ url: databaseUrl, authToken });

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function parseDataUrl(value) {
  const match = value.match(DATA_URL);
  if (!match) throw new Error('Invalid data URL');
  const contentType = match[1].toLowerCase();
  const extension = EXTENSIONS.get(contentType);
  if (!extension) throw new Error(`Unsupported image type: ${contentType}`);
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) throw new Error('Empty image');
  return { bytes, contentType, extension, sha256: digest(bytes) };
}

async function streamToBuffer(stream) {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

async function readPrivateBlob(pathname, useCache = false) {
  const result = await get(pathname, { access: 'private', useCache });
  if (!result || result.statusCode !== 200) throw new Error(`Blob read failed: ${pathname}`);
  return { bytes: await streamToBuffer(result.stream), metadata: result.blob };
}

async function verifyObject(pathname, expected) {
  const metadata = await head(pathname);
  if (metadata.size !== expected.bytes.length) {
    throw new Error(`Size mismatch for ${pathname}: ${metadata.size} != ${expected.bytes.length}`);
  }
  const downloaded = await readPrivateBlob(pathname, false);
  const actualDigest = digest(downloaded.bytes);
  if (actualDigest !== expected.sha256) {
    throw new Error(`SHA-256 mismatch for ${pathname}`);
  }
  return metadata;
}

async function loadCandidates() {
  const entries = [];
  for (const field of FIELDS) {
    const result = await db.execute(
      `SELECT id, ${field.column} AS value FROM ${field.table} WHERE ${field.column} LIKE 'data:%;base64,%'`,
    );
    for (const row of result.rows) {
      const value = String(row.value);
      const parsed = parseDataUrl(value);
      const pathname = `images/migrated/${parsed.sha256}.${parsed.extension}`;
      entries.push({
        ...field,
        id: String(row.id),
        value,
        valueLength: value.length,
        valuePrefix: value.slice(0, 128),
        pathname,
        ...parsed,
      });
    }
  }
  return entries;
}

function manifestEntry(entry) {
  return {
    table: entry.table,
    column: entry.column,
    id: entry.id,
    pathname: entry.pathname,
    contentType: entry.contentType,
    sha256: entry.sha256,
    size: entry.bytes.length,
  };
}

async function stageAndVerify(entries) {
  const unique = new Map(entries.map((entry) => [entry.pathname, entry]));
  let completed = 0;
  for (const entry of unique.values()) {
    let exists = false;
    try {
      const metadata = await head(entry.pathname);
      exists = metadata.size === entry.bytes.length;
    } catch {
      exists = false;
    }
    if (!exists) {
      await put(entry.pathname, entry.bytes, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 31_536_000,
        contentType: entry.contentType,
      });
    }
    await verifyObject(entry.pathname, entry);
    completed += 1;
    if (completed % 10 === 0 || completed === unique.size) {
      console.log(`stagedAndVerified=${completed}/${unique.size}`);
    }
  }
  return unique.size;
}

async function uploadManifest(entries) {
  const migrationId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`;
  const pathname = `migration-manifests/${migrationId}.json`;
  const manifest = {
    version: 1,
    migrationId,
    createdAt: new Date().toISOString(),
    entries: entries.map(manifestEntry),
  };
  const bytes = Buffer.from(JSON.stringify(manifest));
  await put(pathname, bytes, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: 'application/json',
  });
  const downloaded = await readPrivateBlob(pathname, false);
  if (digest(downloaded.bytes) !== digest(bytes)) throw new Error('Migration manifest verification failed');
  return pathname;
}

async function switchDatabase(entries) {
  const changed = [];
  try {
    for (let offset = 0; offset < entries.length; offset += 10) {
      const batch = entries.slice(offset, offset + 10);
      const statements = batch.map((entry) => ({
        sql: `UPDATE ${entry.table} SET ${entry.column} = ? WHERE id = ? AND LENGTH(${entry.column}) = ? AND SUBSTR(${entry.column}, 1, 128) = ?`,
        args: [`${PREFIX}${entry.pathname}`, entry.id, entry.valueLength, entry.valuePrefix],
      }));
      const results = await db.batch(statements, 'write');
      results.forEach((result, index) => {
        if (Number(result.rowsAffected) === 1) changed.push(batch[index]);
      });
      const failedIndex = results.findIndex((result) => Number(result.rowsAffected) !== 1);
      if (failedIndex !== -1) {
        throw new Error(`Concurrent update detected for ${batch[failedIndex].table}.${batch[failedIndex].column}:${batch[failedIndex].id}`);
      }
      console.log(`databaseSwitched=${Math.min(offset + batch.length, entries.length)}/${entries.length}`);
    }
  } catch (error) {
    console.error('Cutover failed; restoring rows already changed in this run');
    for (let offset = 0; offset < changed.length; offset += 2) {
      const batch = changed.slice(offset, offset + 2);
      await db.batch(batch.map((entry) => ({
        sql: `UPDATE ${entry.table} SET ${entry.column} = ? WHERE id = ? AND ${entry.column} = ?`,
        args: [entry.value, entry.id, `${PREFIX}${entry.pathname}`],
      })), 'write');
    }
    throw error;
  }
}

async function verifyDatabaseAndBlobs() {
  const references = [];
  let legacyCount = 0;
  for (const field of FIELDS) {
    const result = await db.execute(
      `SELECT id, ${field.column} AS value FROM ${field.table} WHERE ${field.column} LIKE 'data:%;base64,%' OR ${field.column} LIKE '${PREFIX}%'`,
    );
    for (const row of result.rows) {
      const value = String(row.value);
      if (value.startsWith('data:')) legacyCount += 1;
      else references.push(value.slice(PREFIX.length));
    }
  }

  const unique = [...new Set(references)];
  let verified = 0;
  for (const pathname of unique) {
    const expectedDigest = pathname.match(/([a-f0-9]{64})\.[a-z0-9]+$/)?.[1];
    const downloaded = await readPrivateBlob(pathname, false);
    if (expectedDigest && digest(downloaded.bytes) !== expectedDigest) {
      throw new Error(`Stored digest does not match pathname: ${pathname}`);
    }
    verified += 1;
    if (verified % 10 === 0 || verified === unique.length) {
      console.log(`verifiedDatabaseBlobs=${verified}/${unique.length}`);
    }
  }

  console.log(`verification legacyDataUrls=${legacyCount} blobReferences=${references.length} uniqueBlobs=${unique.length}`);
  return { legacyCount, referenceCount: references.length, uniqueCount: unique.length };
}

async function rollback(manifestPathname) {
  const downloaded = await readPrivateBlob(manifestPathname, false);
  const manifest = JSON.parse(downloaded.bytes.toString('utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.entries)) throw new Error('Unsupported migration manifest');

  let restored = 0;
  for (const entry of manifest.entries) {
    if (!FIELDS.some((field) => field.table === entry.table && field.column === entry.column)) {
      throw new Error('Migration manifest contains an unknown database field');
    }
    const blob = await readPrivateBlob(entry.pathname, false);
    if (digest(blob.bytes) !== entry.sha256) throw new Error(`Cannot restore corrupt blob: ${entry.pathname}`);
    const dataUrl = `data:${entry.contentType};base64,${blob.bytes.toString('base64')}`;
    const result = await db.execute({
      sql: `UPDATE ${entry.table} SET ${entry.column} = ? WHERE id = ? AND ${entry.column} = ?`,
      args: [dataUrl, entry.id, `${PREFIX}${entry.pathname}`],
    });
    restored += Number(result.rowsAffected);
    if (restored % 10 === 0) console.log(`restored=${restored}`);
  }
  console.log(`rollbackComplete restored=${restored} manifest=${manifestPathname}`);
}

try {
  if (mode === '--rollback') {
    await rollback(modeArg);
  } else if (mode === '--verify') {
    const verification = await verifyDatabaseAndBlobs();
    if (verification.legacyCount > 0) process.exitCode = 2;
  } else {
    const entries = await loadCandidates();
    const unique = new Set(entries.map((entry) => entry.pathname));
    const decodedBytes = [...unique].reduce((total, pathname) => {
      const entry = entries.find((candidate) => candidate.pathname === pathname);
      return total + (entry?.bytes.length || 0);
    }, 0);
    console.log(`plan references=${entries.length} uniqueBlobs=${unique.size} decodedMiB=${(decodedBytes / 1024 / 1024).toFixed(2)}`);
    if (mode === '--execute' && entries.length > 0) {
      await stageAndVerify(entries);
      const manifestPathname = await uploadManifest(entries);
      console.log(`verifiedManifest=${manifestPathname}`);
      await switchDatabase(entries);
      const verification = await verifyDatabaseAndBlobs();
      if (verification.legacyCount !== 0) throw new Error('Legacy data URLs remain after cutover');
      console.log(`migrationComplete manifest=${manifestPathname}`);
    }
  }
} finally {
  await db.close();
}
