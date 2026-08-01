import { getPool } from '@/lib/postgres';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const body = request.body || {};
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
  return sendJson(response, 200, { ok: true });
}