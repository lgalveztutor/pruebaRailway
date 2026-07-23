import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Protege TODAS las rutas /admin (excepto /admin/login).
// Sin sesion valida -> redirige a /admin/login.
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Solo nos importa /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Si Supabase todavia no esta configurado (antes del Paso 2), dejamos pasar
  // para poder ver el esqueleto del panel en desarrollo.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
