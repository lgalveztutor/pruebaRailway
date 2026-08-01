import { getPool } from '@/lib/postgres';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const body = request.body || [];
  if (!Array.isArray(body) || body.length === 0) {
    return sendJson(response, 400, { error: 'Lista vacia' });
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
    return sendJson(response, 200, { ok: true });
  } catch (error) {
    await client.query('rollback');
    return sendJson(response, 400, { error: error.message || 'Error' });
  } finally {
    client.release();
  }
}