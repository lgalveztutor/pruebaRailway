import Link from 'next/link';
import { createClient } from '@/lib/postgres-client.server';
import { hoyISO } from '@/lib/format';
import CalendarDay from '@/components/CalendarDay';

export const dynamic = 'force-dynamic';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DOW = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function pad(n) { return String(n).padStart(2, '0'); }

export default async function CalendarioPage({ searchParams }) {
  const hoy = hoyISO();
  const now = new Date();
  const mParam = searchParams?.m; // 'YYYY-MM'
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-based
  if (mParam && /^\d{4}-\d{2}$/.test(mParam)) {
    year = Number(mParam.slice(0, 4));
    month = Number(mParam.slice(5, 7)) - 1;
  }

  const start = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;

  let reservas = [];
  let cumples = [];
  let err = null;
  const supabase = createClient();
  const [r, b] = await Promise.all([
    supabase.from('reservations').select('id, fecha, hora, nombre, tipo').gte('fecha', start).lte('fecha', end),
    supabase.from('birthday_reservations').select('id, fecha, horario, cumpleanero').gte('fecha', start).lte('fecha', end),
  ]);
  reservas = r.data || [];
  cumples = b.data || [];
  err = r.error?.message || b.error?.message || null;

  // Mapa fecha -> eventos
  const eventos = {};
  const push = (fecha, ev) => { (eventos[fecha] = eventos[fecha] || []).push(ev); };
  reservas.forEach((r) => push(r.fecha, { tipo: 'res', hora: r.hora ? String(r.hora).slice(0, 5) : '', href: `/admin/reservas#r${r.id}`, txt: (r.hora ? String(r.hora).slice(0, 5) + ' ' : '') + (r.nombre || 'Reserva') }));
  cumples.forEach((c) => push(c.fecha, { tipo: 'bday', hora: c.horario ? String(c.horario).slice(0, 5) : '', href: `/admin/reservas#b${c.id}`, txt: (c.horario ? String(c.horario).slice(0, 5) + ' ' : '') + '🎂 ' + (c.cumpleanero || 'Cumple') }));
  // Ordena cada día por hora
  Object.values(eventos).forEach((list) => list.sort((a, z) => String(a.hora).localeCompare(String(z.hora))));

  // Grilla (arranca lunes)
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = lunes
  const celdas = [];
  for (let i = 0; i < firstDow; i++) celdas.push(null);
  for (let d = 1; d <= lastDay; d++) celdas.push(d);
  while (celdas.length % 7 !== 0) celdas.push(null);

  const prev = month === 0 ? `${year - 1}-12` : `${year}-${pad(month)}`;
  const next = month === 11 ? `${year + 1}-01` : `${year}-${pad(month + 2)}`;

  return (
    <div>
      <h1 className="admin-h1">Calendario</h1>
      <p className="admin-sub">Reservas y cumpleaños del mes.</p>

      <div className="cal-head">
        <Link href={`/admin/calendario?m=${prev}`}>← Anterior</Link>
        <span className="cal-title">{MESES[month]} {year}</span>
        <Link href={`/admin/calendario?m=${next}`}>Siguiente →</Link>
        <Link href="/admin/calendario">Hoy</Link>
      </div>

      {err && <p className="form-msg err">Error: {err}</p>}

      <div className="cal-grid">
        {DOW.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
        {celdas.map((d, i) => {
          if (d === null) return <div className="cal-cell empty" key={i} />;
          const fecha = `${year}-${pad(month + 1)}-${pad(d)}`;
          const evs = eventos[fecha] || [];
          return <CalendarDay day={d} events={evs} isToday={fecha === hoy} key={i} />;
        })}
      </div>
    </div>
  );
}
