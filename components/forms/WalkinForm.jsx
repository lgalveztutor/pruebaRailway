'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';
import { hoyISO, money, PRECIO_HORA } from '@/lib/format';
import { previewDescuento, consumirDescuento, aplicarPct } from '@/lib/descuento';

const SECTORES = ['PlayStation 5', 'Realidad Virtual', 'PoolFútbol', 'Consolas', 'Metegol', 'Combo completo'];
const MEDIOS = ['efectivo', 'transferencia', 'mercadopago', 'mixto'];

function categoriaDeSector(sector) {
  if (sector === 'PoolFútbol') return 'poolfutbol';
  if (sector === 'Consolas' || sector === 'PlayStation 5') return 'consolas';
  return 'alquiler';
}

function sumarHoras(hhmm, horas) {
  if (!hhmm) return null;
  const [h, m] = String(hhmm).split(':').map(Number);
  const d = new Date();
  d.setHours(h + Number(horas), m, 0, 0);
  return d.toTimeString().slice(0, 5);
}

export default function WalkinForm() {
  const router = useRouter();
  const ahora = () => new Date().toTimeString().slice(0, 5);
  const [f, setF] = useState({
    encargado: '', telefono: '', personas: '', sector: 'PlayStation 5', horas: '1',
    precio: String(PRECIO_HORA), pago_total: String(PRECIO_HORA),
    medio_pago: 'efectivo', hora_pedida: ahora(),
  });
  const [desc, setDesc] = useState({ pct: 0, nombre: null, encontrado: false });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Recalcula precio de lista y pago (con descuento) según las horas.
  function updHoras(e) {
    const horas = e.target.value;
    const base = Number(horas || 0) * PRECIO_HORA;
    setF({ ...f, horas, precio: String(base), pago_total: String(aplicarPct(base, desc.pct)) });
  }

  // Al salir del campo teléfono: busca si al cliente le corresponde el 10% de bienvenida.
  async function buscarCliente() {
    const info = await previewDescuento(f.telefono);
    const pct = Number(info?.pct || 0);
    setDesc({ pct, nombre: info?.nombre || null, encontrado: !!info?.encontrado });
    const base = Number(f.precio || 0);
    setF((prev) => ({ ...prev, pago_total: String(aplicarPct(base, pct)) }));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.encargado.trim()) { setMsg({ t: 'err', m: 'Cargá el encargado del grupo.' }); return; }
    setLoading(true);
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();

    // Consumir descuento de bienvenida (marca usado + suma visita de fidelidad).
    let pctReal = 0;
    if (f.telefono.trim()) {
      const r = await consumirDescuento(f.telefono);
      pctReal = Number(r?.pct || 0);
    }

    const base = Number(f.precio || 0);
    // Si hay descuento real, el total se calcula solo; si no, se respeta lo que puso el encargado.
    const pago = pctReal > 0 ? aplicarPct(base, pctReal) : (f.pago_total ? Number(f.pago_total) : 0);
    const montoDesc = pctReal > 0 ? (base - pago) : 0;
    const horaFin = f.hora_pedida && f.horas ? sumarHoras(f.hora_pedida, f.horas) : null;

    // 1) Orden de llegada
    const { error } = await client.from('walkin_orders').insert({
      fecha: hoyISO(),
      encargado: f.encargado.trim(),
      telefono: f.telefono.trim() || null,
      personas: f.personas ? Number(f.personas) : null,
      sector: `${f.sector} · ${f.horas}h`,
      precio: base,
      pago_total: pago,
      descuento_pct: pctReal,
      medio_pago: f.medio_pago,
      hora_pedida: f.hora_pedida || null,
      hora_terminada: horaFin,
      estado: 'activa',
      usuario_id: user?.id ?? null,
    });
    if (error) { setLoading(false); setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }

    // 2) Venta automática (servicio) para Caja y Reportes
    if (pago > 0) {
      const { data: sale } = await client.from('sales').insert({
        fecha: hoyISO(), total: pago, descuento: montoDesc, medio_pago: f.medio_pago, empleado_id: user?.id ?? null,
      }).select('id').single();
      if (sale?.id) {
        await client.from('sale_items').insert({
          sale_id: sale.id, categoria: categoriaDeSector(f.sector),
          descripcion: `${f.sector} · ${f.horas}h · ${f.encargado.trim()}${pctReal > 0 ? ` · -${pctReal}% bienvenida` : ''}`,
          cantidad: 1, precio_unit: pago, total: pago,
        });
      }
    }

    setLoading(false);
    setF({ ...f, encargado: '', telefono: '', personas: '', horas: '1', precio: String(PRECIO_HORA), pago_total: String(PRECIO_HORA), hora_pedida: ahora() });
    setDesc({ pct: 0, nombre: null, encontrado: false });
    setMsg({ t: 'ok', m: 'Orden de llegada cargada.' + (pctReal > 0 ? ` Descuento de bienvenida ${pctReal}% aplicado.` : '') });
    router.refresh();
  }

  const base = Number(f.precio || 0);

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nueva orden de llegada</p>
      <div className="form-row">
        <div className="field"><label>Encargado del grupo *</label><input value={f.encargado} onChange={upd('encargado')} placeholder="Nombre" /></div>
        <div className="field"><label>Teléfono</label><input value={f.telefono} onChange={upd('telefono')} onBlur={buscarCliente} placeholder="Para descuento de bienvenida" /></div>
        <div className="field small"><label>Personas</label><input type="number" value={f.personas} onChange={upd('personas')} placeholder="0" /></div>
        <div className="field"><label>Sector</label>
          <select value={f.sector} onChange={upd('sector')}>{SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div className="field small"><label>Horas</label>
          <select value={f.horas} onChange={updHoras}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => <option key={h} value={h}>{h} h</option>)}
          </select>
        </div>
        <div className="field small"><label>Hora pedida</label><input type="time" value={f.hora_pedida} onChange={upd('hora_pedida')} /></div>
        <div className="field small"><label>Precio lista</label><input type="number" value={f.precio} onChange={upd('precio')} placeholder="0" /></div>
        <div className="field small"><label>Pago total *</label><input type="number" value={f.pago_total} onChange={upd('pago_total')} placeholder="0" /></div>
        <div className="field"><label>Método de pago</label>
          <select value={f.medio_pago} onChange={upd('medio_pago')}>{MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Cargar'}</button>
      </div>

      {desc.encontrado && desc.pct > 0 && (
        <div className="form-msg" style={{ color: 'var(--green)' }}>
          ✓ {desc.nombre} tiene <strong>{desc.pct}% de bienvenida</strong> por referido · total: <s style={{ color: 'var(--muted)' }}>{money(base)}</s> → <strong>{money(aplicarPct(base, desc.pct))}</strong> (automático, una sola vez)
        </div>
      )}
      {desc.encontrado && desc.pct === 0 && f.telefono.trim() && (
        <div className="form-msg" style={{ color: 'var(--muted)' }}>Cliente {desc.nombre} · sin descuento (ya usó su bienvenida). Suma visita de fidelidad.</div>
      )}

      {f.horas && f.hora_pedida && (
        <div className="form-msg" style={{ color: 'var(--cyan)' }}>
          {f.horas}h × {money(PRECIO_HORA)} = {money(Number(f.horas) * PRECIO_HORA)} · de {f.hora_pedida} a {sumarHoras(f.hora_pedida, f.horas)}
          <span style={{ color: 'var(--muted)' }}> (el precio se puede ajustar a mano si hace falta)</span>
        </div>
      )}
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
