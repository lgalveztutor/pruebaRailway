'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

export default function EliminarCombo({ id, nombre }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function eliminar() {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('combos').delete().eq('id', id);
    setLoading(false);
    if (error) { alert('No se pudo eliminar: ' + error.message); return; }
    router.refresh();
  }

  return (
    <button
      className="btn-secondary"
      style={{ padding: '6px 12px', fontSize: 13, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)' }}
      onClick={eliminar}
      disabled={loading}
    >
      {loading ? '…' : 'Eliminar'}
    </button>
  );
}
