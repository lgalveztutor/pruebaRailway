'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';
import { hoyISO, money } from '@/lib/format';

// Recibe los totales del día (ya calculados en el servidor) para proponer el esperado.
export default function CierreForm({ ingresos, egresos }) {
  const router = useRouter();
  const [apertura, setApertura] = useState('');
  const [realContado, setRealContado] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const esperado = Number(apertura || 0) + Number(ingresos || 0) - Number(egresos || 0);
  const diferencia = realContado === '' ? null : Number(realContado) - esperado;

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (realContado === '') { setMsg({ t: 'err', m: 'Cargá el efectivo contado.' }); return; }
    setLoading(true);
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();
    const { error } = await client.from('cash_closures').insert({
      fecha: hoyISO(),
      usuario_id: user?.id ?? null,
      apertura: Number(apertura || 0),
      ingresos: Number(ingresos || 0),
      egresos: Number(egresos || 0),
      esperado,
      real_contado: Number(realContado),
      diferencia: Number(realContado) - esperado,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setMsg({ t: 'ok', m: 'Cierre guardado.' });
    setApertura(''); setRealContado('');
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
      <p className="section-title">Cierre de caja (hoy)</p>
      <div className="form-row">
        <div className="field small">
          <label>Apertura</label>
          <input type="number" value={apertura} onChange={(e) => setApertura(e.target.value)} placeholder="0" />
        </div>
        <div className="field small">
          <label>Efectivo contado *</label>
          <input type="number" value={realContado} onChange={(e) => setRealContado(e.target.value)} placeholder="0" />
        </div>
        <button className="btn-secondary" disabled={loading}>
          {loading ? 'Guardando…' : 'Cerrar caja'}
        </button>
      </div>

      <div className="form-row" style={{ marginTop: 14, gap: 24 }}>
        <div><span className="kpi-label">Ingresos día</span><div className="kpi-value" style={{ fontSize: 18, color: 'var(--green)' }}>{money(ingresos)}</div></div>
        <div><span className="kpi-label">Egresos día</span><div className="kpi-value" style={{ fontSize: 18, color: 'var(--magenta)' }}>{money(egresos)}</div></div>
        <div><span className="kpi-label">Esperado en caja</span><div className="kpi-value" style={{ fontSize: 18, color: 'var(--cyan)' }}>{money(esperado)}</div></div>
        {diferencia !== null && (
          <div><span className="kpi-label">Diferencia</span><div className="kpi-value" style={{ fontSize: 18, color: diferencia === 0 ? 'var(--green)' : 'var(--yellow)' }}>{money(diferencia)}</div></div>
        )}
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
