import { NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const tipo = String(body?.tipo || '').trim();
  if (!['visita', 'clic_whatsapp'].includes(tipo)) {
    return NextResponse.json({ error: 'Tipo invalido' }, { status: 400 });
  }

  const pool = getPool();
  await pool.query('insert into public.web_events (tipo) values ($1)', [tipo]);
  return NextResponse.json({ ok: true });
}
