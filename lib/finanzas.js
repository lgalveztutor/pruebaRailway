// Lógica financiera: clasificación de egresos y depreciación de hardware (CAPEX).

// Categorías que por defecto son OPEX Fijo (recurrentes).
export const CATEGORIAS_FIJAS = ['alquiler', 'sueldos', 'servicios', 'impuestos'];

export const LABEL_CLASIFICACION = {
  opex_fijo: 'OPEX Fijo',
  opex_variable: 'OPEX Variable',
  capex: 'CAPEX (inversión)',
};

// Devuelve la clasificación de un gasto (usa la explícita, o la deduce de la categoría).
export function clasificacionDe(exp) {
  if (exp?.clasificacion) return exp.clasificacion;
  return CATEGORIAS_FIJAS.includes(exp?.categoria) ? 'opex_fijo' : 'opex_variable';
}

// Depreciación lineal de un CAPEX imputable a un mes 'YYYY-MM'.
// monto / vida_util_meses, solo dentro del período de vida útil desde la fecha de alta.
export function depreciacionMensual(exp, mesYYYYMM) {
  if (clasificacionDe(exp) !== 'capex') return 0;
  const vida = Number(exp?.vida_util_meses || 0);
  if (vida <= 0) return 0;
  const alta = String(exp?.fecha || '').slice(0, 7); // YYYY-MM del alta
  if (alta.length !== 7) return 0;
  const [ay, am] = alta.split('-').map(Number);
  const [my, mm] = String(mesYYYYMM).split('-').map(Number);
  const diff = (my - ay) * 12 + (mm - am);
  if (diff < 0 || diff >= vida) return 0; // fuera del período de depreciación
  return Number(exp?.monto || 0) / vida;
}
