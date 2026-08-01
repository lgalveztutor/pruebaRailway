import { getPool } from '@/lib/postgres';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const body = request.body || {};
  const telefono = String(body?.telefono || '').trim();
  if (!telefono) return sendJson(response, 200, { encontrado: false, pct: 0 });

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
      return sendJson(response, 200, { encontrado: false, pct: 0 });
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
    return sendJson(response, 200, {
      encontrado: true,
      client_id: clientRow.id,
      nombre: clientRow.nombre,
      pct,
      visitas: updatedRows[0]?.visitas || clientRow.visitas || 0,
    });
  } catch (error) {
    await client.query('rollback');
    return sendJson(response, 400, { error: error.message || 'Error' });
  } finally {
    client.release();
  }
}