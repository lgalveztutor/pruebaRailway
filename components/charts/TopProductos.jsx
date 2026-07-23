// data: [{ nombre, cantidad, stock, reorden, alerta }]  ·  lista limpia glassmorphic
const RANK = ['#00E5FF', '#39FF14', '#FFD700', '#FF00FF', '#9AA0AE'];

export default function TopProductos({ data = [] }) {
  const enAlerta = data.filter((d) => d.alerta);

  return (
    <div className="glass" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Top 5 productos vendidos</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Con punto de reorden</div>
        </div>
        {enAlerta.length > 0 && (
          <span className="trend-badge trend-down">⚠ {enAlerta.length} a reponer</span>
        )}
      </div>

      {data.length === 0 ? (
        <p className="empty" style={{ marginTop: 10 }}>Sin ventas de productos todavía.</p>
      ) : (
        <div>
          {data.map((d, i) => {
            const color = RANK[i % RANK.length];
            const inicial = (d.nombre || '?').trim().charAt(0).toUpperCase();
            return (
              <div className="dash-list-row" key={d.nombre + i}>
                <div className="dash-ico" style={{ background: `${color}22`, color, boxShadow: `0 0 12px ${color}33` }}>{inicial}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.nombre}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>{d.cantidad} u. vendidas</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: d.alerta ? '#FF00FF' : '#39FF14', fontWeight: 700, fontSize: 14 }}>{d.stock} en stock</div>
                  <div style={{ color: 'var(--muted)', fontSize: 11 }}>{d.alerta ? 'reponer' : 'ok'} · min {d.reorden}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
