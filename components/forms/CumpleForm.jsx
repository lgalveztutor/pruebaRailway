'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hoyISO, money } from '@/lib/format';
import { previewDescuento, consumirDescuento, aplicarPct } from '@/lib/descuento';

const ESTADOS = ['consultado', 'senado', 'confirmado', 'realizado', 'cancelado'];

// Packs oficiales de cumpleaños (precios/beneficios definidos por los dueños).
// Todos usan "Uso exclusivo del salón". Al elegir uno, se autocompleta el total.
const PACKS = [
  {
    v: 'Easy', color: '#9CFF2E', precio: 600000, duracion: '3 horas', ninos: 25, adultos: 15,
    incluye: ['Uso exclusivo del salón', 'Sin servicio extra de catering'],
  },
  {
    v: 'Medium', color: '#FFD166', precio: 800000, duracion: '3 horas', ninos: 25, adultos: 15,
    incluye: ['Uso exclusivo del salón', 'Pizza libre', 'Snacks libres', 'Bebida libre'],
  },
  {
    v: 'Hard', color: '#FF4D4D', precio: 1000000, duracion: '3 horas', ninos: 25, adultos: 15,
    incluye: ['Uso exclusivo del salón', 'Pizza libre', 'Snacks libres', 'Bebida libre', 'Panchos', 'Nuggets'],
  },
  {
    v: 'Leyenda', color: '#FFB400', precio: 1300000, duracion: '3 horas', ninos: 25, adultos: 15,
    incluye: ['Uso exclusivo del salón', 'Pizza libre', 'Snacks libres', 'Bebida libre', 'Panchos', 'Nuggets', 'Tequeños', 'Papas fritas', 'Regalo especial para el agasajado', 'Presente para cada niño invitado'],
  },
];

export default function CumpleForm() {
  const router = useRouter();
  const [f, setF] = useState({
    cumpleanero: '', telefono: '', edad: '', fecha: hoyISO(), horario: '',
    cant_chicos: '', cant_adultos: '', pack: '', sena: '', total: '', estado: 'consultado',
  });
  const [desc, setDesc] = useState({ pct: 0, nombre: null, encontrado: false });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const packSel = PACKS.find((p) => p.v === f.pack);

  // Al salir del campo teléfono: busca si al cliente le corresponde el 10% de bienvenida.
  async function buscarCliente() {
    const info = await previewDescuento(f.telefono);
    setDesc({ pct: Number(info?.pct || 0), nombre: info?.nombre || null, encontrado: !!info?.encontrado });
  }

  // Al elegir un pack: autocompleta el total con el precio del pack.
  function elegirPack(e) {
    const val = e.target.value;
    const p = PACKS.find((x) => x.v === val);
    setF({ ...f, pack: val, total: p ? String(p.precio) : f.total });
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.cumpleanero.trim()) { setMsg({ t: 'err', m: 'Cargá el nombre del cumpleañero.' }); return; }
    if (!f.fecha) { setMsg({ t: 'err', m: 'Cargá la fecha del evento.' }); return; }
    setLoading(true);
    const supabase = createClient();

    // Descuento de bienvenida automático (una sola vez + suma visita de fidelidad).
    let pctReal = 0;
    if (f.telefono.trim()) {
      const r = await consumirDescuento(f.telefono);
      pctReal = Number(r?.pct || 0);
    }
    const baseTotal = f.total ? Number(f.total) : 0;
    const totalFinal = pctReal > 0 ? aplicarPct(baseTotal, pctReal) : baseTotal;

    const { error } = await supabase.from('birthday_reservations').insert({
      cumpleanero: f.cumpleanero.trim(),
      edad: f.edad ? Number(f.edad) : null,
      fecha: f.fecha,
      horario: f.horario || null,
      cant_chicos: f.cant_chicos ? Number(f.cant_chicos) : null,
      cant_adultos: f.cant_adultos ? Number(f.cant_adultos) : null,
      pack: f.pack || null,
      sena: f.sena ? Number(f.sena) : 0,
      total: totalFinal,
      estado: f.estado,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setF({ ...f, cumpleanero: '', telefono: '', edad: '', horario: '', cant_chicos: '', cant_adultos: '', pack: '', sena: '', total: '', estado: 'consultado' });
    setDesc({ pct: 0, nombre: null, encontrado: false });
    setMsg({ t: 'ok', m: 'Cumpleaños registrado.' + (pctReal > 0 ? ` Descuento de bienvenida ${pctReal}% aplicado al total.` : '') });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nuevo cumpleaños</p>
      <div className="form-row">
        <div className="field"><label>Cumpleañero *</label><input value={f.cumpleanero} onChange={upd('cumpleanero')} placeholder="Nombre" /></div>
        <div className="field"><label>Teléfono</label><input value={f.telefono} onChange={upd('telefono')} onBlur={buscarCliente} placeholder="Para descuento de bienvenida" /></div>
        <div className="field small"><label>Edad</label><input type="number" value={f.edad} onChange={upd('edad')} placeholder="0" /></div>
        <div className="field small"><label>Fecha *</label><input type="date" min={hoyISO()} value={f.fecha} onChange={upd('fecha')} /></div>
        <div className="field small"><label>Horario</label><input type="time" value={f.horario} onChange={upd('horario')} /></div>
        <div className="field small"><label>Chicos</label><input type="number" value={f.cant_chicos} onChange={upd('cant_chicos')} placeholder="0" /></div>
        <div className="field small"><label>Adultos</label><input type="number" value={f.cant_adultos} onChange={upd('cant_adultos')} placeholder="0" /></div>
        <div className="field"><label>Pack</label>
          <select value={f.pack} onChange={elegirPack}>
            <option value="">— elegir pack —</option>
            {PACKS.map((p) => <option key={p.v} value={p.v}>{p.v} · {money(p.precio)}</option>)}
          </select>
        </div>
        <div className="field small"><label>Seña</label><input type="number" value={f.sena} onChange={upd('sena')} placeholder="0" /></div>
        <div className="field small"><label>Total</label><input type="number" value={f.total} onChange={upd('total')} placeholder="0" /></div>
        <div className="field"><label>Estado</label>
          <select value={f.estado} onChange={upd('estado')}>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Registrar'}</button>
      </div>

      {desc.encontrado && desc.pct > 0 && (
        <div className="form-msg" style={{ color: 'var(--green)' }}>
          ✓ {desc.nombre} tiene <strong>{desc.pct}% de bienvenida</strong> por referido{f.total ? <> · total: <s style={{ color: 'var(--muted)' }}>{money(Number(f.total))}</s> → <strong>{money(aplicarPct(Number(f.total), desc.pct))}</strong></> : ''} (automático, una sola vez)
        </div>
      )}
      {desc.encontrado && desc.pct === 0 && f.telefono.trim() && (
        <div className="form-msg" style={{ color: 'var(--muted)' }}>Cliente {desc.nombre} · sin descuento (ya usó su bienvenida). Suma visita de fidelidad.</div>
      )}

      {/* Cajita dinámica con TODO el detalle del pack elegido */}
      {packSel && (
        <div style={{ marginTop: 14, padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', borderLeft: `5px solid ${packSel.color}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ color: packSel.color, fontSize: 18, letterSpacing: '.03em' }}>Pack {packSel.v.toUpperCase()}</strong>
            <strong style={{ color: packSel.color, fontSize: 20 }}>{money(packSel.precio)}</strong>
          </div>

          <p style={{ margin: '12px 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: 'var(--muted)' }}>QUÉ INCLUYE</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {packSel.incluye.map((it) => (
              <span key={it} style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.05)', border: `1px solid ${packSel.color}44`, fontSize: 13, color: 'var(--text)' }}>
                {it}
              </span>
            ))}
          </div>

          <p style={{ margin: '14px 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '.12em', color: 'var(--muted)' }}>DETALLES DEL EVENTO</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 14, color: 'var(--text)' }}>
            <span>⏱️ Duración: <strong>{packSel.duracion}</strong></span>
            <span>🧒 Hasta <strong>{packSel.ninos} niños</strong></span>
            <span>👨‍👩‍👧 Hasta <strong>{packSel.adultos} adultos</strong></span>
          </div>
        </div>
      )}

      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
