// Precio de la HORA de juego (sin comida). La comida va solo en cumpleaños.
export const PRECIO_HORA = 10000;

// Aforo del local (dato para cálculos): 52 personas máximo, 32 cómodas.
export const AFORO_MAX = 52;
export const AFORO_COMODO = 32;

const BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

function businessDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const map = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return map;
}

export function offsetISO(days, date = new Date()) {
  const { year, month, day } = businessDateParts(date);
  const shifted = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + Number(days || 0)));
  return shifted.toISOString().slice(0, 10);
}

// Formato de moneda (peso argentino) y fechas para el panel.
export function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export function hoyISO() {
  // Fecha de hoy en formato YYYY-MM-DD según la zona del negocio.
  return offsetISO(0);
}

export function fechaCorta(d) {
  if (!d) return '—';
  const s = String(d);
  // Fecha pura YYYY-MM-DD: se formatea directo, SIN pasar por Date.
  // (Evita el corrimiento de un día por zona horaria: 2026-12-05 mostraba 04/12.)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  try {
    return new Date(s).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return s;
  }
}
