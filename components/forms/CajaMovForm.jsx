'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hoyISO } from '@/lib/format';

const MEDIOS = ['efectivo', 'transferencia', 'mercadopago', 'mixto'];

export default function CajaMovForm() {
  const router = useRouter();
  const [f, setF] = useState({ tipo: 'ingreso', monto: '', medio_pago: 'efectivo', concepto: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.monto || Number(f.monto) <= 0) {
      setMsg({ t: 'err', m: 'Ingresá un monto válido.' });
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('cash_movements').insert({
      fecha: hoyISO(),
      usuario_id: user?.id ?? null,
      tipo: f.tipo,
      monto: Number(f.monto),
      medio_pago: f.medio_pago,
      concepto: f.concepto || null,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setF({ ...f, monto: '', concepto: '' });
    setMsg({ t: 'ok', m: 'Movimiento registrado.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Registrar movimiento</p>
      <div className="form-row">
        <div className="field">
          <label>Tipo</label>
          <select value={f.tipo} onChange={upd('tipo')}>
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div className="field small">
          <label>Monto *</label>
          <input type="number" value={f.monto} onChange={upd('monto')} placeholder="0" />
        </div>
        <div className="field">
          <label>Medio</label>
          <select value={f.medio_pago} onChange={upd('medio_pago')}>
            {MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Concepto</label>
          <input value={f.concepto} onChange={upd('concepto')} placeholder="Ej: venta bar, retiro..." />
        </div>
        <button className="btn-secondary" disabled={loading}>
          {loading ? 'Guardando…' : 'Registrar'}
        </button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
