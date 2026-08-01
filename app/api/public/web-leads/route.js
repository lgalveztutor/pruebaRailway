import { NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const pool = getPool();
  await pool.query(
    `insert into public.web_leads
     (nombre, telefono, experiencia, dia, hora, personas, codigo_referido)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      body?.nombre || null,
      body?.telefono || null,
      body?.experiencia || null,
      body?.dia || null,
      body?.hora || null,
      body?.personas ?? null,
      body?.codigo_referido || null,
    ]
  );
  return NextResponse.json({ ok: true });
}
