import { cookies } from 'next/headers';
import { createDbLikeClient, executeDbAction } from '@/lib/db/bridge';
import { withDbSession } from '@/lib/postgres';
import { verifySessionToken } from '@/lib/session';

function authFromRequestCookies(cookieStore) {
  return {
    async getUser() {
      const token = cookieStore.get('lcg_session')?.value;
      const user = verifySessionToken(token);
      return { data: { user }, error: null };
    },
    async signInWithPassword() {
      throw new Error('El login se maneja por /api/auth/login');
    },
    async signOut() {
      return { error: null };
    },
  };
}

async function executeWithServerDb(state) {
  const cookieStore = cookies();
  const user = verifySessionToken(cookieStore.get('lcg_session')?.value);
  if (!user && state.action !== 'select' && state.action !== 'rpc') {
    throw new Error('Sesion requerida');
  }

  return withDbSession(user?.id || null, async (client) => executeDbAction(client, state));
}

export function createClient() {
  const cookieStore = cookies();
  return createDbLikeClient((state) => executeWithServerDb(state), authFromRequestCookies(cookieStore));
}
