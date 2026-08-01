import { createClient } from '@/lib/postgres-client.server';
import { money, fechaCorta } from '@/lib/format';
import ProductoForm from '@/components/forms/ProductoForm';
import StockMovForm from '@/components/forms/StockMovForm';
import MermaForm from '@/components/forms/MermaForm';
import CampoEditable from '@/components/CampoEditable';
import ToggleActivo from '@/components/ToggleActivo';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  let rows = [];
  let mermas = [];
  let err = null;
  const client = createClient();
  const [p, m] = await Promise.all([
    client.from('products')
      .select('id, nombre, categoria, stock_actual, stock_min, costo, precio, proveedor, activo')
      .order('nombre', { ascending: true }).limit(300),
    client.from('stock_movements')
      .select('id, cantidad, motivo, fecha, products(nombre)')
      .ilike('motivo', 'Devolución%')
      .order('fecha', { ascending: false }).limit(15),
  ]);
  rows = p.data || [];
  mermas = m.data || [];
  if (p.error) err = p.error.message;

  const bajos = rows.filter((x) => Number(x.stock_actual) <= Number(x.stock_min)).length;
  const productosLite = rows.map((p) => ({ id: p.id, nombre: p.nombre, stock_actual: p.stock_actual }));

  return (
    <div>
      <h1 className="admin-h1">Stock</h1>
      <p className="admin-sub">Inventario, alertas de bajo stock y movimientos. {bajos > 0 && <span className="pill cancelada">{bajos} con stock bajo</span>}</p>

      <ProductoForm />
      <StockMovForm products={productosLite} />
      <MermaForm products={productosLite} />

      {/* Aviso de novedades: qué vino vencido o dañado */}
      {mermas.length > 0 && (
        <div className="card" style={{ marginTop: 16, borderColor: 'rgba(255,209,102,.4)' }}>
          <p className="section-title" style={{ color: 'var(--yellow)' }}>⚠ Novedades — vencidos / dañados</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mermas.map((mv) => (
              <div key={mv.id} style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                {fechaCorta(String(mv.fecha).slice(0, 10))} · <strong style={{ color: 'var(--text)' }}>{mv.cantidad} u.</strong> de <strong style={{ color: 'var(--text)' }}>{mv.products?.nombre || 'producto'}</strong> — {String(mv.motivo).replace('Devolución: ', '')}
              </div>
            ))}
          </div>
        </div>
      )}

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Mín.</th><th>Costo</th><th>Precio</th><th>Proveedor</th><th>Disponible</th><th>Stock</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} className="empty">Todavía no hay productos cargados.</td></tr>
            )}
            {rows.map((p) => {
              const bajo = Number(p.stock_actual) <= Number(p.stock_min);
              return (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria || '—'}</td>
                  <td style={{ color: bajo ? 'var(--magenta)' : 'var(--text)', fontWeight: bajo ? 700 : 400 }}>{p.stock_actual}</td>
                  <td>{p.stock_min}</td>
                  <td>{money(p.costo)}</td>
                  <td><CampoEditable tabla="products" id={p.id} campo="precio" value={p.precio} /></td>
                  <td>{p.proveedor || '—'}</td>
                  <td><ToggleActivo id={p.id} activo={p.activo} /></td>
                  <td>{bajo ? <span className="pill cancelada">bajo</span> : <span className="pill realizada">ok</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
