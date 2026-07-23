import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { money, hoyISO, fechaCorta, PRECIO_HORA } from '@/lib/format';
import { tipoVenta, LABEL_CATEGORIA } from '@/lib/categorias';
import { clasificacionDe, depreciacionMensual } from '@/lib/finanzas';
import ExportCSV from '@/components/ExportCSV';

export const dynamic = 'force-dynamic';

function rango(p) {
  const hoy = hoyISO();
  if (p === 'hoy') return { start: hoy, end: hoy, label: 'Hoy' };
  if (p === 'semana') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { start: d.toISOString().slice(0, 10), end: hoy, label: 'Últimos 7 días' };
  }
  return { start: hoy.slice(0, 8) + '01', end: hoy, label: 'Este mes' };
}

function agrupar(items) {
  const agg = {};
  for (const it of items) {
    const k = it.descripcion || LABEL_CATEGORIA[it.categoria] || 'Otros';
    agg[k] = agg[k] || { cant: 0, total: 0 };
    agg[k].cant += Number(it.cantidad || 0);
    agg[k].total += Number(it.total || 0);
  }
  return Object.entries(agg).map(([nombre, v]) => ({ nombre, ...v })).sort((a, b) => b.total - a.total);
}

export default async function ReportesPage({ searchParams }) {
  const p = ['hoy', 'semana', 'mes'].includes(searchParams?.p) ? searchParams.p : 'mes';
  const { start, end, label } = rango(p);

  let items = [], gastos = [], productosStock = [];
  let reservasCount = 0, cumplesCount = 0;
  let fin = null;
  let err = null;

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const mesInicio = hoyISO().slice(0, 8) + '01';
    const mesYYYYMM = hoyISO().slice(0, 7);
    const [si, g, r, b, prod, gm, cx, sm] = await Promise.all([
      supabase.from('sale_items').select('descripcion, categoria, cantidad, total, sales!inner(fecha, medio_pago)').gte('sales.fecha', start).lte('sales.fecha', end),
      supabase.from('expenses').select('id, fecha, categoria, concepto, monto').gte('fecha', start).lte('fecha', end).order('fecha', { ascending: false }),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).gte('fecha', start).lte('fecha', end),
      supabase.from('birthday_reservations').select('id', { count: 'exact', head: true }).gte('fecha', start).lte('fecha', end),
      supabase.from('products').select('nombre, stock_actual, stock_min'),
      // Finanzas (siempre del mes en curso):
      supabase.from('expenses').select('categoria, clasificacion, monto, fecha, vida_util_meses').gte('fecha', mesInicio),
      supabase.from('expenses').select('categoria, clasificacion, monto, fecha, vida_util_meses').eq('clasificacion', 'capex'),
      supabase.from('sale_items').select('categoria, total, sales!inner(fecha)').gte('sales.fecha', mesInicio),
    ]);
    items = si.data || [];
    gastos = g.data || [];
    reservasCount = r.count || 0;
    cumplesCount = b.count || 0;
    productosStock = prod.data || [];
    err = si.error?.message || g.error?.message || null;

    // ---- Motor financiero (mes en curso) ----
    let opexFijo = 0, opexVariable = 0, capexMes = 0;
    for (const e of (gm.data || [])) {
      const m = Number(e.monto || 0);
      const c = clasificacionDe(e);
      if (c === 'opex_fijo') opexFijo += m;
      else if (c === 'capex') capexMes += m;
      else opexVariable += m;
    }
    let depreMes = 0;
    for (const a of (cx.data || [])) depreMes += depreciacionMensual(a, mesYYYYMM);
    let ingServ = 0, ingProd = 0;
    for (const it of (sm.data || [])) {
      const t = Number(it.total || 0);
      if (tipoVenta(it.categoria) === 'producto') ingProd += t; else ingServ += t;
    }
    const ingresosMes = ingServ + ingProd;
    // Ganancia real: usa la depreciación en vez del CAPEX lump.
    const gananciaReal = ingresosMes - opexFijo - opexVariable - depreMes;
    const horasNecesarias = PRECIO_HORA > 0 ? Math.ceil(opexFijo / PRECIO_HORA) : 0;
    const horasVendidas = PRECIO_HORA > 0 ? Math.floor(ingServ / PRECIO_HORA) : 0;
    const progreso = horasNecesarias > 0 ? Math.min(100, Math.round((horasVendidas / horasNecesarias) * 100)) : (opexFijo === 0 ? 100 : 0);
    fin = { opexFijo, opexVariable, capexMes, depreMes, ingresosMes, gananciaReal, horasNecesarias, horasVendidas, progreso, faltan: Math.max(0, horasNecesarias - horasVendidas) };
  }

  const servicios = items.filter((it) => tipoVenta(it.categoria) === 'servicio');
  const productos = items.filter((it) => tipoVenta(it.categoria) === 'producto');
  const totalServicios = servicios.reduce((a, r) => a + Number(r.total || 0), 0);
  const totalProductos = productos.reduce((a, r) => a + Number(r.total || 0), 0);
  const totalVentas = totalServicios + totalProductos;
  const totalGastos = gastos.reduce((a, r) => a + Number(r.monto || 0), 0);
  const ganancia = totalVentas - totalGastos;
  const stockBajo = productosStock.filter((x) => Number(x.stock_actual) <= Number(x.stock_min));

  const kpis = [
    { label: 'Total vendido', value: money(totalVentas), color: 'var(--yellow)' },
    { label: 'Servicios', value: money(totalServicios), color: 'var(--cyan)' },
    { label: 'Productos', value: money(totalProductos), color: 'var(--green)' },
    { label: 'Gastos', value: money(totalGastos), color: 'var(--magenta)' },
    { label: 'Ganancia', value: money(ganancia), color: 'var(--yellow)' },
    { label: 'Reservas', value: reservasCount, color: 'var(--cyan)' },
    { label: 'Cumpleaños', value: cumplesCount, color: 'var(--magenta)' },
    { label: 'Stock bajo', value: stockBajo.length, color: 'var(--magenta)' },
  ];

  const aggServ = agrupar(servicios);
  const aggProd = agrupar(productos);

  const tab = (key, txt) => (
    <Link href={`/admin/reportes?p=${key}`} className={'tabbtn' + (p === key ? ' active' : '')}>{txt}</Link>
  );

  const Detalle = ({ titulo, filas, color, subtotal }) => (
    <>
      <p className="section-title" style={{ marginTop: 26, color }}>{titulo} · {money(subtotal)}</p>
      <div className="table-wrap" style={{ marginTop: 0 }}>
        <table className="data">
          <thead><tr><th>Detalle</th><th>Cantidad</th><th>Total</th></tr></thead>
          <tbody>
            {filas.length === 0 && <tr><td colSpan={3} className="empty">Sin registros en el período.</td></tr>}
            {filas.map((t) => (
              <tr key={t.nombre}><td>{t.nombre}</td><td>{t.cant}</td><td style={{ color }}>{money(t.total)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div>
      <h1 className="admin-h1">Reportes</h1>
      <p className="admin-sub">Resumen del negocio · {label} ({fechaCorta(start)} a {fechaCorta(end)})</p>

      <div className="cal-head">
        {tab('hoy', 'Hoy')}
        {tab('semana', 'Semana')}
        {tab('mes', 'Mes')}
      </div>

      {err && <p className="form-msg err">Error: {err}</p>}

      <div className="kpi-grid">
        {kpis.map((k) => (
          <div className="card" key={k.label}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
        <ExportCSV
          filename={`ventas-${start}-a-${end}.csv`}
          headers={['Tipo', 'Detalle', 'Categoría', 'Cantidad', 'Total']}
          rows={items.map((it) => [tipoVenta(it.categoria), it.descripcion || '', LABEL_CATEGORIA[it.categoria] || it.categoria, it.cantidad, it.total])}
        />
        <ExportCSV
          filename={`gastos-${start}-a-${end}.csv`}
          headers={['Fecha', 'Categoría', 'Concepto', 'Monto']}
          rows={gastos.map((g) => [g.fecha, g.categoria || '', g.concepto || '', g.monto])}
        />
      </div>

      <Detalle titulo="Servicios ofrecidos" filas={aggServ} color="var(--cyan)" subtotal={totalServicios} />
      <Detalle titulo="Productos vendidos" filas={aggProd} color="var(--green)" subtotal={totalProductos} />

      {stockBajo.length > 0 && (
        <>
          <p className="section-title" style={{ marginTop: 26 }}>Alertas de stock bajo</p>
          <div className="table-wrap" style={{ marginTop: 0 }}>
            <table className="data">
              <thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead>
              <tbody>
                {stockBajo.map((s) => (
                  <tr key={s.nombre}><td>{s.nombre}</td><td style={{ color: 'var(--magenta)', fontWeight: 700 }}>{s.stock_actual}</td><td>{s.stock_min}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {fin && (
        <>
          <p className="section-title" style={{ marginTop: 34, fontSize: 17, fontWeight: 800, letterSpacing: '.1em' }}>💰 Finanzas del mes</p>
          <div className="kpi-grid">
            {[
              { label: 'OPEX Fijo · alquiler, sueldos', value: money(fin.opexFijo), color: 'var(--magenta)' },
              { label: 'OPEX Variable · mercadería', value: money(fin.opexVariable), color: 'var(--magenta)' },
              { label: 'CAPEX del mes · inversión', value: money(fin.capexMes), color: 'var(--cyan)' },
              { label: 'Depreciación del mes', value: money(fin.depreMes), color: 'var(--yellow)' },
              { label: 'Ganancia real (con depreciación)', value: money(fin.gananciaReal), color: fin.gananciaReal >= 0 ? 'var(--green)' : 'var(--magenta)' },
            ].map((c) => (
              <div className="card" key={c.label}><div className="kpi-label">{c.label}</div><div className="kpi-value" style={{ color: c.color }}>{c.value}</div></div>
            ))}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <p className="section-title">🎯 Punto de equilibrio (cubrir OPEX Fijo)</p>
            <p style={{ color: 'var(--muted)', margin: '0 0 12px', fontSize: 14 }}>
              Necesitás vender <strong style={{ color: 'var(--cyan)' }}>{fin.horasNecesarias} horas de servicio</strong> (${PRECIO_HORA.toLocaleString('es-AR')} c/u) este mes para cubrir el OPEX Fijo de {money(fin.opexFijo)}.
            </p>
            <div style={{ height: 14, borderRadius: 999, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: fin.progreso + '%', background: fin.progreso >= 100 ? 'var(--green)' : 'var(--cyan)', borderRadius: 999, transition: 'width .4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: 'var(--muted)' }}>
              <span>Vendidas: <strong style={{ color: 'var(--text)' }}>{fin.horasVendidas} h</strong></span>
              <span>{fin.progreso}%</span>
              <span>{fin.faltan > 0 ? <>Faltan <strong style={{ color: 'var(--yellow)' }}>{fin.faltan} h</strong></> : <strong style={{ color: 'var(--green)' }}>¡Cubierto! 🎉</strong>}</span>
            </div>
            <p style={{ color: 'var(--muted)', margin: '12px 0 0', fontSize: 12 }}>Los productos del buffet suman aparte; este cálculo usa las horas de servicio (${PRECIO_HORA.toLocaleString('es-AR')}) como driver principal.</p>
          </div>
        </>
      )}
    </div>
  );
}
