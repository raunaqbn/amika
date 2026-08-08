import assert from 'node:assert/strict';
import test from 'node:test';
import { sendTaggedMemoryEmail } from './email.ts';

test('tagged-memory email uses the recipient account email and escapes memory text', async () => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  process.env.RESEND_API_KEY = 're_test';
  process.env.EMAIL_FROM = 'Amika <memory@example.com>';
  let request: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (url, init) => {
    request = { url: String(url), init };
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  try {
    await sendTaggedMemoryEmail({
      recipientEmail: 'friend@example.com',
      recipientName: 'Friend',
      authorName: 'Raunaq',
      memoryId: 'memory-1',
      memoryText: '<script>nope</script>',
      idempotencyKey: 'memory-tag-memory-1-friend-1',
    });
    assert.ok(request);
    const captured = request as { url: string; init?: RequestInit };
    assert.equal(captured.url, 'https://api.resend.com/emails');
    const headers = new Headers(captured.init?.headers);
    assert.equal(headers.get('Idempotency-Key'), 'memory-tag-memory-1-friend-1');
    const body = JSON.parse(String(captured.init?.body));
    assert.deepEqual(body.to, ['friend@example.com']);
    assert.match(body.html, /&lt;script&gt;nope&lt;\/script&gt;/);
    assert.doesNotMatch(body.html, /<script>/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = originalFrom;
  }
});
