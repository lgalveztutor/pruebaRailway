import { NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios.' }, { status: 400 });
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
    return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
  }

  const { rows: hashRows } = await pool.query(
    'select crypt($1, password_hash) = password_hash as ok from public.profiles where id = $2 limit 1',
    [password, user.id]
  );

  if (!hashRows[0]?.ok) {
    return NextResponse.json({ error: 'Email o contraseña incorrectos.' }, { status: 401 });
  }

  const token = createSessionToken(user);
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre } });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
