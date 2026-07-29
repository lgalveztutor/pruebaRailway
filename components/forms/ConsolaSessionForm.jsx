'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hoyISO } from '@/lib/format';

export default function ConsolaSessionForm({ consoles }) {
  const router = useRouter();
  const [f, setF] = useState({ console_id: '', juego: '', inicio: '', fin: '', precio: '' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.console_id) { setMsg({ t: 'err', m: 'Elegí una consola.' }); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const precio = f.precio ? Number(f.precio) : 0;
    const { error } = await supabase.rpc('registrar_sesion_consola', {
      p_console_id: Number(f.console_id),
      p_juego: f.juego || null,
      p_inicio: f.inicio || null,
      p_fin: f.fin || null,
      p_precio: precio,
      p_empleado_id: user?.id ?? null,
      p_fecha: hoyISO(),
    });
    if (error) { setLoading(false); setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }
    setLoading(false);
    setF({ console_id: '', juego: '', inicio: '', fin: '', precio: '' });
    setMsg({ t: 'ok', m: 'Sesión registrada.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit} style={{ marginTop: 16 }}>
      <p className="section-title">Registrar sesión de juego</p>
      <div className="form-row">
        <div className="field"><label>Consola</label>
          <select value={f.console_id} onChange={upd('console_id')}>
            <option value="">— elegir —</option>
            {consoles.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="field"><label>Juego</label><input value={f.juego} onChange={upd('juego')} placeholder="Ej: FIFA 25" /></div>
        <div className="field small"><label>Inicio</label><input type="datetime-local" value={f.inicio} onChange={upd('inicio')} /></div>
        <div className="field small"><label>Fin</label><input type="datetime-local" value={f.fin} onChange={upd('fin')} /></div>
        <div className="field small"><label>Precio</label><input type="number" value={f.precio} onChange={upd('precio')} placeholder="0" /></div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Registrar'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
