import { getPool } from '@/lib/postgres';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const telefono = String(request.query?.telefono || '').trim();
  if (!telefono) return sendJson(response, 200, { encontrado: false, pct: 0 });

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
  if (!client) return sendJson(response, 200, { encontrado: false, pct: 0 });
  const pct = client.codigo_referido && !client.descuento_bienvenida_usado ? Number(client.descuento_pct || 0) : 0;
  return sendJson(response, 200, { encontrado: true, nombre: client.nombre, pct });
}