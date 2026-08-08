import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('mobile OAuth handoff codes are single-use', async (context) => {
  const testDirectory = mkdtempSync(join(tmpdir(), 'amika-oauth-handoff-'));
  context.after(() => rmSync(testDirectory, { recursive: true, force: true }));
  process.env.TURSO_DATABASE_URL = `file:${join(testDirectory, 'handoff.db')}`;
  delete process.env.TURSO_AUTH_TOKEN;

  const { prisma } = await import('./db.ts');
  const user = await prisma.user.create({ email: 'oauth@example.com', password: 'password', name: 'OAuth User' });
  const session = await prisma.session.create(user.id);
  const handoff = await prisma.oauthHandoff.create({ userId: user.id, sessionToken: session.token });

  assert.deepEqual(await prisma.oauthHandoff.consume(handoff.code), { userId: user.id, sessionToken: session.token });
  assert.equal(await prisma.oauthHandoff.consume(handoff.code), null);
  assert.equal(await prisma.oauthHandoff.consume('not-a-real-code'), null);
});
