'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';
import { hoyISO } from '@/lib/format';
import { CATEGORIAS_FIJAS } from '@/lib/finanzas';

const CATEGORIAS = ['alquiler', 'servicios', 'sueldos', 'mercaderia', 'mantenimiento', 'publicidad', 'impuestos', 'hardware', 'otros'];
const MEDIOS = ['efectivo', 'transferencia', 'mercadopago', 'mixto'];
const CLASIF = [
  { v: 'opex_fijo', l: 'OPEX Fijo' },
  { v: 'opex_variable', l: 'OPEX Variable' },
  { v: 'capex', l: 'CAPEX (inversión)' },
];

// Clasificación sugerida según la categoría.
function sugerir(categoria) {
  if (categoria === 'hardware') return 'capex';
  if (CATEGORIAS_FIJAS.includes(categoria)) return 'opex_fijo';
  return 'opex_variable';
}

export default function GastoForm() {
  const router = useRouter();
  const [f, setF] = useState({ fecha: hoyISO(), categoria: 'mercaderia', concepto: '', monto: '', medio_pago: 'efectivo', clasificacion: 'opex_variable', vida_util: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function updCategoria(e) {
    const categoria = e.target.value;
    setF({ ...f, categoria, clasificacion: sugerir(categoria) });
  }

  const esCapex = f.clasificacion === 'capex';

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.monto || Number(f.monto) <= 0) { setMsg({ t: 'err', m: 'Ingresá un monto válido.' }); return; }
    if (esCapex && (!f.vida_util || Number(f.vida_util) <= 0)) { setMsg({ t: 'err', m: 'Para CAPEX, cargá la vida útil en meses (ej: 24).' }); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('expenses').insert({
      fecha: f.fecha,
      categoria: f.categoria,
      concepto: f.concepto || null,
      monto: Number(f.monto),
      medio_pago: f.medio_pago,
      clasificacion: f.clasificacion,
      vida_util_meses: esCapex ? Number(f.vida_util) : null,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setF({ ...f, concepto: '', monto: '', vida_util: '' });
    setMsg({ t: 'ok', m: 'Gasto registrado.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nuevo gasto</p>
      <div className="form-row">
        <div className="field small"><label>Fecha</label><input type="date" value={f.fecha} onChange={upd('fecha')} /></div>
        <div className="field"><label>Categoría</label>
          <select value={f.categoria} onChange={updCategoria}>{CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <div className="field"><label>Concepto</label><input value={f.concepto} onChange={upd('concepto')} placeholder="Ej: compra de bebidas / PC gamer" /></div>
        <div className="field small"><label>Monto *</label><input type="number" value={f.monto} onChange={upd('monto')} placeholder="0" /></div>
        <div className="field"><label>Clasificación</label>
          <select value={f.clasificacion} onChange={upd('clasificacion')}>{CLASIF.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</select>
        </div>
        {esCapex && (
          <div className="field small"><label>Vida útil (meses) *</label><input type="number" value={f.vida_util} onChange={upd('vida_util')} placeholder="Ej: 24" /></div>
        )}
        <div className="field"><label>Medio</label>
          <select value={f.medio_pago} onChange={upd('medio_pago')}>{MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Agregar'}</button>
      </div>
      {esCapex && (
        <div className="form-msg" style={{ color: 'var(--cyan)' }}>
          CAPEX: no impacta todo de golpe. Se deprecia {f.vida_util ? `en ${f.vida_util} meses (≈ $${Math.round(Number(f.monto || 0) / Number(f.vida_util || 1)).toLocaleString('es-AR')}/mes)` : 'mes a mes'} en la ganancia real.
        </div>
      )}
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
