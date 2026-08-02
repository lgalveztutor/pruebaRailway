'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

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

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    router.push('/admin/login');
  }

  return (
    <aside className={'admin-sidebar' + (open ? ' open' : '')}>
      <div className="admin-topbar">
        <div className="admin-brand">
          <span className="admin-logo">⚡</span>
          <span>
            <b>LA CHISPA GAMER</b>
            <br />
            <small>1.8 · ADMIN</small>
          </span>
        </div>
        <button
          className="admin-burger"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      <nav className="admin-nav" onClick={() => setOpen(false)}>
        {(() => {
          const rol = user?.rol || null;
          const empleadoAllowed = new Set([
            '/admin/caja',
            '/admin/ventas',
            '/admin/stock',
            '/admin/calendario',
            '/admin/reservas',
          ]);

          const visible = LINKS.filter((l) => {
            if (rol === 'empleado') return empleadoAllowed.has(l.href);
            // dueno, gerente, contador -> all links
            return true;
          });

          return visible.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? 'active' : ''}
            >
              <span aria-hidden>{l.icon}</span>
              {l.label}
            </Link>
          ));
        })()}
      </nav>

      <div className="admin-foot">
        {user?.email && (
          <div className="admin-user" title={user.email}>
            {user.email} ({user.rol})
          </div>
        )}
        <button className="admin-logout" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
