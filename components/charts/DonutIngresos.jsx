'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const tooltipStyle = {
  background: 'rgba(16,18,26,.82)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 12,
  color: '#fff',
  boxShadow: '0 10px 30px rgba(0,0,0,.5)',
};

// Servicios (turnos/poolfútbol) vs Productos (buffet/stock)
export default function DonutIngresos({ servicios = 0, productos = 0 }) {
  const data = [
    { name: 'Servicios', value: Number(servicios), color: '#00E5FF' },
    { name: 'Productos', value: Number(productos), color: '#39FF14' },
  ];
  const total = data.reduce((a, r) => a + r.value, 0);
  const fmt = (v) => '$ ' + Number(v).toLocaleString('es-AR');
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);

  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Ingresos del mes</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Servicios vs. Productos</div>

      <div style={{ width: '100%', height: 200, position: 'relative', filter: 'drop-shadow(0 4px 20px rgba(0,229,255,.18))' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius={62} outerRadius={92} paddingAngle={4} cornerRadius={12}
              stroke="none" startAngle={90} endAngle={-270}
            >
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: 'calc(50% - 24px)', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFD700' }}>{fmt(total)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: d.color, boxShadow: `0 0 10px ${d.color}` }} />
            <span style={{ color: '#C0C5D0', fontSize: 13, flex: 1 }}>{d.name}</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{fmt(d.value)}</span>
            <span style={{ color: 'var(--muted)', fontSize: 12, width: 38, textAlign: 'right' }}>{pct(d.value)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
