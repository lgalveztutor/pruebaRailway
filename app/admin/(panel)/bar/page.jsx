import { createClient } from '@/lib/postgres-client.server';
import { money, hoyISO } from '@/lib/format';
import BarForm from '@/components/forms/BarForm';

export const dynamic = 'force-dynamic';

export default async function BarPage() {
  let products = [];
  let ventasBar = [];
  let err = null;
  const client = createClient();
  const hoy = hoyISO();
  const [p, v] = await Promise.all([
    client.from('products').select('id, nombre, precio, stock_actual').eq('activo', true).order('nombre', { ascending: true }),
    client.from('sale_items').select('id, descripcion, cantidad, total, sales!inner(fecha)').eq('categoria', 'bar').gte('sales.fecha', hoy).order('id', { ascending: false }).limit(50),
  ]);
  products = p.data || [];
  ventasBar = v.data || [];
  err = p.error?.message || v.error?.message || null;

  const totalHoy = ventasBar.reduce((a, r) => a + Number(r.total || 0), 0);

  return (
    <div>
      <h1 className="admin-h1">Bar</h1>
      <p className="admin-sub">Ventas del bar. Al cobrar, se descuenta el stock solo.</p>

      {products.length === 0 && !err && (
        <div className="card" style={{ marginBottom: 16 }}>
          <span className="badge badge-soon">Sin productos</span>
          <p style={{ color: 'var(--muted)', marginTop: 12, marginBottom: 0 }}>
            Cargá productos primero en <b>Stock</b> para poder venderlos acá.
          </p>
        </div>
      )}

      <BarForm products={products} />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <p className="section-title" style={{ marginTop: 26 }}>Ventas de bar de hoy · {money(totalHoy)}</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th></tr></thead>
          <tbody>
            {ventasBar.length === 0 && <tr><td colSpan={3} className="empty">Sin ventas de bar hoy.</td></tr>}
            {ventasBar.map((v) => (
              <tr key={v.id}><td>{v.descripcion || '—'}</td><td>{v.cantidad}</td><td>{money(v.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
