'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function DevolverPulsera({ id }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function devolver() {
    setLoading(true);
    const supabase = createClient();
    const horaFin = new Date().toTimeString().slice(0, 8);
    await supabase.from('walkin_orders').update({ estado: 'devuelta', hora_terminada: horaFin }).eq('id', id);
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={devolver} disabled={loading}>
      {loading ? '…' : 'Devolver'}
    </button>
  );
}
