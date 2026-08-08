import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('accepting a tagged memory keeps one sender-owned entry in the recipient timeline', async (context) => {
  const testDirectory = mkdtempSync(join(tmpdir(), 'amika-shared-memory-'));
  context.after(() => rmSync(testDirectory, { recursive: true, force: true }));
  process.env.TURSO_DATABASE_URL = `file:${join(testDirectory, 'shared-memory.db')}`;
  delete process.env.TURSO_AUTH_TOKEN;

  const [{ prisma }, { respondToSharedItem }] = await Promise.all([
    import('./db.ts'),
    import('./shared-items.ts'),
  ]);
  const sender = await prisma.user.create({ email: 'sender@example.com', password: 'password', name: 'Sender' });
  const recipient = await prisma.user.create({ email: 'recipient@example.com', password: 'password', name: 'Recipient' });
  const connection = await prisma.userConnection.create({ requesterId: sender.id, addresseeId: recipient.id });
  await prisma.userConnection.update({ id: connection.id, userId: recipient.id, status: 'accepted' });

  const taggedFriend = await prisma.friend.create({
    data: { userId: sender.id, name: recipient.name, linkedUserId: recipient.id },
  });
  const memory = await prisma.memory.create({
    data: {
      userId: sender.id,
      friendId: taggedFriend.id,
      content: 'A memory from the sender',
      visibility: 'friends',
      sharedWithFriend: true,
    },
  });
  const sharedItem = await prisma.sharedItem.create({
    sharedByUserId: sender.id,
    sharedWithUserId: recipient.id,
    itemType: 'memory',
    itemId: memory.id,
  });

  await respondToSharedItem({ id: sharedItem.id, userId: recipient.id, status: 'accepted' });

  assert.equal((await prisma.memory.findMany({ userId: recipient.id })).length, 0);
  const matchingFeedEntries = (await prisma.memory.findFeed({ userId: recipient.id }))
    .filter((item) => item.content === memory.content);
  assert.equal(matchingFeedEntries.length, 1);
  assert.equal(matchingFeedEntries[0].userId, sender.id);
  assert.equal(matchingFeedEntries[0].isOwn, false);

  const note = await prisma.diaryNote.create({
    data: { userId: sender.id, title: 'Shared reflection', content: 'A note for a friend' },
  });
  await prisma.sharedItem.create({
    sharedByUserId: sender.id,
    sharedWithUserId: recipient.id,
    itemType: 'note',
    itemId: note.id,
  });
  assert.equal((await prisma.sharedItem.getPendingCount(recipient.id)).sharedItems, 1);
  assert.equal((await prisma.sharedItem.getPendingCount(recipient.id, 'memory')).sharedItems, 0);
});
