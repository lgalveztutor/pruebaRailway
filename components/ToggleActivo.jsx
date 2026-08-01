'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// Botón para prender/apagar la disponibilidad de un producto (products.activo).
export default function ToggleActivo({ id, activo }) {
  const router = useRouter();
  const [val, setVal] = useState(activo);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const nuevo = !val;
    setVal(nuevo);
    setSaving(true);
    const client = createClient();
    const { error } = await client.from('products').update({ activo: nuevo }).eq('id', id);
    setSaving(false);
    if (error) { alert('No se pudo guardar: ' + error.message); setVal(activo); return; }
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={saving}
      className={'pill ' + (val ? 'realizada' : 'cancelada')}
      style={{ cursor: 'pointer', border: 'none' }}>
      {val ? 'Disponible' : 'Pausado'}
    </button>
  );
}
