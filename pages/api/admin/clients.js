import { getPool } from '@/lib/postgres';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const pool = getPool();
  const [clients, leads, guests] = await Promise.all([
    pool.query(`select id, nombre, telefono, email, cumpleanos, codigo_referido, descuento_pct, created_at from public.clients order by created_at desc limit 200`),
    pool.query(`select id, nombre, telefono, experiencia, dia, hora, personas, codigo_referido, created_at from public.web_leads where atendido = false order by created_at desc limit 100`),
    pool.query(`select id, cumple_nombre, cumple_telefono, cumple_fecha, nino_nombre, nino_detalle, adulto_nombre, adulto_telefono, created_at from public.birthday_guests order by created_at desc limit 1000`),
  ]);

  return sendJson(response, 200, { clients: clients.rows, leads: leads.rows, guests: guests.rows });
}