import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/postgres-client.server';

// Shell del panel: sidebar + contenido. Doble barrera de seguridad:
// el middleware ya protege /admin, y acá volvemos a verificar la sesion en el servidor.
export default async function PanelLayout({ children }) {
  let userObj = null;

  const client = createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Sin sesion -> al login (defensa en profundidad, por si falla el middleware).
  if (!user) {
    redirect('/admin/login');
  }
  userObj = user;

  return (
    <div className="admin-shell">
      <Sidebar user={userObj} />
      <main className="admin-main">{children}</main>
    </div>
  );
}
