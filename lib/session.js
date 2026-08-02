import crypto from 'crypto';

export const SESSION_COOKIE = 'lcg_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || 'lcg-dev-secret';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function createSessionToken(user) {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
    exp: Date.now() + SESSION_TTL_MS,
  });
  const encoded = base64UrlEncode(payload);
  const signature = sign(encoded);

  console.log("ENCODED:", encoded);
  console.log("SIGNATURE:", signature);

  return `${encoded}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encoded));
    if (!payload?.id || !payload?.email || !payload?.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
