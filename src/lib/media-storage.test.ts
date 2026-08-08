import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOB_REFERENCE_PREFIX,
  blobPathname,
  blobReference,
  parseImageDataUrl,
} from './media-storage.ts';

test('blob references round trip without exposing storage URLs', () => {
  const pathname = 'images/profile/user-1/hash.jpg';
  assert.equal(blobReference(pathname), `${BLOB_REFERENCE_PREFIX}${pathname}`);
  assert.equal(blobPathname(blobReference(pathname)), pathname);
  assert.equal(blobPathname('https://example.com/photo.jpg'), null);
  assert.equal(blobPathname('data:image/png;base64,AA=='), null);
});

test('valid image data URLs are decoded', () => {
  const parsed = parseImageDataUrl('data:image/png;base64,aGVsbG8=');
  assert.equal(parsed?.contentType, 'image/png');
  assert.equal(parsed?.bytes.toString('utf8'), 'hello');
});

test('non-image data URLs are rejected', () => {
  assert.throws(
    () => parseImageDataUrl('data:text/plain;base64,aGVsbG8='),
    /Unsupported image type/,
  );
});
