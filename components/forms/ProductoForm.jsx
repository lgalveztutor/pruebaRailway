'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';
import { CATEGORIAS_PRODUCTO, LABEL_CATEGORIA } from '@/lib/categorias';

export default function ProductoForm() {
  const router = useRouter();
  const [f, setF] = useState({ nombre: '', categoria: 'bebidas', stock_actual: '', stock_min: '', costo: '', precio: '', proveedor: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.nombre.trim()) { setMsg({ t: 'err', m: 'El nombre es obligatorio.' }); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('products').insert({
      nombre: f.nombre.trim(),
      categoria: f.categoria,
      stock_actual: Number(f.stock_actual || 0),
      stock_min: Number(f.stock_min || 0),
      costo: Number(f.costo || 0),
      precio: Number(f.precio || 0),
      proveedor: f.proveedor || null,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setF({ nombre: '', categoria: 'bebidas', stock_actual: '', stock_min: '', costo: '', precio: '', proveedor: '' });
    setMsg({ t: 'ok', m: 'Producto agregado.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nuevo producto</p>
      <div className="form-row">
        <div className="field"><label>Nombre *</label><input value={f.nombre} onChange={upd('nombre')} placeholder="Ej: Coca 500ml" /></div>
        <div className="field"><label>Categoría</label>
          <select value={f.categoria} onChange={upd('categoria')}>{CATEGORIAS_PRODUCTO.map((c) => <option key={c} value={c}>{LABEL_CATEGORIA[c]}</option>)}</select>
        </div>
        <div className="field small"><label>Stock</label><input type="number" value={f.stock_actual} onChange={upd('stock_actual')} placeholder="0" /></div>
        <div className="field small"><label>Stock mín.</label><input type="number" value={f.stock_min} onChange={upd('stock_min')} placeholder="0" /></div>
        <div className="field small"><label>Costo</label><input type="number" value={f.costo} onChange={upd('costo')} placeholder="0" /></div>
        <div className="field small"><label>Precio</label><input type="number" value={f.precio} onChange={upd('precio')} placeholder="0" /></div>
        <div className="field"><label>Proveedor</label><input value={f.proveedor} onChange={upd('proveedor')} placeholder="opcional" /></div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Agregar'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
