'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

const ESTADOS = [
  { v: 'disponible', t: 'Disponible' },
  { v: 'en_uso', t: 'En uso' },
  { v: 'reservada', t: 'Reservada' },
  { v: 'fuera_servicio', t: 'Fuera de servicio' },
];

export default function EstadoConsola({ id, estado }) {
  const router = useRouter();
  const [val, setVal] = useState(estado);
  const [saving, setSaving] = useState(false);

  async function change(e) {
    const nuevo = e.target.value;
    setVal(nuevo);
    setSaving(true);
    const supabase = createClient();
    await supabase.from('consoles').update({ estado: nuevo }).eq('id', id);
    setSaving(false);
    router.refresh();
  }

  return (
    <select value={val} onChange={change} disabled={saving}
      style={{ padding: '6px 10px', borderRadius: 8, background: '#0f1016', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}>
      {ESTADOS.map((s) => <option key={s.v} value={s.v}>{s.t}</option>)}
    </select>
  );
}
