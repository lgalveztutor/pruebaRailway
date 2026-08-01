'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/postgres-client';

// Acciones al final de cada item de venta:
// - Aviso "Repetido" si el registro está duplicado ese día
// - Eliminar el registro (para sacar duplicados o errores de carga)
// - Corregir un detalle mal colocado (solo el texto, no lo que pidió el cliente)
export default function EditarVentaItem({ id, descripcion, duplicado }) {
  const router = useRouter();
  const [modo, setModo] = useState('normal'); // normal | editando
  const [desc, setDesc] = useState(descripcion ?? '');
  const [busy, setBusy] = useState(false);

  async function guardarDetalle() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('sale_items').update({ descripcion: desc }).eq('id', id);
    setBusy(false);
    if (error) { alert('No se pudo guardar: ' + error.message); return; }
    setModo('normal');
    router.refresh();
  }

  async function eliminar() {
    const ok = confirm(duplicado
      ? 'Este registro está repetido. ¿Eliminar esta copia?'
      : '¿Seguro que querés eliminar este registro?');
    if (!ok) return;
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from('sale_items').delete().eq('id', id);
    setBusy(false);
    if (error) { alert('No se pudo eliminar: ' + error.message); return; }
    router.refresh();
  }

  const btn = { padding: '5px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', border: '1px solid var(--border)', background: 'rgba(255,255,255,.06)', color: 'var(--text)' };

  if (modo === 'editando') {
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          style={{ padding: '6px 8px', borderRadius: 8, background: '#0f1016', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, width: 150 }}
          value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Detalle" autoFocus
        />
        <button type="button" disabled={busy} onClick={guardarDetalle}
          style={{ ...btn, background: 'var(--green, #9CFF2E)', border: 'none', color: '#132b00', fontWeight: 700 }}>
          {busy ? '...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => { setModo('normal'); setDesc(descripcion ?? ''); }} style={{ ...btn, background: 'transparent', color: 'var(--muted, #9AA0AE)' }}>
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
      {duplicado && (
        <span title="Hay otro registro igual este mismo día"
          style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,209,102,.12)', border: '1px solid rgba(255,209,102,.45)', color: '#FFD166', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
          ⚠ Repetido
        </span>
      )}
      <button type="button" onClick={() => setModo('editando')} style={btn} title="Corregir el detalle escrito">
        Corregir
      </button>
      <button type="button" disabled={busy} onClick={eliminar}
        style={{ ...btn, border: '1px solid rgba(255,107,107,.4)', color: '#FF6B6B' }} title="Eliminar este registro">
        Eliminar
      </button>
    </span>
  );
}
