import { createClient } from '@/lib/supabase/client';

// Consulta si al cliente (por teléfono) le corresponde descuento de bienvenida.
// NO lo consume: sirve para mostrar el total ya rebajado mientras se carga.
export async function previewDescuento(telefono) {
  if (!telefono || !telefono.trim()) return { encontrado: false, pct: 0 };
  const supabase = createClient();
  const { data } = await supabase.rpc('preview_descuento', { p_telefono: telefono.trim() });
  return data || { encontrado: false, pct: 0 };
}

// Se llama al CONFIRMAR el servicio: suma la visita (fidelidad) y marca el
// descuento como usado (una sola vez). Devuelve el % realmente aplicado.
export async function consumirDescuento(telefono) {
  if (!telefono || !telefono.trim()) return { encontrado: false, pct: 0 };
  const supabase = createClient();
  const { data } = await supabase.rpc('registrar_servicio_cliente', { p_telefono: telefono.trim() });
  return data || { encontrado: false, pct: 0 };
}

// Aplica un % de descuento a un monto (redondeado a peso).
export function aplicarPct(monto, pct) {
  const m = Number(monto || 0);
  const p = Number(pct || 0);
  if (p <= 0) return Math.round(m);
  return Math.round(m * (1 - p / 100));
}
