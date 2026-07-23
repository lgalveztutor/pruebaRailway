'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

// data: [{ name, value }] en orden (arriba -> abajo del embudo)
const COLORS = ['#00E5FF', '#FFD700', '#FF00FF', '#39FF14'];

const tooltipStyle = {
  background: 'rgba(16,18,26,.82)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,.14)',
  borderRadius: 12,
  color: '#fff',
  boxShadow: '0 10px 30px rgba(0,0,0,.5)',
};

export default function FunnelConversion({ data = [] }) {
  const base = data[0]?.value || 0;
  const cerr = data[data.length - 1]?.value || 0;
  const conv = base > 0 ? ((cerr / base) * 100).toFixed(1) : '0';

  // Cada etapa con su % respecto a la cima (para las barras escalonadas).
  const rows = data.map((d, i) => ({
    ...d,
    pct: base > 0 ? Math.round((d.value / base) * 100) : 0,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Embudo de conversión</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Del visitante web a la reserva</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#FFD700', fontWeight: 800, fontSize: 20 }}>{conv}%</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>conversión total</div>
        </div>
      </div>

      <div style={{ width: '100%', height: 230, marginTop: 6, filter: 'drop-shadow(0 4px 18px rgba(0,229,255,.18))' }}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={rows} margin={{ left: 6, right: 54, top: 6, bottom: 6 }} barCategoryGap="24%">
            <XAxis type="number" hide domain={[0, base || 1]} />
            <YAxis
              type="category" dataKey="name" width={112}
              tick={{ fill: '#C0C5D0', fontSize: 12, fontWeight: 600 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,.04)' }}
              formatter={(v, _n, p) => [`${Number(v).toLocaleString('es-AR')} · ${p.payload.pct}%`, 'Cantidad']}
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={26} isAnimationActive>
              {rows.map((r, i) => <Cell key={i} fill={r.fill} />)}
              <LabelList dataKey="value" position="right" fill="#fff" style={{ fontSize: 12, fontWeight: 800 }}
                formatter={(v) => Number(v).toLocaleString('es-AR')} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
