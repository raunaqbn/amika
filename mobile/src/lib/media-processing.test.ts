import assert from 'node:assert/strict';
import test from 'node:test';
import { fittedMediaDimensions, jpegFileName } from './media-processing.ts';

test('fittedMediaDimensions preserves aspect ratio without upscaling', () => {
  assert.deepEqual(fittedMediaDimensions(4032, 3024), { width: 1024, height: 768 });
  assert.deepEqual(fittedMediaDimensions(600, 800), { width: 600, height: 800 });
  assert.deepEqual(fittedMediaDimensions(0, Number.NaN), { width: 1, height: 1 });
});

test('jpegFileName matches the prepared image content type', () => {
  assert.equal(jpegFileName('IMG_0001.HEIC'), 'IMG_0001.jpg');
  assert.equal(jpegFileName('portrait.png'), 'portrait.jpg');
});
