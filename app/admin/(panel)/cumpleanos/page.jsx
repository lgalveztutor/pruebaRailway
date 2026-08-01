import { createClient } from '@/lib/postgres-client';
import { fechaCorta, money } from '@/lib/format';
import CumpleForm from '@/components/forms/CumpleForm';

export const dynamic = 'force-dynamic';

export default async function CumpleanosPage() {
  let rows = [];
  let err = null;
  const supabase = createClient();
  const { data, error } = await supabase
    .from('birthday_reservations')
    .select('id, cumpleanero, edad, fecha, horario, cant_chicos, cant_adultos, pack, sena, total, estado')
    .order('fecha', { ascending: false })
    .limit(200);
  rows = data || [];
  if (error) err = error.message;

  return (
    <div>
      <h1 className="admin-h1">Cumpleaños</h1>
      <p className="admin-sub">Reservas de cumpleaños y su estado.</p>

      <CumpleForm />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Fecha</th><th>Hora</th><th>Cumpleañero</th><th>Edad</th><th>Chicos</th><th>Adultos</th><th>Pack</th><th>Seña</th><th>Total</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} className="empty">Todavía no hay cumpleaños cargados.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{fechaCorta(c.fecha)}</td>
                <td>{c.horario ? String(c.horario).slice(0, 5) : '—'}</td>
                <td>{c.cumpleanero}</td>
                <td>{c.edad ?? '—'}</td>
                <td>{c.cant_chicos ?? '—'}</td>
                <td>{c.cant_adultos ?? '—'}</td>
                <td>{c.pack || '—'}</td>
                <td>{money(c.sena)}</td>
                <td>{money(c.total)}</td>
                <td><span className={'pill ' + (c.estado || 'consultado')}>{c.estado || 'consultado'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
