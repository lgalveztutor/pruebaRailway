-- =====================================================================
-- EMBUDO WEB (Paso 9) — las consultas del formulario público caen en Clientes
-- Pegar en PostgreSQL -> SQL Editor -> Run. Idempotente.
-- =====================================================================

create table if not exists public.web_leads (
  id             bigint generated always as identity primary key,
  nombre         text,
  telefono       text,
  experiencia    text,
  dia            date,
  hora           time,
  personas       int,
  codigo_referido text,
  atendido       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Por si la tabla ya existía sin la columna:
alter table public.web_leads add column if not exists telefono text;

alter table public.web_leads enable row level security;

-- La web (anónima) SOLO puede CREAR una consulta (no leer nada).
drop policy if exists wl_ins on public.web_leads;
create policy wl_ins on public.web_leads
  for insert to anon, authenticated with check (true);

-- El equipo del panel ve y gestiona las consultas.
drop policy if exists wl_sel on public.web_leads;
create policy wl_sel on public.web_leads
  for select to authenticated using (public.soy_activo());
drop policy if exists wl_upd on public.web_leads;
create policy wl_upd on public.web_leads
  for update to authenticated using (public.soy_activo()) with check (public.soy_activo());
drop policy if exists wl_del on public.web_leads;
create policy wl_del on public.web_leads
  for delete to authenticated using (public.mi_rol() in ('dueno','gerente'));

-- =====================================================================
-- FIN. Ya las reservas de la web caen en Clientes (embudo).
-- =====================================================================
