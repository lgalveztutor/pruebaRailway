import { NextResponse } from 'next/server';
import { getPool } from '@/lib/postgres';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const telefono = String(body?.telefono || '').trim();
  if (!telefono) return NextResponse.json({ encontrado: false, pct: 0 });

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('begin');
    const { rows } = await client.query(
      `select * from public.clients where telefono = $1 order by created_at asc limit 1 for update`,
      [telefono]
    );
    const clientRow = rows[0];
    if (!clientRow) {
      await client.query('commit');
      return NextResponse.json({ encontrado: false, pct: 0 });
    }

    const pct = clientRow.codigo_referido && !clientRow.descuento_bienvenida_usado ? Number(clientRow.descuento_pct || 0) : 0;
    const { rows: updatedRows } = await client.query(
      `update public.clients
       set visitas = coalesce(visitas, 0) + 1,
           descuento_bienvenida_usado = case
             when codigo_referido is not null and coalesce(descuento_bienvenida_usado, false) = false then true
             else descuento_bienvenida_usado
           end
       where id = $1
       returning id, nombre, visitas`,
      [clientRow.id]
    );

    await client.query('commit');
    return NextResponse.json({
      encontrado: true,
      client_id: clientRow.id,
      nombre: clientRow.nombre,
      pct,
      visitas: updatedRows[0]?.visitas || clientRow.visitas || 0,
    });
  } catch (error) {
    await client.query('rollback');
    return NextResponse.json({ error: error.message || 'Error' }, { status: 400 });
  } finally {
    client.release();
  }
}
