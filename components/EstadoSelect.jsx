'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// Selector de estado editable en vivo. Sirve para cualquier tabla/columna.
// props: tabla, id, value, options=[{v,label}], campo='estado'
export default function EstadoSelect({ tabla, id, value, options, campo = 'estado' }) {
  const router = useRouter();
  const [val, setVal] = useState(value || '');
  const [saving, setSaving] = useState(false);

  async function change(e) {
    const nuevo = e.target.value;
    setVal(nuevo);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from(tabla).update({ [campo]: nuevo }).eq('id', id);
    setSaving(false);
    if (error) { alert('No se pudo guardar: ' + error.message); setVal(value || ''); return; }
    router.refresh();
  }

  // Asegura que el valor actual aparezca aunque no esté en la lista.
  const opts = options.some((o) => o.v === val) || !val
    ? options
    : [{ v: val, label: val }, ...options];

  return (
    <select value={val} onChange={change} disabled={saving}
      style={{ padding: '6px 10px', borderRadius: 8, background: '#0f1016', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600 }}>
      {opts.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
    </select>
  );
}
