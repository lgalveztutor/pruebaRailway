'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// Campo numérico editable en vivo (ej: precio). Guarda al salir o con Enter.
// props: tabla, id, campo, value
export default function CampoEditable({ tabla, id, campo, value }) {
  const router = useRouter();
  const [v, setV] = useState(value ?? '');
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (String(v) === String(value)) return;
    setSaving(true);
    const client = createClient();
    const { error } = await client.from(tabla).update({ [campo]: Number(v || 0) }).eq('id', id);
    setSaving(false);
    if (error) { alert('No se pudo guardar: ' + error.message); setV(value ?? ''); return; }
    router.refresh();
  }

  return (
    <input
      type="number"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      disabled={saving}
      style={{ width: 100, padding: '6px 8px', borderRadius: 8, background: '#0f1016', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13 }}
    />
  );
}
