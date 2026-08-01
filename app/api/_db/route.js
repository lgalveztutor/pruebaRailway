import { NextResponse } from 'next/server';
import { executeDbAction } from '@/lib/db/bridge';
import { getPool, withDbSession } from '@/lib/postgres';
import { verifySessionToken } from '@/lib/session';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const state = body?.state;

  if (!state?.action) {
    return NextResponse.json({ error: 'Solicitud invalida' }, { status: 400 });
  }

  const token = request.cookies.get('lcg_session')?.value;
  const user = verifySessionToken(token);
  const pool = getPool();

  try {
    const result = await withDbSession(user?.id || null, async (client) => executeDbAction(client, state));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Error de base de datos' }, { status: 400 });
  }
}
