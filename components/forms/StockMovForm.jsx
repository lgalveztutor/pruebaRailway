'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// products: [{id, nombre, stock_actual}]
export default function StockMovForm({ products }) {
  const router = useRouter();
  const [f, setF] = useState({ product_id: '', tipo: 'ingreso', cantidad: '', motivo: '' });
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
    const client = createClient();
    const { data: { user } } = await client.auth.getUser();

    const { data, error } = await client.rpc('registrar_movimiento_stock', {
      p_product_id: Number(f.product_id),
      p_tipo: f.tipo,
      p_cantidad: cant,
      p_motivo: f.motivo || null,
      p_usuario_id: user?.id ?? null,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }

    setF({ ...f, cantidad: '', motivo: '' });
    setMsg({ t: 'ok', m: `Stock actualizado. Nuevo stock: ${Number(data?.stock_actual ?? 0)}` });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
      <p className="section-title">Movimiento de stock</p>
      <div className="form-row">
        <div className="field">
          <label>Producto</label>
          <select value={f.product_id} onChange={upd('product_id')}>
            <option value="">— elegir —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock_actual})</option>)}
          </select>
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={f.tipo} onChange={upd('tipo')}>
            <option value="ingreso">Ingreso (sumar)</option>
            <option value="egreso">Egreso (restar)</option>
            <option value="ajuste">Ajuste (dejar en…)</option>
          </select>
        </div>
        <div className="field small"><label>Cantidad</label><input type="number" value={f.cantidad} onChange={upd('cantidad')} placeholder="0" /></div>
        <div className="field"><label>Motivo</label><input value={f.motivo} onChange={upd('motivo')} placeholder="compra, rotura, ajuste…" /></div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Aplicar'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
