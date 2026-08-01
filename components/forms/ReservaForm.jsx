'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';
import { hoyISO, money } from '@/lib/format';
import { previewDescuento, consumirDescuento, aplicarPct } from '@/lib/descuento';

const TIPOS = ['general', 'poolfutbol', 'consolas', 'cumpleanos', 'por_hora'];

export default function ReservaForm() {
  const router = useRouter();
  const [f, setF] = useState({ nombre: '', telefono: '', fecha: hoyISO(), hora: '', personas: '', tipo: 'general', sena: '', total_estimado: '' });
  const [desc, setDesc] = useState({ pct: 0, nombre: null, encontrado: false });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Al salir del campo teléfono: busca si al cliente le corresponde el 10% de bienvenida.
  async function buscarCliente() {
    const info = await previewDescuento(f.telefono);
    setDesc({ pct: Number(info?.pct || 0), nombre: info?.nombre || null, encontrado: !!info?.encontrado });
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.nombre.trim()) { setMsg({ t: 'err', m: 'Cargá el nombre del cliente.' }); return; }
    if (!f.fecha) { setMsg({ t: 'err', m: 'Cargá la fecha.' }); return; }
    setLoading(true);
    const client = createClient();

    // Descuento de bienvenida automático (una sola vez + suma visita de fidelidad).
    let pctReal = 0;
    if (f.telefono.trim()) {
      const r = await consumirDescuento(f.telefono);
      pctReal = Number(r?.pct || 0);
    }
    const baseTotal = f.total_estimado ? Number(f.total_estimado) : 0;
    const totalFinal = pctReal > 0 ? aplicarPct(baseTotal, pctReal) : baseTotal;

    const { error } = await client.from('reservations').insert({
      nombre: f.nombre.trim(),
      telefono: f.telefono || null,
      fecha: f.fecha,
      hora: f.hora || null,
      personas: f.personas ? Number(f.personas) : null,
      tipo: f.tipo,
      sena: f.sena ? Number(f.sena) : 0,
      total_estimado: totalFinal,
      estado: 'pendiente',
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setF({ ...f, nombre: '', telefono: '', hora: '', personas: '', sena: '', total_estimado: '' });
    setDesc({ pct: 0, nombre: null, encontrado: false });
    setMsg({ t: 'ok', m: 'Reserva creada.' + (pctReal > 0 ? ` Descuento de bienvenida ${pctReal}% aplicado al total.` : '') });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nueva reserva</p>
      <div className="form-row">
        <div className="field"><label>Cliente *</label><input value={f.nombre} onChange={upd('nombre')} placeholder="Nombre" /></div>
        <div className="field"><label>Teléfono</label><input value={f.telefono} onChange={upd('telefono')} onBlur={buscarCliente} placeholder="Para descuento de bienvenida" /></div>
        <div className="field small"><label>Fecha *</label><input type="date" min={hoyISO()} value={f.fecha} onChange={upd('fecha')} /></div>
        <div className="field small"><label>Hora</label><input type="time" value={f.hora} onChange={upd('hora')} /></div>
        <div className="field small"><label>Personas</label><input type="number" value={f.personas} onChange={upd('personas')} placeholder="0" /></div>
        <div className="field"><label>Tipo</label>
          <select value={f.tipo} onChange={upd('tipo')}>{TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </div>
        <div className="field small"><label>Seña</label><input type="number" value={f.sena} onChange={upd('sena')} placeholder="0" /></div>
        <div className="field small"><label>Total est.</label><input type="number" value={f.total_estimado} onChange={upd('total_estimado')} placeholder="0" /></div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Crear'}</button>
      </div>

      {desc.encontrado && desc.pct > 0 && (
        <div className="form-msg" style={{ color: 'var(--green)' }}>
          ✓ {desc.nombre} tiene <strong>{desc.pct}% de bienvenida</strong> por referido{f.total_estimado ? <> · total: <s style={{ color: 'var(--muted)' }}>{money(Number(f.total_estimado))}</s> → <strong>{money(aplicarPct(Number(f.total_estimado), desc.pct))}</strong></> : ''} (automático, una sola vez)
        </div>
      )}
      {desc.encontrado && desc.pct === 0 && f.telefono.trim() && (
        <div className="form-msg" style={{ color: 'var(--muted)' }}>Cliente {desc.nombre} · sin descuento (ya usó su bienvenida). Suma visita de fidelidad.</div>
      )}
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
