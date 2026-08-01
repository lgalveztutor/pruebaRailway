import { NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';

export async function GET(request) {
  const telefono = String(new URL(request.url).searchParams.get('telefono') || '').trim();
  if (!telefono) return NextResponse.json({ encontrado: false, pct: 0 });

  const pool = getPool();
  const { rows } = await pool.query(
    `select nombre, codigo_referido, descuento_pct, descuento_bienvenida_usado
     from public.clients
     where telefono = $1
     order by created_at asc
     limit 1`,
    [telefono]
  );

  const client = rows[0];
  if (!client) return NextResponse.json({ encontrado: false, pct: 0 });
  const pct = client.codigo_referido && !client.descuento_bienvenida_usado ? Number(client.descuento_pct || 0) : 0;
  return NextResponse.json({ encontrado: true, nombre: client.nombre, pct });
}
