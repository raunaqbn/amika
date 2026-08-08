import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('a shared memory supports explicit recipients without leaking to other friends', async (context) => {
  const testDirectory = mkdtempSync(join(tmpdir(), 'amika-memory-privacy-'));
  context.after(() => rmSync(testDirectory, { recursive: true, force: true }));
  process.env.TURSO_DATABASE_URL = `file:${join(testDirectory, 'privacy.db')}`;
  delete process.env.TURSO_AUTH_TOKEN;

  const { getAuthorizedImage, prisma } = await import('./db.ts');
  const owner = await prisma.user.create({ email: 'owner@example.com', password: 'password', name: 'Owner' });
  const tagged = await prisma.user.create({ email: 'tagged@example.com', password: 'password', name: 'Tagged Friend' });
  const second = await prisma.user.create({ email: 'second@example.com', password: 'password', name: 'Second Friend' });
  const other = await prisma.user.create({ email: 'other@example.com', password: 'password', name: 'Other Friend' });

  const taggedConnection = await prisma.userConnection.create({ requesterId: owner.id, addresseeId: tagged.id });
  await prisma.userConnection.update({ id: taggedConnection.id, userId: tagged.id, status: 'accepted' });
  const secondConnection = await prisma.userConnection.create({ requesterId: owner.id, addresseeId: second.id });
  await prisma.userConnection.update({ id: secondConnection.id, userId: second.id, status: 'accepted' });
  const otherConnection = await prisma.userConnection.create({ requesterId: owner.id, addresseeId: other.id });
  await prisma.userConnection.update({ id: otherConnection.id, userId: other.id, status: 'accepted' });

  const taggedFriend = await prisma.friend.create({
    data: { userId: owner.id, name: tagged.name, linkedUserId: tagged.id },
  });
  await prisma.friend.create({ data: { userId: owner.id, name: second.name, linkedUserId: second.id } });
  const privateImage = 'data:image/png;base64,aGVsbG8=';
  const memory = await prisma.memory.create({
    data: {
      userId: owner.id,
      friendId: taggedFriend.id,
      content: 'A memory for selected friends',
      imageUrl: privateImage,
      visibility: 'friends',
      sharedWithFriend: true,
    },
  });

  await prisma.sharedItem.create({
    sharedByUserId: owner.id,
    sharedWithUserId: tagged.id,
    itemType: 'memory',
    itemId: memory.id,
  });
  await prisma.sharedItem.create({
    sharedByUserId: owner.id,
    sharedWithUserId: second.id,
    itemType: 'memory',
    itemId: memory.id,
  });
  const ownerFeed = await prisma.memory.findFeed({ userId: owner.id });
  assert.equal(ownerFeed.find((item) => item.id === memory.id)?.audienceCount, 2);
  assert.ok((await prisma.memory.findFeed({ userId: tagged.id })).some((item) => item.id === memory.id));
  assert.ok((await prisma.memory.findFeed({ userId: second.id })).some((item) => item.id === memory.id));
  assert.ok(!(await prisma.memory.findFeed({ userId: other.id })).some((item) => item.id === memory.id));
  assert.ok((await prisma.sharedItem.findMany({ userId: tagged.id, type: 'received' })).some((item) => item.itemId === memory.id));
  assert.ok((await prisma.sharedItem.findMany({ userId: second.id, type: 'received' })).some((item) => item.itemId === memory.id));

  assert.equal(await getAuthorizedImage(tagged.id, 'memory', memory.id), privateImage);
  assert.equal(await getAuthorizedImage(second.id, 'memory', memory.id), privateImage);
  assert.equal(await getAuthorizedImage(other.id, 'memory', memory.id), null);
  await assert.rejects(
    prisma.memoryReaction.toggle({ memoryId: memory.id, userId: other.id }),
    /Memory not found/,
  );
  await assert.rejects(
    prisma.memoryComment.findMany({ memoryId: memory.id, userId: other.id }),
    /Memory not found/,
  );
  assert.deepEqual(await prisma.memoryComment.findMany({ memoryId: memory.id, userId: tagged.id }), []);
  assert.deepEqual(
    await prisma.memoryReaction.toggle({ memoryId: memory.id, userId: tagged.id }),
    { active: true },
  );

  await prisma.sharedItem.restrictMemoryAudience({
    sharedByUserId: owner.id,
    itemId: memory.id,
    sharedWithUserIds: [tagged.id],
  });
  assert.ok(!(await prisma.memory.findFeed({ userId: second.id })).some((item) => item.id === memory.id));
});
