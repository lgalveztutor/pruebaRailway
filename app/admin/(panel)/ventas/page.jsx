import { createClient } from '@/lib/postgres-client.server';
import { money, fechaCorta } from '@/lib/format';
import { tipoVenta, LABEL_CATEGORIA } from '@/lib/categorias';
import VentaForm from '@/components/forms/VentaForm';
import EditarVentaItem from '@/components/EditarVentaItem';

export const dynamic = 'force-dynamic';

// Orden fijo de secciones dentro de cada día
const ORDEN_PRODUCTO = ['snacks', 'bebidas', 'bar', 'combos'];
const LABEL_SECCION = { snacks: 'Snacks', bebidas: 'Bebidas', bar: 'Comida', combos: 'Combos' };
const COLOR_SECCION = { snacks: '#FFD166', bebidas: '#19D3FF', bar: '#FF6B6B', combos: '#9CFF2E' };

// Primera letra en mayúscula para textos sueltos (coca cola -> Coca cola, efectivo -> Efectivo)
function cap(s) {
  const t = String(s ?? '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—';
}

// Mismas columnas en TODAS las tablas de productos para que las filas queden parejas
function ColsProducto() {
  return (
    <colgroup>
      <col style={{ width: '34%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '24%' }} />
    </colgroup>
  );
}

const H_SECCION = { margin: 0, padding: '14px 16px 6px', fontSize: 17, fontWeight: 800, letterSpacing: '.1em' };

function TablaServicios({ filas }) {
  const total = filas.reduce((a, r) => a + Number(r.total || 0), 0);
  return (
    <>
      <p className="section-title" style={{ marginTop: 26, color: 'var(--cyan)', fontSize: 17, fontWeight: 800, letterSpacing: '.1em' }}>Servicios · {money(total)}</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data" style={{ tableLayout: 'fixed', width: '100%' }}>
          <colgroup>
            <col style={{ width: '12%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <thead>
            <tr><th>Fecha</th><th>Detalle</th><th>Categoría</th><th>Cant.</th><th>Medio</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={7} className="empty">Sin registros.</td></tr>}
            {filas.map((r) => (
              <tr key={r.id}>
                <td>{fechaCorta(r.fecha)}</td>
                <td>{cap(r.detalle)}</td>
                <td>{cap(LABEL_CATEGORIA[r.categoria] || r.categoria)}</td>
                <td>{r.cantidad}</td>
                <td>{cap(r.medio)}</td>
                <td style={{ color: 'var(--cyan)' }}>{money(r.total)}</td>
                <td><EditarVentaItem id={r.id} descripcion={r.detalle} duplicado={r.duplicado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Un día de productos: secciones fijas por categoría + resumen de consumo del día
function DiaProductos({ fecha, filas }) {
  const totalDia = filas.reduce((a, r) => a + Number(r.total || 0), 0);

  // Resumen: total consumido hoy por producto (agrupado por nombre)
  const consumo = {};
  for (const r of filas) {
    const nombre = cap(r.detalle);
    const key = nombre.toLowerCase();
    if (!consumo[key]) consumo[key] = { nombre, cantidad: 0, total: 0 };
    consumo[key].cantidad += Number(r.cantidad || 0);
    consumo[key].total += Number(r.total || 0);
  }
  const resumen = Object.values(consumo).sort((a, b) => b.cantidad - a.cantidad);

  return (
    <div style={{ marginTop: 22, border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Fecha del día en texto */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,.035)' }}>
        <strong style={{ fontSize: 16 }}>📅 {fechaCorta(fecha)}</strong>
        <span style={{ color: 'var(--green)', fontWeight: 700 }}>{money(totalDia)}</span>
      </div>

      {/* Secciones fijas: Snacks / Bebidas / Comida / Combos — todas con columnas parejas */}
      {ORDEN_PRODUCTO.map((cat) => {
        const items = filas.filter((r) => r.categoria === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <p style={{ ...H_SECCION, color: COLOR_SECCION[cat] }}>{LABEL_SECCION[cat].toUpperCase()}</p>
            <div className="table-wrap" style={{ marginTop: 0 }}>
              <table className="data" style={{ tableLayout: 'fixed', width: '100%' }}>
                <ColsProducto />
                <thead>
                  <tr><th>Detalle</th><th>Cant.</th><th>Medio</th><th>Total</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id}>
                      <td>{cap(r.detalle)}</td>
                      <td>{r.cantidad}</td>
                      <td>{cap(r.medio)}</td>
                      <td style={{ color: 'var(--green)' }}>{money(r.total)}</td>
                      <td><EditarVentaItem id={r.id} descripcion={r.detalle} duplicado={r.duplicado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Apartado: consumo total del día por producto */}
      <div style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,.02)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, letterSpacing: '.1em', color: 'var(--muted, #9AA0AE)' }}>CONSUMO DEL DÍA</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {resumen.map((p) => (
            <span key={p.nombre} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', fontSize: 13 }}>
              {p.nombre} · Consumidas hoy: <strong style={{ color: 'var(--green)' }}>{p.cantidad}</strong> · {money(p.total)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function VentasPage() {
  let productos = [];
  let stockProducts = [];
  let err = null;

  const client = createClient();
  const { data, error } = await supabase
    .from('sale_items')
    .select('id, descripcion, categoria, cantidad, total, sales!inner(fecha, medio_pago)')
    .order('id', { ascending: false })
    .limit(300);
  err = error?.message || null;
  const { data: sp } = await supabase
    .from('products')
    .select('id, nombre, categoria, precio, stock_actual')
    .eq('activo', true)
    .order('nombre', { ascending: true });
  stockProducts = sp || [];
  for (const it of data || []) {
    const fila = {
      id: it.id,
      detalle: it.descripcion || LABEL_CATEGORIA[it.categoria] || 'Venta',
      categoria: it.categoria,
      cantidad: it.cantidad,
      total: it.total,
      fecha: it.sales?.fecha,
      medio: it.sales?.medio_pago,
    };
    // Ventas = SOLO productos. Los servicios se agendan en Reservas.
    if (tipoVenta(it.categoria) === 'producto') productos.push(fila);
  }

  // Detectar repetidos: mismo día + mismo detalle + misma cantidad + mismo total
  const vistos = {};
  for (const lista of [productos]) {
    for (const r of lista) {
      const key = [r.fecha, String(r.detalle).trim().toLowerCase(), r.cantidad, r.total].join('|');
      if (vistos[key]) { r.duplicado = true; vistos[key].duplicado = true; }
      else vistos[key] = r;
    }
  }

  // Productos agrupados por día (más reciente primero)
  const porDia = {};
  for (const p of productos) {
    const f = p.fecha || 'sin-fecha';
    if (!porDia[f]) porDia[f] = [];
    porDia[f].push(p);
  }
  const dias = Object.keys(porDia).sort().reverse();

  const totalProductos = productos.reduce((a, r) => a + Number(r.total || 0), 0);

  return (
    <div>
      <h1 className="admin-h1">Ventas</h1>
      <p className="admin-sub">Venta de productos. Se elige del Stock y descuenta el inventario automáticamente. Los servicios se agendan en Reservas.</p>

      <VentaForm products={stockProducts} />

      {err && <p className="form-msg err" style={{ marginTop: 16 }}>Error: {err}</p>}

      <p className="section-title" style={{ marginTop: 30, color: 'var(--green)', fontSize: 17, fontWeight: 800, letterSpacing: '.1em' }}>Productos · {money(totalProductos)}</p>
      {dias.length === 0 && <p className="empty" style={{ marginTop: 8 }}>Sin registros.</p>}
      {dias.map((f) => (
        <DiaProductos key={f} fecha={f === 'sin-fecha' ? null : f} filas={porDia[f]} />
      ))}
    </div>
  );
}
