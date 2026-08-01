import { executeDbAction } from '@/lib/db/bridge';
import { withDbSession } from '@/lib/postgres';
import { verifySessionToken } from '@/lib/session';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const state = request.body?.state;
  if (!state || typeof state !== 'object') {
    return sendJson(response, 400, { error: 'Solicitud de BD invalida.' });
  }

  const user = verifySessionToken(request.cookies?.lcg_session);
  if (!user && state.action !== 'select' && state.action !== 'rpc') {
    return sendJson(response, 401, { error: 'Sesion requerida.' });
  }

  try {
    const result = await withDbSession(user?.id || null, async (client) => executeDbAction(client, state));
    return sendJson(response, 200, result);
  } catch (error) {
    return sendJson(response, 500, { error: error.message || 'No se pudo ejecutar la consulta.' });
  }
}