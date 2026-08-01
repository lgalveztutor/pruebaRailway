import { getPool } from '@/lib/postgres';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const body = request.body || {};
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) {
    return sendJson(response, 400, { error: 'Email y contraseña son obligatorios.' });
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `select id, nombre, email, rol, activo, password_hash
     from public.profiles
     where lower(email) = $1
     limit 1`,
    [email]
  );

  const user = rows[0];
  if (!user || !user.activo) {
    return sendJson(response, 401, { error: 'Email o contraseña incorrectos.' });
  }

  const { rows: hashRows } = await pool.query(
    'select crypt($1, password_hash) = password_hash as ok from public.profiles where id = $2 limit 1',
    [password, user.id]
  );

  if (!hashRows[0]?.ok) {
    return sendJson(response, 401, { error: 'Email o contraseña incorrectos.' });
  }

  const token = createSessionToken(user);
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${Math.floor(60 * 60 * 24 * 7)}`);
  return sendJson(response, 200, { ok: true, user: { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre } });
}