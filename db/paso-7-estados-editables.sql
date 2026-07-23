-- =====================================================================
-- Estados editables (Paso 7) — libera los estados de turnos y cumpleaños
-- para poder usar "pago completo", "seña", etc. desde el panel.
-- Pegar en Supabase -> SQL Editor -> Run. Idempotente.
-- =====================================================================

-- Quita la restricción que solo permitía un set fijo de estados.
alter table public.reservations         drop constraint if exists reservations_estado_check;
alter table public.birthday_reservations drop constraint if exists birthday_reservations_estado_check;

-- (Los estados ahora se controlan desde los desplegables del panel:
--  Reservado, Seña, Pago completo, Confirmada, Realizada, Cancelada, etc.)
-- =====================================================================
