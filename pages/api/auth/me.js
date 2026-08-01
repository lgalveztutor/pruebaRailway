import { verifySessionToken } from '@/lib/session';

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    return sendJson(response, 405, { error: 'Metodo no permitido.' });
  }

  const token = request.cookies?.lcg_session;
  const user = verifySessionToken(token);

  if (!user) {
    return sendJson(response, 401, { user: null });
  }

  return sendJson(response, 200, { user });
}