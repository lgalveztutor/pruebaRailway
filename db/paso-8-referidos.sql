-- =====================================================================
-- SISTEMA DE REFERIDOS (Paso 8) — códigos tipo "BRUNENGER"
-- Pegar en PostgreSQL -> SQL Editor -> Run. Idempotente.
-- =====================================================================

-- Códigos de referido (los administra el dueño/gerente).
create table if not exists public.referral_codes (
  id            bigint generated always as identity primary key,
  codigo        text unique not null,               -- ej: BRUNENGER (se guarda en MAYÚSCULAS)
  referidor     text,                                -- quién refiere (nombre)
  descuento_pct numeric(5,2) not null default 0,     -- % de descuento para el nuevo cliente
  comision_pct  numeric(5,2) not null default 0,     -- % de ganancia para el referidor (a futuro)
  activo        boolean not null default true,
  usos          int not null default 0,              -- veces usado
  created_at    timestamptz not null default now()
);

-- El cliente guarda el código con el que se registró (1 sola vez por cliente).
alter table public.clients add column if not exists codigo_referido text;
alter table public.clients add column if not exists descuento_pct  numeric(5,2) default 0;

-- Seguridad (RLS)
alter table public.referral_codes enable row level security;
drop policy if exists rc_sel on public.referral_codes;
create policy rc_sel on public.referral_codes for select to authenticated using (public.soy_activo());
drop policy if exists rc_ins on public.referral_codes;
create policy rc_ins on public.referral_codes for insert to authenticated with check (public.mi_rol() in ('dueno','gerente'));
drop policy if exists rc_upd on public.referral_codes;
create policy rc_upd on public.referral_codes for update to authenticated using (public.mi_rol() in ('dueno','gerente')) with check (public.mi_rol() in ('dueno','gerente'));
drop policy if exists rc_del on public.referral_codes;
create policy rc_del on public.referral_codes for delete to authenticated using (public.mi_rol() = 'dueno');

-- Suma 1 uso a un código (para el candado y las métricas). Se llama desde la app.
create or replace function public.usar_codigo(p_codigo text)
returns void language sql security definer set search_path = public
as $$ update public.referral_codes set usos = usos + 1 where upper(codigo) = upper(p_codigo); $$;

-- Quita el ejemplo viejo si quedó cargado.
delete from public.referral_codes where codigo = 'BRUNENGER';

-- Código general de La Chispa Gamer (editá descuento/comisión cuando definas los números).
insert into public.referral_codes (codigo, referidor, descuento_pct, comision_pct)
values ('LACHISPAGAMER', 'La Chispa Gamer', 10, 0)
on conflict (codigo) do nothing;

-- =====================================================================
-- FIN. Ya podés usar códigos de referido en Clientes y en la web.
-- =====================================================================
