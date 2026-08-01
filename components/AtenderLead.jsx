'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// Marca una consulta de la web como atendida (sale del embudo).
export default function AtenderLead({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function atender() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from('web_leads').update({ atendido: true }).eq('id', id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={atender} disabled={loading}>
      {loading ? '…' : 'Atendido'}
    </button>
  );
}
