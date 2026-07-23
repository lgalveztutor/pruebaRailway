-- =====================================================================
-- MOTOR FINANCIERO (Paso 11) — clasificación de egresos + depreciación
-- Pegar en Supabase -> SQL Editor -> Run. Idempotente.
-- =====================================================================

-- Clasificación del gasto: opex_fijo | opex_variable | capex
alter table public.expenses add column if not exists clasificacion text;

-- Solo para CAPEX (hardware): vida útil en meses para depreciar lineal.
alter table public.expenses add column if not exists vida_util_meses int;

-- (No hace falta tocar RLS: expenses ya tiene sus políticas.)
-- =====================================================================
-- FIN.
-- =====================================================================
