import { Pool } from 'pg';

let pool;

function getConnectionOptions() {
  const connectionString = process.env.NEXT_PUBLIC_DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no esta configurada');
  }

  const ssl = process.env.POSTGRES_SSL === 'false'
    ? false
    : { rejectUnauthorized: false };

  return { connectionString, ssl };
}

export function getPool() {
  if (!pool) {
    pool = new Pool(getConnectionOptions());
  }
  return pool;
}

export async function withDbSession(sessionUserId, handler) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    if (sessionUserId) {
      await client.query("select set_config('app.user_id', $1, true)", [sessionUserId]);
    }
    const result = await handler(client);
    await client.query('commit');
    return result;
  } catch (error) {
    try {
      await client.query('rollback');
    } catch {
      // ignore rollback errors
    }
    throw error;
  } finally {
    client.release();
  }
}
