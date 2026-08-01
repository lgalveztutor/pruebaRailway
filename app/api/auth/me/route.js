import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export async function GET(request) {
  const token = request.cookies.get('lcg_session')?.value;
  const user = verifySessionToken(token);

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
