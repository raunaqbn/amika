import assert from 'node:assert/strict';
import test from 'node:test';
import { sendSharedItemNotification } from './shared-item-notifications.ts';

test('shared-memory notifications send push and recipient email with navigation data', async () => {
  const pushes: unknown[][] = [];
  const emails: unknown[] = [];

  await sendSharedItemNotification({
    sharedItemId: 'share-1',
    sharedByUserId: 'author-1',
    sharedWithUserId: 'recipient-1',
    itemType: 'memory',
    itemId: 'memory-1',
    itemContent: 'A day at the beach',
  }, {
    findUser: async (userId) => userId === 'author-1'
      ? { id: userId, name: 'Author', email: 'author@example.com' }
      : { id: userId, name: 'Recipient', email: 'recipient@example.com' },
    sendPush: async (...args) => { pushes.push(args); },
    sendMemoryEmail: async (input) => { emails.push(input); return { skipped: false }; },
  });

  assert.equal(pushes.length, 1);
  assert.deepEqual(pushes[0], [
    'recipient-1',
    'Author added a memory with you',
    'A day at the beach',
    {
      type: 'memory_tagged',
      sharedItemId: 'share-1',
      itemId: 'memory-1',
      memoryId: 'memory-1',
    },
  ]);
  assert.deepEqual(emails, [{
    recipientEmail: 'recipient@example.com',
    recipientName: 'Recipient',
    authorName: 'Author',
    memoryId: 'memory-1',
    memoryText: 'A day at the beach',
    idempotencyKey: 'memory-tag-memory-1-recipient-1',
  }]);
});

test('shared-note notifications send push without using the memory email channel', async () => {
  const pushes: unknown[][] = [];
  let emailCalls = 0;

  await sendSharedItemNotification({
    sharedItemId: 'share-2',
    sharedByUserId: 'author-1',
    sharedWithUserId: 'recipient-1',
    itemType: 'note',
    itemId: 'note-1',
    itemTitle: 'What I learned',
    itemContent: 'A longer private reflection',
  }, {
    findUser: async (userId) => ({ id: userId, name: userId === 'author-1' ? 'Author' : 'Recipient', email: `${userId}@example.com` }),
    sendPush: async (...args) => { pushes.push(args); },
    sendMemoryEmail: async () => { emailCalls += 1; return { skipped: false }; },
  });

  assert.equal(pushes.length, 1);
  assert.deepEqual(pushes[0], [
    'recipient-1',
    'Author shared a journal note with you',
    'What I learned',
    {
      type: 'note_shared',
      sharedItemId: 'share-2',
      itemId: 'note-1',
      noteId: 'note-1',
    },
  ]);
  assert.equal(emailCalls, 0);
});
