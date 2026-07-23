-- =====================================================================
-- TRACKING WEB (Paso 10) — eventos para el embudo del Dashboard
-- Registra "visita" a la página y "clic_whatsapp". Idempotente.
-- =====================================================================

create table if not exists public.web_events (
  id         bigint generated always as identity primary key,
  tipo       text not null check (tipo in ('visita', 'clic_whatsapp')),
  created_at timestamptz not null default now()
);

alter table public.web_events enable row level security;

-- La web (anónima) SOLO puede registrar eventos (no leer).
drop policy if exists we_ins on public.web_events;
create policy we_ins on public.web_events
  for insert to anon, authenticated with check (tipo in ('visita', 'clic_whatsapp'));

-- El equipo del panel los lee para el embudo.
drop policy if exists we_sel on public.web_events;
create policy we_sel on public.web_events
  for select to authenticated using (public.soy_activo());

create index if not exists web_events_tipo_idx on public.web_events (tipo);

-- =====================================================================
-- FIN.
-- =====================================================================
