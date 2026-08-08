import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('feed cursor excludes every item from the previous page', async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'amika-feed-pagination-'));
  process.env.TURSO_DATABASE_URL = `file:${join(temporaryDirectory, 'test.db')}`;
  process.env.TURSO_AUTH_TOKEN = 'local-test-token';

  try {
    const { prisma } = await import('./db.ts');
    const user = await prisma.user.create({
      email: `pagination-${randomUUID()}@example.invalid`,
      password: randomUUID(),
      name: 'Pagination Test',
    });

    for (let index = 0; index < 12; index += 1) {
      await prisma.memory.create({
        data: {
          userId: user.id,
          content: `Memory ${index}`,
          memoryDate: new Date(Date.UTC(2026, 0, 12 - index)),
          visibility: 'private',
        },
      });
    }

    const firstResult = await prisma.memory.findFeed({ userId: user.id, limit: 6 });
    const firstPage = firstResult.slice(0, 5);
    const last = firstPage.at(-1);
    assert.ok(last);

    const secondResult = await prisma.memory.findFeed({
      userId: user.id,
      limit: 6,
      cursor: { date: last.memoryDate.toISOString(), id: last.id },
    });
    const firstIds = new Set(firstPage.map((memory) => memory.id));

    assert.equal(firstPage.length, 5);
    assert.equal(secondResult.length, 6);
    assert.equal(secondResult.filter((memory) => firstIds.has(memory.id)).length, 0);
  } finally {
    if (temporaryDirectory.startsWith(join(tmpdir(), 'amika-feed-pagination-'))) {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }
});
