'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

export default function ComboForm() {
  const router = useRouter();
  const [f, setF] = useState({ nombre: '', color: '#19D3FF', precio: '', comida: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.nombre.trim()) { setMsg({ t: 'err', m: 'Poné un nombre.' }); return; }
    setLoading(true);
    const client = createClient();
    const { error } = await client.from('combos').insert({
      nombre: f.nombre.trim(),
      color: f.color,
      precio: f.precio ? Number(f.precio) : 0,
      comida: f.comida || null,
    });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setF({ nombre: '', color: '#19D3FF', precio: '', comida: '' });
    setMsg({ t: 'ok', m: 'Combo agregado.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Combos (colores, precios y comida) — editables</p>
      <div className="form-row">
        <div className="field"><label>Nombre</label><input value={f.nombre} onChange={upd('nombre')} placeholder="Ej: Combo Verde" /></div>
        <div className="field small"><label>Color</label><input type="color" value={f.color} onChange={upd('color')} style={{ height: 44, padding: 4 }} /></div>
        <div className="field small"><label>Precio</label><input type="number" value={f.precio} onChange={upd('precio')} placeholder="0" /></div>
        <div className="field"><label>Comida incluida</label><input value={f.comida} onChange={upd('comida')} placeholder="Ej: 1 hora + hamburguesa + gaseosa" /></div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Agregar combo'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
