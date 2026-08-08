import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000;
export const MOBILE_GOOGLE_REDIRECT_URI = 'amika://auth/google';

export type GoogleOAuthState = {
  inviteCode?: string;
  returnUrl?: string;
  platform?: 'mobile';
  issuedAt: number;
  nonce: string;
};

function getStateSecret() {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error('OAuth state secret is not configured');
  return secret;
}

export function sanitizeReturnUrl(value: string | null | undefined) {
  if (!value || value.length > 2048 || !value.startsWith('/') || value.startsWith('//')) return undefined;
  return value;
}

export function createGoogleOAuthState(input: {
  inviteCode?: string | null;
  returnUrl?: string | null;
  platform?: string | null;
}): string {
  const payload: GoogleOAuthState = {
    issuedAt: Date.now(),
    nonce: randomBytes(16).toString('hex'),
  };
  if (input.inviteCode && input.inviteCode.length <= 256) payload.inviteCode = input.inviteCode;
  const returnUrl = sanitizeReturnUrl(input.returnUrl);
  if (returnUrl) payload.returnUrl = returnUrl;
  if (input.platform === 'mobile') payload.platform = 'mobile';

  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', getStateSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyGoogleOAuthState(state: string | null): GoogleOAuthState | null {
  if (!state) return null;
  const [encoded, signature, extra] = state.split('.');
  if (!encoded || !signature || extra) return null;
  const expected = createHmac('sha256', getStateSecret()).update(encoded).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as GoogleOAuthState;
    if (!Number.isFinite(payload.issuedAt) || Date.now() - payload.issuedAt > STATE_TTL_MS || payload.issuedAt > Date.now() + 30_000) return null;
    if (typeof payload.nonce !== 'string' || !payload.nonce) return null;
    if (payload.platform !== undefined && payload.platform !== 'mobile') return null;
    payload.returnUrl = sanitizeReturnUrl(payload.returnUrl);
    return payload;
  } catch {
    return null;
  }
}
