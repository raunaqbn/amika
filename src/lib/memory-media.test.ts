import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeIncomingMemoryMedia, parseStoredMemoryMedia, serializeMemoryMedia } from './memory-media.ts';

test('accepts ordered image and video uploads owned by the current user', () => {
  const items = normalizeIncomingMemoryMedia([
    { type: 'image', pathname: 'media/user-1/first.jpg', width: 1200, height: 900 },
    { type: 'video', pathname: 'media/user-1/second.mp4', durationMs: 4000 },
  ], 'user-1');
  assert.deepEqual(parseStoredMemoryMedia(serializeMemoryMedia(items!)), [
    { type: 'image', storageRef: 'vercel-blob:media/user-1/first.jpg', width: 1200, height: 900, durationMs: undefined },
    { type: 'video', storageRef: 'vercel-blob:media/user-1/second.mp4', width: undefined, height: undefined, durationMs: 4000 },
  ]);
});

test('rejects another user’s blob and more than ten items', () => {
  assert.equal(normalizeIncomingMemoryMedia([{ type: 'image', pathname: 'media/user-2/photo.jpg' }], 'user-1'), null);
  assert.equal(normalizeIncomingMemoryMedia(Array.from({ length: 11 }, (_, index) => ({ type: 'image', pathname: `media/user-1/${index}.jpg` })), 'user-1'), null);
});
