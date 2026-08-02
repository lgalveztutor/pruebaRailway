import { NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session-edge';

// Protege TODAS las rutas /admin (excepto /admin/login).
// Sin sesion valida -> redirige a /admin/login.
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Solo nos importa /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('lcg_session')?.value;
  console.log(request.cookies.get("lcg_session")?.value);
  const user = await verifySessionToken(token);

  console.log("Usuario:", user);
  const isLogin = pathname === '/admin/login';

  // Sin sesion y no esta en login -> al login
  if (!user && !isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    return NextResponse.redirect(redirectUrl);
  }

  // Con sesion y entra al login -> al dashboard
  if (user && isLogin) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
