import React from 'react';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// matrix[díaIndex][horaIndex] = cantidad ; horas = [12,13,...] ; max = pico
export default function HeatmapOcupacion({ matrix = [], horas = [], max = 1 }) {
  function bg(v) {
    if (!v) return 'rgba(255,255,255,.04)';
    const a = 0.16 + (v / (max || 1)) * 0.74;
    return `rgba(0,229,255,${a.toFixed(2)})`;
  }
  function glow(v) {
    if (!v) return 'none';
    return `0 0 ${(6 + (v / (max || 1)) * 10).toFixed(0)}px rgba(0,229,255,${(0.15 + (v / (max || 1)) * 0.4).toFixed(2)})`;
  }
  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Heatmap de ocupación</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Reservas + cumpleaños + PoolFútbol · por día y hora</div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${horas.length}, 1fr)`, gap: 5, minWidth: 560 }}>
          <div />
          {horas.map((h) => (
            <div key={'h' + h} style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>{h}</div>
          ))}
          {DIAS.map((d, di) => (
            <React.Fragment key={d}>
              <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>{d}</div>
              {horas.map((h, hi) => {
                const v = (matrix[di] && matrix[di][hi]) || 0;
                return (
                  <div key={d + h} title={`${d} ${h}:00 · ${v} evento${v === 1 ? '' : 's'}`}
                    style={{ height: 26, borderRadius: 8, background: bg(v), boxShadow: glow(v), border: '1px solid rgba(255,255,255,.05)' }} />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 11, color: 'var(--muted)' }}>
        <span>Menos</span>
        <span style={{ width: 18, height: 12, borderRadius: 4, background: 'rgba(0,229,255,.16)' }} />
        <span style={{ width: 18, height: 12, borderRadius: 4, background: 'rgba(0,229,255,.5)' }} />
        <span style={{ width: 18, height: 12, borderRadius: 4, background: 'rgba(0,229,255,.9)' }} />
        <span>Más demanda</span>
      </div>
    </div>
  );
}
