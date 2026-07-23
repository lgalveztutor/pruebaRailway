'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ClienteForm() {
  const router = useRouter();
  const [f, setF] = useState({ nombre: '', telefono: '', email: '', cumpleanos: '', codigo: '' });
  const [ref, setRef] = useState(null); // { valido, referidor, descuento_pct }
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const upd = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Valida el código de referido contra la base (al salir del campo).
  async function validarCodigo() {
    const cod = f.codigo.trim().toUpperCase();
    if (!cod) { setRef(null); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('referral_codes')
      .select('codigo, referidor, descuento_pct, activo')
      .ilike('codigo', cod)
      .maybeSingle();
    if (data && data.activo) {
      setRef({ valido: true, referidor: data.referidor, descuento_pct: Number(data.descuento_pct || 0) });
    } else {
      setRef({ valido: false });
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!f.nombre.trim()) { setMsg({ t: 'err', m: 'El nombre es obligatorio.' }); return; }

    const cod = f.codigo.trim().toUpperCase();
    setLoading(true);
    const supabase = createClient();

    // Candado: 1 código por persona. Si el teléfono ya usó un código, no aplica de nuevo.
    if (cod) {
      if (!ref?.valido) { setLoading(false); setMsg({ t: 'err', m: 'El código de referido no es válido.' }); return; }
      if (f.telefono.trim()) {
        const { data: existe } = await supabase
          .from('clients')
          .select('id')
          .eq('telefono', f.telefono.trim())
          .not('codigo_referido', 'is', null)
          .limit(1);
        if (existe && existe.length > 0) {
          setLoading(false);
          setMsg({ t: 'err', m: 'Ese teléfono ya usó un código de referido (1 sola vez por persona).' });
          return;
        }
      }
    }

    const { error } = await supabase.from('clients').insert({
      nombre: f.nombre.trim(),
      telefono: f.telefono || null,
      email: f.email || null,
      cumpleanos: f.cumpleanos || null,
      codigo_referido: cod && ref?.valido ? cod : null,
      descuento_pct: cod && ref?.valido ? ref.descuento_pct : 0,
    });
    if (error) { setLoading(false); setMsg({ t: 'err', m: 'Error: ' + error.message }); return; }

    // Suma 1 uso al código.
    if (cod && ref?.valido) { await supabase.rpc('usar_codigo', { p_codigo: cod }); }

    setLoading(false);
    setF({ nombre: '', telefono: '', email: '', cumpleanos: '', codigo: '' });
    setRef(null);
    setMsg({ t: 'ok', m: 'Cliente agregado.' + (cod && ref?.valido ? ` Descuento ${ref.descuento_pct}% aplicado.` : '') });
    router.refresh();
  }

  return (
    <form className="card" onSubmit={submit}>
      <p className="section-title">Nuevo cliente</p>
      <div className="form-row">
        <div className="field">
          <label>Nombre *</label>
          <input value={f.nombre} onChange={upd('nombre')} placeholder="Nombre y apellido" />
        </div>
        <div className="field">
          <label>Teléfono</label>
          <input value={f.telefono} onChange={upd('telefono')} placeholder="11 5555 5555" />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={f.email} onChange={upd('email')} placeholder="opcional" />
        </div>
        <div className="field small">
          <label>Cumpleaños</label>
          <input type="date" value={f.cumpleanos} onChange={upd('cumpleanos')} />
        </div>
        <div className="field">
          <label>Código de referido</label>
          <input value={f.codigo} onChange={upd('codigo')} onBlur={validarCodigo} placeholder="Ej: LACHISPAGAMER" style={{ textTransform: 'uppercase' }} />
        </div>
        <button className="btn-secondary" disabled={loading}>
          {loading ? 'Guardando…' : 'Agregar'}
        </button>
      </div>

      {/* Aviso del código: verde si es válido, con el nombre de quién refiere */}
      {ref && (
        ref.valido ? (
          <div className="form-msg" style={{ color: 'var(--green)' }}>
            ✓ Código válido · Refiere: <strong>{ref.referidor || f.codigo.toUpperCase()}</strong> · {ref.descuento_pct}% de descuento para este cliente.
          </div>
        ) : (
          <div className="form-msg err">Código de referido inexistente o inactivo.</div>
        )
      )}

      {msg && <div className={'form-msg ' + msg.t}>{msg.m}</div>}
    </form>
  );
}
