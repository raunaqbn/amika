import assert from 'node:assert/strict';
import test from 'node:test';
import { createGoogleOAuthState, sanitizeReturnUrl, verifyGoogleOAuthState } from './google-oauth.ts';

test('Google OAuth state is signed and rejects tampering', () => {
  process.env.OAUTH_STATE_SECRET = 'test-only-oauth-secret';
  const state = createGoogleOAuthState({ platform: 'mobile', returnUrl: '/memories' });
  assert.equal(verifyGoogleOAuthState(state)?.platform, 'mobile');
  assert.equal(verifyGoogleOAuthState(state)?.returnUrl, '/memories');

  const [payload, signature] = state.split('.');
  const tampered = `${Buffer.from(JSON.stringify({ issuedAt: Date.now(), nonce: 'fake', platform: 'mobile' })).toString('base64url')}.${signature}`;
  assert.equal(verifyGoogleOAuthState(tampered), null);
  assert.equal(verifyGoogleOAuthState(`${payload}.invalid`), null);
});

test('Google OAuth return paths cannot redirect to another origin', () => {
  assert.equal(sanitizeReturnUrl('/friends?invited=true'), '/friends?invited=true');
  assert.equal(sanitizeReturnUrl('https://evil.example'), undefined);
  assert.equal(sanitizeReturnUrl('//evil.example'), undefined);
});

test('Google OAuth state expires', () => {
  process.env.OAUTH_STATE_SECRET = 'test-only-oauth-secret';
  const originalNow = Date.now;
  try {
    Date.now = () => 1_000;
    const state = createGoogleOAuthState({ platform: 'mobile' });
    Date.now = () => 11 * 60 * 1000;
    assert.equal(verifyGoogleOAuthState(state), null);
  } finally {
    Date.now = originalNow;
  }
});
