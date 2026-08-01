'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

export default function ConsolaForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!nombre.trim()) { setMsg({ t: 'err', m: 'Poné un nombre.' }); return; }
    setLoading(true);
    const client = createClient();
    const { error } = await client.from('consoles').insert({ nombre: nombre.trim() });
    setLoading(false);
    if (error) { setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setNombre('');
    setMsg({ t: 'ok', m: 'Consola agregada.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Agregar consola</p>
      <div className="form-row">
        <div className="field"><label>Nombre</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: PlayStation 5 - 3" /></div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Agregar'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
