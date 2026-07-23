-- =====================================================================
-- LA CHISPA GAMER 1.8 — Pulseras / Órdenes de llegada + Combos (Paso 6)
-- Pegar en Supabase -> SQL Editor -> Run. Es idempotente.
-- =====================================================================

-- Combos (editables desde el panel): color, precio y comida incluida.
create table if not exists public.combos (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  color        text not null default '#19D3FF',   -- hex del color de la pulsera
  precio       numeric(12,2) not null default 0,
  comida       text,
  duracion_min int not null default 60,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Órdenes de llegada (clientes SIN turno, con pulsera de color).
create table if not exists public.walkin_orders (
  id            bigint generated always as identity primary key,
  fecha         date not null default current_date,
  encargado     text not null,
  personas      int,
  sector        text,                         -- PoolFútbol, Consolas, etc.
  combo_id      bigint references public.combos(id) on delete set null,
  color         text,                         -- color de la pulsera elegido
  precio        numeric(12,2) not null default 0,
  pago_total    numeric(12,2) not null default 0,
  medio_pago    text,
  hora_pedida   time,
  hora_terminada time,
  estado        text not null default 'activa' check (estado in ('activa','devuelta')),
  usuario_id    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Seguridad (RLS): leer = equipo activo; cargar/editar = dueño/gerente/empleado; borrar = dueño.
do $$
declare t text;
  tablas text[] := array['combos','walkin_orders'];
begin
  foreach t in array tablas loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t||'_sel', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.soy_activo());', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I;', t||'_ins', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.mi_rol() in (''dueno'',''gerente'',''empleado''));', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I;', t||'_upd', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.mi_rol() in (''dueno'',''gerente'',''empleado'')) with check (public.mi_rol() in (''dueno'',''gerente'',''empleado''));', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I;', t||'_del', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.mi_rol() = ''dueno'');', t||'_del', t);
  end loop;
end $$;

-- 5 combos de ejemplo (editables/borrables después desde el panel).
insert into public.combos (nombre, color, precio, comida)
select * from (values
  ('Combo Verde',   '#9CFF2E', 6000::numeric,  '1 hora + gaseosa + papas'),
  ('Combo Cyan',    '#19D3FF', 8000::numeric,  '1 hora + hamburguesa + gaseosa'),
  ('Combo Magenta', '#FF2EA6', 10000::numeric, '1 hora + combo doble + gaseosa'),
  ('Combo Amarillo','#FFD166', 12000::numeric, '1 hora + pizza chica + gaseosas'),
  ('Combo Naranja', '#FF7A00', 15000::numeric, '1 hora + pizza grande + gaseosas')
) as v(nombre,color,precio,comida)
where not exists (select 1 from public.combos);

-- =====================================================================
-- FIN. Con esto quedan listas Pulseras (órdenes de llegada) y Combos.
-- =====================================================================
