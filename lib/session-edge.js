export const SESSION_COOKIE = 'lcg_session';

function getSecret() {
  return process.env.AUTH_SECRET || process.env.DATABASE_URL || 'lcg-dev-secret';
}

function base64UrlToBytes(value) {
  const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((String(value).length + 3) % 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function sign(value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = await sign(encoded);

  if (expected.length !== signature.length) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  if (mismatch !== 0) return null;

  try {
    const base64 = encoded
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(encoded.length / 4) * 4, '=');

    const payload = JSON.parse(atob(base64));

    if (!payload?.id || !payload?.email || !payload?.exp) {
      return null;
    }

    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (e) {
    console.error("ERROR DECODIFICANDO:", e);
    return null;
  }
}