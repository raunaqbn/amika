import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_PROFILE_STATUS_LENGTH,
  normalizeProfileInterests,
  normalizeProfileStatus,
  parseStoredInterests,
  ProfileInputError,
} from './profile.ts';

test('normalizes a profile status and clears blank text', () => {
  assert.equal(normalizeProfileStatus('  Out making memories  '), 'Out making memories');
  assert.equal(normalizeProfileStatus('   '), null);
  assert.equal(normalizeProfileStatus(null), null);
  assert.equal(normalizeProfileStatus(undefined), undefined);
});

test('counts profile status limits by user-visible characters', () => {
  assert.equal(normalizeProfileStatus('✨'.repeat(MAX_PROFILE_STATUS_LENGTH)), '✨'.repeat(MAX_PROFILE_STATUS_LENGTH));
  assert.throws(() => normalizeProfileStatus('✨'.repeat(MAX_PROFILE_STATUS_LENGTH + 1)), ProfileInputError);
});

test('normalizes, de-duplicates, and parses interests', () => {
  assert.deepEqual(normalizeProfileInterests([' hiking ', 'coffee', 'hiking']), ['hiking', 'coffee']);
  assert.deepEqual(parseStoredInterests('["hiking","coffee"]'), ['hiking', 'coffee']);
  assert.deepEqual(parseStoredInterests('not-json'), []);
  assert.equal(normalizeProfileInterests([]), null);
});
