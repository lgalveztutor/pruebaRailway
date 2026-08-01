import { NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';

export async function POST(request) {
  const body = await request.json().catch(() => []);
  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: 'Lista vacia' }, { status: 400 });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    for (const guest of body) {
      await client.query(
        `insert into public.birthday_guests
         (cumple_nombre, cumple_telefono, cumple_fecha, nino_nombre, nino_detalle, adulto_nombre, adulto_telefono)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          guest?.cumple_nombre || null,
          guest?.cumple_telefono || null,
          guest?.cumple_fecha || null,
          guest?.nino_nombre || null,
          guest?.nino_detalle || null,
          guest?.adulto_nombre || null,
          guest?.adulto_telefono || null,
        ]
      );
    }
    await client.query('commit');
    return NextResponse.json({ ok: true });
  } catch (error) {
    await client.query('rollback');
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  } finally {
    client.release();
  }
}
