'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/admin/reservas', label: 'Reservas', icon: '📅' },
  { href: '/admin/cumpleanos', label: 'Cumpleaños', icon: '🎂' },
  { href: '/admin/caja', label: 'Caja diaria', icon: '💵' },
  { href: '/admin/ventas', label: 'Ventas', icon: '🛒' },
  { href: '/admin/poolfutbol', label: 'PoolFútbol', icon: '⚽' },
  { href: '/admin/consolas', label: 'Consolas', icon: '🎮' },
  { href: '/admin/gastos', label: 'Gastos', icon: '📉' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👤' },
  { href: '/admin/stock', label: 'Stock', icon: '📦' },
  { href: '/admin/calendario', label: 'Calendario', icon: '🗓️' },
  { href: '/admin/reportes', label: 'Reportes', icon: '📊' },
];

export default function Sidebar({ userEmail }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* sin sesion activa aun */
    }
    router.push('/admin/login');
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <span className="admin-logo">⚡</span>
        <span>
          <b>LA CHISPA GAMER</b>
          <br />
          <small>1.8 · ADMIN</small>
        </span>
      </div>

      <nav className="admin-nav">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? 'active' : ''}
          >
            <span aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="admin-foot">
        {userEmail && (
          <div className="admin-user" title={userEmail}>
            {userEmail}
          </div>
        )}
        <button className="admin-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
