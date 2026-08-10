import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadedPathname, uploadPercentage } from './media-upload.ts';

test('normalizes native upload progress', () => {
  assert.equal(uploadPercentage(25, 100), 25);
  assert.equal(uploadPercentage(150, 100), 100);
  assert.equal(uploadPercentage(-5, 100), 0);
  assert.equal(uploadPercentage(1, 0), 0);
});

test('accepts a successful blob upload response', () => {
  assert.equal(uploadedPathname('{"pathname":"media/user/video.mp4"}', 200), 'media/user/video.mp4');
});

test('surfaces blob errors without trusting malformed responses', () => {
  assert.throws(() => uploadedPathname('{"error":{"message":"Video is too large"}}', 413), /Video is too large/);
  assert.throws(() => uploadedPathname('not json', 200), /media upload failed/);
});
