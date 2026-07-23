import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de Supabase para Server Components y rutas del lado del servidor.
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component: se ignora, el middleware refresca la sesion.
          }
        },
      },
    }
  );
}

// Helper: indica si Supabase esta configurado (para mostrar mensajes claros antes del Paso 2).
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
