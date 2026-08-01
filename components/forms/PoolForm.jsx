'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';
import { hoyISO } from '@/lib/format';

const ESTADOS = ['reservada', 'en_uso', 'realizada', 'cancelada'];
const MEDIOS = ['efectivo', 'transferencia', 'mercadopago', 'mixto'];

export default function PoolForm() {
  const router = useRouter();
  const [f, setF] = useState({ fecha: hoyISO(), inicio: '', fin: '', jugadores: '', precio: '', estado: 'reservada', medio_pago: 'efectivo' });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.fecha) { setMsg({ t: 'err', m: 'Cargá la fecha.' }); return; }
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const precio = f.precio ? Number(f.precio) : 0;
    const { error } = await supabase.from('poolfootball_sessions').insert({
      fecha: f.fecha,
      inicio: f.inicio || null,
      fin: f.fin || null,
      jugadores: f.jugadores ? Number(f.jugadores) : null,
      precio,
      estado: f.estado,
      medio_pago: f.medio_pago,
    });
    if (error) { setLoading(false); setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }

    // Vinculación con Ventas: si tiene precio, genera la venta (servicio).
    if (precio > 0) {
      const { data: sale } = await supabase.from('sales').insert({
        fecha: f.fecha, total: precio, medio_pago: f.medio_pago, empleado_id: user?.id ?? null,
      }).select('id').single();
      if (sale?.id) {
        await supabase.from('sale_items').insert({
          sale_id: sale.id, categoria: 'poolfutbol',
          descripcion: 'PoolFútbol' + (f.jugadores ? ` · ${f.jugadores} jugadores` : ''),
          cantidad: 1, precio_unit: precio, total: precio,
        });
      }
    }
    setLoading(false);
    setF({ ...f, inicio: '', fin: '', jugadores: '', precio: '' });
    setMsg({ t: 'ok', m: 'Turno de PoolFútbol registrado.' });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nuevo turno de PoolFútbol</p>
      <div className="form-row">
        <div className="field small"><label>Fecha *</label><input type="date" min={hoyISO()} value={f.fecha} onChange={upd('fecha')} /></div>
        <div className="field small"><label>Inicio</label><input type="time" value={f.inicio} onChange={upd('inicio')} /></div>
        <div className="field small"><label>Fin</label><input type="time" value={f.fin} onChange={upd('fin')} /></div>
        <div className="field small"><label>Jugadores</label><input type="number" value={f.jugadores} onChange={upd('jugadores')} placeholder="0" /></div>
        <div className="field small"><label>Precio</label><input type="number" value={f.precio} onChange={upd('precio')} placeholder="0" /></div>
        <div className="field"><label>Estado</label>
          <select value={f.estado} onChange={upd('estado')}>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>
        <div className="field"><label>Medio</label>
          <select value={f.medio_pago} onChange={upd('medio_pago')}>{MEDIOS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
        </div>
        <button className="btn-secondary" disabled={loading}>{loading ? 'Guardando…' : 'Registrar'}</button>
      </div>
      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
