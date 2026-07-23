-- =====================================================================
-- LIMPIEZA — Quitar las tablas de La Chispa Gamer del proyecto del GIMNASIO
-- Correr ESTO en el proyecto donde están mezcladas (el del gimnasio),
-- DESPUÉS de haber creado el proyecto nuevo de La Chispa Gamer.
-- Deja el proyecto del gimnasio como estaba.
-- =====================================================================

-- Trigger primero
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- Tablas de La Chispa Gamer (CASCADE borra también sus políticas RLS)
drop table if exists public.activity_logs cascade;
drop table if exists public.stock_movements cascade;
drop table if exists public.sale_items cascade;
drop table if exists public.console_sessions cascade;
drop table if exists public.poolfootball_sessions cascade;
drop table if exists public.cash_movements cascade;
drop table if exists public.cash_closures cascade;
drop table if exists public.expenses cascade;
drop table if exists public.sales cascade;
drop table if exists public.reservations cascade;
drop table if exists public.birthday_reservations cascade;
drop table if exists public.consoles cascade;
drop table if exists public.products cascade;
drop table if exists public.clients cascade;
drop table if exists public.profiles cascade;

-- Funciones auxiliares AL FINAL (ya nadie depende de ellas con CASCADE arriba)
drop function if exists public.mi_rol() cascade;
drop function if exists public.soy_activo() cascade;

-- IMPORTANTE: NO se tocan las tablas del gimnasio
-- (gyms, members, professors, routines, classes, meals, notes, reminders, weights).
