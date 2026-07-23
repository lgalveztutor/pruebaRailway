'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const MOTIVOS = [
  { v: 'Vencido', label: 'Vencido (fecha de caducidad)' },
  { v: 'Dañado', label: 'Dañado' },
];

// products: [{ id, nombre, stock_actual }]
export default function MermaForm({ products = [] }) {
  const router = useRouter();
  const [f, setF] = useState({ product_id: '', cantidad: '', motivo: 'Vencido' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.product_id) { setMsg({ t: 'err', m: 'Elegí un producto.' }); return; }
    const cant = Number(f.cantidad || 0);
    if (cant <= 0) { setMsg({ t: 'err', m: 'Cantidad inválida.' }); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const prod = products.find((p) => String(p.id) === String(f.product_id));

    // Saca del stock vendible las unidades vencidas/dañadas.
    const { data: cur } = await supabase.from('products').select('stock_actual').eq('id', f.product_id).single();
    const nuevo = Number(cur?.stock_actual ?? 0) - cant;
    const { error: e1 } = await supabase.from('products').update({ stock_actual: nuevo }).eq('id', f.product_id);
    if (e1) { setLoading(false); setMsg({ t: 'err', m: 'Error: ' + e1.message }); return; }

    // Deja registrado el movimiento (queda como aviso/novedad).
    const { error: e2 } = await supabase.from('stock_movements').insert({
      product_id: Number(f.product_id), tipo: 'egreso', cantidad: cant,
      motivo: 'Devolución: ' + f.motivo, usuario_id: user?.id ?? null,
    });
    setLoading(false);
    if (e2) { setMsg({ t: 'err', m: 'Stock ajustado, falló el registro: ' + e2.message }); return; }

    setF({ product_id: '', cantidad: '', motivo: 'Vencido' });
    setMsg({ t: 'ok', m: `⚠ ${cant} u. de ${prod?.nombre || 'producto'} dadas de baja por ${f.motivo.toLowerCase()}.` });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
      <p className="section-title">Devolución / baja (vencido o dañado)</p>
      <div className="form-row">
        <div className="field"><label>Producto</label>
          <select value={f.product_id} onChange={upd('product_id')}>
            <option value="">— elegir —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock_actual})</option>)}
          </select>
        </div>
        <div className="field small"><label>Cantidad</label><input type="number" value={f.cantidad} onChange={upd('cantidad')} placeholder="0" /></div>
        <div className="field"><label>Motivo</label>
          <select value={f.motivo} onChange={upd('motivo')}>{MOTIVOS.map((m) => <option key={m.v} value={m.v}>{m.label}</option>)}</select>
        </div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Registrar'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
