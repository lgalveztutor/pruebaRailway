import { createClient } from '@/lib/postgres-client.server';
import { fechaCorta, money } from '@/lib/format';
import PoolForm from '@/components/forms/PoolForm';

export const dynamic = 'force-dynamic';

export default async function PoolPage() {
  let rows = [];
  let err = null;
  const client = createClient();
  const { data, error } = await client
    .from('poolfootball_sessions')
    .select('id, fecha, inicio, fin, jugadores, precio, estado, medio_pago')
    .order('fecha', { ascending: false })
    .order('id', { ascending: false })
    .limit(200);
  rows = data || [];
  if (error) err = error.message;

  return (
    <div>
      <h1 className="admin-h1">PoolFútbol</h1>
      <p className="admin-sub">Turnos y uso de la mesa de PoolFútbol.</p>

      <PoolForm />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Fecha</th><th>Inicio</th><th>Fin</th><th>Jugadores</th><th>Precio</th><th>Medio</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="empty">Todavía no hay turnos cargados.</td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id}>
                <td>{fechaCorta(s.fecha)}</td>
                <td>{s.inicio ? String(s.inicio).slice(0, 5) : '—'}</td>
                <td>{s.fin ? String(s.fin).slice(0, 5) : '—'}</td>
                <td>{s.jugadores ?? '—'}</td>
                <td>{money(s.precio)}</td>
                <td>{s.medio_pago || '—'}</td>
                <td><span className={'pill ' + (s.estado || 'reservada')}>{s.estado || 'reservada'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
