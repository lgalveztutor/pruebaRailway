import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { fechaCorta, money, hoyISO } from '@/lib/format';
import GastoForm from '@/components/forms/GastoForm';

export const dynamic = 'force-dynamic';

const sumar = (arr) => arr.reduce((a, r) => a + Number(r.monto || 0), 0);

function TablaGastos({ items }) {
  return (
    <div className="table-wrap" style={{ marginTop: 0 }}>
      <table className="data">
        <thead>
          <tr><th>Categoría</th><th>Concepto</th><th>Medio</th><th>Monto</th></tr>
        </thead>
        <tbody>
          {items.map((g) => (
            <tr key={g.id}>
              <td>{g.categoria || '—'}</td>
              <td>{g.concepto || '—'}</td>
              <td>{g.medio_pago || '—'}</td>
              <td style={{ color: 'var(--magenta)' }}>{money(g.monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function GastosPage() {
  let rows = [];
  let err = null;
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('expenses')
      .select('id, fecha, categoria, concepto, monto, medio_pago')
      .order('fecha', { ascending: false })
      .order('id', { ascending: false })
      .limit(500);
    rows = data || [];
    if (error) err = error.message;
  }

  const hoy = hoyISO();
  const gastosHoy = rows.filter((g) => g.fecha === hoy);
  const totalHoy = sumar(gastosHoy);

  // Días anteriores agrupados
  const porDia = {};
  for (const g of rows) {
    if (g.fecha === hoy) continue;
    (porDia[g.fecha] = porDia[g.fecha] || []).push(g);
  }
  const dias = Object.keys(porDia).sort().reverse();

  return (
    <div>
      <h1 className="admin-h1">Gastos</h1>
      <p className="admin-sub">Registro de egresos por categoría.</p>

      <GastoForm />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      {/* ===== Gastos de hoy ===== */}
      <p className="section-title" style={{ marginTop: 26, color: 'var(--magenta)', fontSize: 17, fontWeight: 800, letterSpacing: '.1em' }}>
        Gastos de hoy · {money(totalHoy)}
      </p>
      {gastosHoy.length === 0
        ? <p className="empty" style={{ marginTop: 4 }}>Sin gastos cargados hoy.</p>
        : <TablaGastos items={gastosHoy} />}

      {/* ===== Historial (días anteriores, colapsable) ===== */}
      {dias.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: 30, fontSize: 17, fontWeight: 800, letterSpacing: '.1em' }}>
            Historial de días anteriores
          </p>
          {dias.map((d) => (
            <details key={d} style={{ marginTop: 10, border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,.02)' }}>
              <summary style={{ cursor: 'pointer', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
                <span>📅 {fechaCorta(d)} <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 13 }}>· {porDia[d].length} gasto{porDia[d].length > 1 ? 's' : ''}</span></span>
                <span style={{ color: 'var(--magenta)' }}>{money(sumar(porDia[d]))}</span>
              </summary>
              <TablaGastos items={porDia[d]} />
            </details>
          ))}
        </>
      )}
    </div>
  );
}
