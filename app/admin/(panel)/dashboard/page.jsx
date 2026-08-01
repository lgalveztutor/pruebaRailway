import { createClient } from '@/lib/postgres-client';
import { money, hoyISO, offsetISO } from '@/lib/format';
import { tipoVenta } from '@/lib/categorias';
import FunnelConversion from '@/components/charts/FunnelConversion';
import DonutIngresos from '@/components/charts/DonutIngresos';
import HeatmapOcupacion from '@/components/charts/HeatmapOcupacion';
import TopProductos from '@/components/charts/TopProductos';

export const dynamic = 'force-dynamic';

function ayerISO() {
  return offsetISO(-1);
}

async function getKpis(supabase, hoy) {
  const ayer = ayerISO();
  const [ventas, ventasAyer, gastos, gastosAyer, caja, productos, reservasHoy, cumpleProx, clientesNuevos] = await Promise.all([
    supabase.from('sales').select('total').eq('fecha', hoy),
    supabase.from('sales').select('total').eq('fecha', ayer),
    supabase.from('expenses').select('monto').eq('fecha', hoy),
    supabase.from('expenses').select('monto').eq('fecha', ayer),
    supabase.from('cash_movements').select('tipo, monto').eq('fecha', hoy),
    supabase.from('products').select('stock_actual, stock_min'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('fecha', hoy),
    supabase.from('birthday_reservations').select('id', { count: 'exact', head: true }).gte('fecha', hoy).neq('estado', 'cancelado'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).gte('created_at', hoy + 'T00:00:00'),
  ]);
  const sum = (rows, key) => (rows || []).reduce((a, r) => a + Number(r[key] || 0), 0);
  const ventasHoy = sum(ventas.data, 'total');
  const ventasAy = sum(ventasAyer.data, 'total');
  const gastosHoy = sum(gastos.data, 'monto');
  const gastosAy = sum(gastosAyer.data, 'monto');
  const ing = (caja.data || []).filter((m) => m.tipo === 'ingreso').reduce((a, r) => a + Number(r.monto || 0), 0);
  const egr = (caja.data || []).filter((m) => m.tipo === 'egreso').reduce((a, r) => a + Number(r.monto || 0), 0);
  const trend = (hoyV, ayerV) => {
    if (!ayerV) return null;
    return Math.round(((hoyV - ayerV) / ayerV) * 100);
  };
  return {
    ventasHoy, gastosHoy, ganancia: ventasHoy - gastosHoy, cajaHoy: ing - egr,
    ventasTrend: trend(ventasHoy, ventasAy), gastosTrend: trend(gastosHoy, gastosAy),
    reservasHoy: reservasHoy.count || 0, cumpleProx: cumpleProx.count || 0,
    clientesNuevos: clientesNuevos.count || 0,
    stockBajo: (productos.data || []).filter((p) => Number(p.stock_actual) <= Number(p.stock_min)).length,
  };
}

async function getCharts(supabase) {
  const mesInicio = hoyISO().slice(0, 8) + '01';
  const [visitas, clics, consultas, reservasCnt, resv, cumples, pools, donutRaw, topRaw] = await Promise.all([
    supabase.from('web_events').select('id', { count: 'exact', head: true }).eq('tipo', 'visita'),
    supabase.from('web_events').select('id', { count: 'exact', head: true }).eq('tipo', 'clic_whatsapp'),
    supabase.from('web_leads').select('id', { count: 'exact', head: true }),
    supabase.from('reservations').select('id', { count: 'exact', head: true }),
    supabase.from('reservations').select('fecha, hora').limit(2000),
    supabase.from('birthday_reservations').select('fecha, horario').limit(2000),
    supabase.from('poolfootball_sessions').select('fecha, inicio').limit(2000),
    supabase.from('sale_items').select('categoria, total, sales!inner(fecha)').gte('sales.fecha', mesInicio),
    supabase.from('sale_items').select('product_id, cantidad, products(nombre, stock_actual, stock_min)').not('product_id', 'is', null).limit(3000),
  ]);

  const funnel = [
    { name: 'Visitas web', value: visitas.count || 0 },
    { name: 'Clics WhatsApp', value: clics.count || 0 },
    { name: 'Consultas', value: consultas.count || 0 },
    { name: 'Reservas', value: reservasCnt.count || 0 },
  ];

  const HORAS = [];
  for (let h = 12; h <= 23; h++) HORAS.push(h);
  const matrix = Array.from({ length: 7 }, () => Array(HORAS.length).fill(0));
  const add = (fecha, hora) => {
    if (!fecha || !hora) return;
    const p = String(fecha).split('-').map(Number);
    if (p.length !== 3) return;
    const dow = (new Date(p[0], p[1] - 1, p[2]).getDay() + 6) % 7;
    const hi = parseInt(String(hora).slice(0, 2), 10) - 12;
    if (hi < 0 || hi >= HORAS.length) return;
    matrix[dow][hi]++;
  };
  (resv.data || []).forEach((r) => add(r.fecha, r.hora));
  (cumples.data || []).forEach((c) => add(c.fecha, c.horario));
  (pools.data || []).forEach((pp) => add(pp.fecha, pp.inicio));
  let maxHeat = 1;
  matrix.forEach((row) => row.forEach((v) => { if (v > maxHeat) maxHeat = v; }));

  let servicios = 0, productos = 0;
  for (const it of (donutRaw.data || [])) {
    const t = Number(it.total || 0);
    if (tipoVenta(it.categoria) === 'producto') productos += t; else servicios += t;
  }

  const agg = {};
  for (const it of (topRaw.data || [])) {
    const key = it.product_id;
    if (!key) continue;
    if (!agg[key]) agg[key] = { nombre: it.products?.nombre || 'Producto', cantidad: 0, stock: Number(it.products?.stock_actual ?? 0), reorden: Number(it.products?.stock_min ?? 0) };
    agg[key].cantidad += Number(it.cantidad || 0);
  }
  const top = Object.values(agg).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5)
    .map((p) => ({ ...p, alerta: p.stock <= p.reorden || p.stock <= 0 }));

  return { funnel, heat: { matrix, horas: HORAS, max: maxHeat }, donut: { servicios, productos }, top };
}

function TrendBadge({ v }) {
  if (v === null || v === undefined) return null;
  const up = v >= 0;
  return <span className={'trend-badge ' + (up ? 'trend-up' : 'trend-down')}>{up ? '▲' : '▼'} {Math.abs(v)}%</span>;
}

export default async function DashboardPage() {
  let k = null, charts = null, err = null;
  try {
    const supabase = createClient();
    [k, charts] = await Promise.all([getKpis(supabase, hoyISO()), getCharts(supabase)]);
  } catch (e) { err = e.message; }

  const cards = [
    { label: 'Ventas del día', value: k ? money(k.ventasHoy) : '$ —', color: '#39FF14', trend: k?.ventasTrend },
    { label: 'Gastos del día', value: k ? money(k.gastosHoy) : '$ —', color: '#FF00FF', trend: k?.gastosTrend },
    { label: 'Ganancia estimada', value: k ? money(k.ganancia) : '$ —', color: '#FFD700' },
    { label: 'Caja (hoy)', value: k ? money(k.cajaHoy) : '$ —', color: '#00E5FF' },
    { label: 'Reservas de hoy', value: k ? k.reservasHoy : '—', color: '#00E5FF' },
    { label: 'Cumpleaños próximos', value: k ? k.cumpleProx : '—', color: '#FF00FF' },
    { label: 'Clientes nuevos (hoy)', value: k ? k.clientesNuevos : '—', color: '#FFD700' },
    { label: 'Stock bajo', value: k ? k.stockBajo : '—', color: '#FF00FF' },
  ];

  return (
    <div className="dash-wrap">
      <h1 className="admin-h1" style={{ marginBottom: 2 }}>Mi Dashboard</h1>
      <p className="admin-sub" style={{ marginBottom: 18 }}>Resumen y analítica en vivo · La Chispa Gamer 1.8</p>

      {err && (
        <div className="glass" style={{ padding: 16, marginBottom: 18, borderColor: 'rgba(255,0,255,.35)' }}>
          <span className="form-msg err">No se pudieron leer los datos: {err}</span>
        </div>
      )}

      {/* ===== Fila 1 · KPIs ===== */}
      <div className="dash-kpis">
        {cards.map((c) => (
          <div className="glass kpi-tile" key={c.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.label}</div>
              <TrendBadge v={c.trend} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 6, textShadow: `0 0 18px ${c.color}44` }}>{c.value}</div>
          </div>
        ))}
      </div>

      {charts && (
        <>
          {/* ===== Fila 2 · Embudo (2/3) + Donut (1/3) ===== */}
          <div className="dash-bento">
            <FunnelConversion data={charts.funnel} />
            <DonutIngresos servicios={charts.donut.servicios} productos={charts.donut.productos} />
          </div>

          {/* ===== Fila 3 · Heatmap full width ===== */}
          <div style={{ marginTop: 16 }}>
            <HeatmapOcupacion matrix={charts.heat.matrix} horas={charts.heat.horas} max={charts.heat.max} />
          </div>

          {/* ===== Fila 4 · Top 5 ===== */}
          <div style={{ marginTop: 16 }}>
            <TopProductos data={charts.top} />
          </div>
        </>
      )}

    </div>
  );
}
