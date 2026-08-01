import { createDbLikeClient } from '@/lib/db/bridge';

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'No se pudo completar la operacion.');
  }

  return payload;
}

function authAdapter() {
  return {
    async getUser() {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const payload = await response.json().catch(() => ({ user: null }));
      if (!response.ok) {
        return { data: { user: null }, error: null };
      }
      return { data: { user: payload.user }, error: null };
    },
    async signInWithPassword(credentials) {
      const payload = await requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials || {}),
      });
      return { data: payload, error: null };
    },
    async signOut() {
      await requestJson('/api/auth/logout', { method: 'POST' });
      return { error: null };
    },
  };
}

export function createClient() {
  return createDbLikeClient((state) => requestJson('/api/db', {
    method: 'POST',
    body: JSON.stringify({ state }),
  }), authAdapter());
}
