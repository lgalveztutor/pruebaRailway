import { getPool } from '@/lib/postgres';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const body = request.body || {};
  const tipo = String(body?.tipo || '').trim();
  if (!['visita', 'clic_whatsapp'].includes(tipo)) {
    return sendJson(response, 400, { error: 'Tipo invalido' });
  }

  const pool = getPool();
  await pool.query('insert into public.web_events (tipo) values ($1)', [tipo]);
  return sendJson(response, 200, { ok: true });
}