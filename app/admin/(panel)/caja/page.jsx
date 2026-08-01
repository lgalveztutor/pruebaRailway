import { createClient } from '@/lib/postgres-client';
import { money, hoyISO, fechaCorta } from '@/lib/format';
import CajaMovForm from '@/components/forms/CajaMovForm';
import CierreForm from '@/components/forms/CierreForm';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  let movs = [];
  let cierres = [];
  let err = null;
  const hoy = hoyISO();

  const supabase = createClient();
  const [m, c] = await Promise.all([
    supabase.from('cash_movements')
      .select('id, tipo, monto, medio_pago, concepto, created_at')
      .eq('fecha', hoy)
      .order('id', { ascending: false }),
    supabase.from('cash_closures')
      .select('id, fecha, apertura, ingresos, egresos, esperado, real_contado, diferencia')
      .order('fecha', { ascending: false })
      .limit(15),
  ]);
  movs = m.data || [];
  cierres = c.data || [];
  err = m.error?.message || c.error?.message || null;

  const ingresos = movs.filter((x) => x.tipo === 'ingreso').reduce((a, r) => a + Number(r.monto || 0), 0);
  const egresos = movs.filter((x) => x.tipo === 'egreso').reduce((a, r) => a + Number(r.monto || 0), 0);

  return (
    <div>
      <h1 className="admin-h1">Caja diaria</h1>
      <p className="admin-sub">Movimientos del día y cierre de caja.</p>

      <CajaMovForm />
      <CierreForm ingresos={ingresos} egresos={egresos} />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <p className="section-title" style={{ marginTop: 26 }}>Movimientos de hoy</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead>
            <tr><th>Hora</th><th>Tipo</th><th>Medio</th><th>Concepto</th><th>Monto</th></tr>
          </thead>
          <tbody>
            {movs.length === 0 && (
              <tr><td colSpan={5} className="empty">Sin movimientos hoy.</td></tr>
            )}
            {movs.map((m) => (
              <tr key={m.id}>
                <td>{m.created_at ? new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td><span className={'pill ' + (m.tipo === 'ingreso' ? 'realizada' : 'cancelada')}>{m.tipo}</span></td>
                <td>{m.medio_pago || '—'}</td>
                <td>{m.concepto || '—'}</td>
                <td style={{ color: m.tipo === 'ingreso' ? 'var(--green)' : 'var(--magenta)' }}>{money(m.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="section-title" style={{ marginTop: 26 }}>Últimos cierres</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead>
            <tr><th>Fecha</th><th>Apertura</th><th>Ingresos</th><th>Egresos</th><th>Esperado</th><th>Contado</th><th>Diferencia</th></tr>
          </thead>
          <tbody>
            {cierres.length === 0 && (
              <tr><td colSpan={7} className="empty">Todavía no hay cierres.</td></tr>
            )}
            {cierres.map((c) => (
              <tr key={c.id}>
                <td>{fechaCorta(c.fecha)}</td>
                <td>{money(c.apertura)}</td>
                <td>{money(c.ingresos)}</td>
                <td>{money(c.egresos)}</td>
                <td>{money(c.esperado)}</td>
                <td>{money(c.real_contado)}</td>
                <td style={{ color: Number(c.diferencia) === 0 ? 'var(--green)' : 'var(--yellow)' }}>{money(c.diferencia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
