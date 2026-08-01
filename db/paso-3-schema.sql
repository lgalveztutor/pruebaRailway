-- =====================================================================
-- LA CHISPA GAMER 1.8 — Base de datos (Paso 3)
-- Tablas + Roles + Seguridad (RLS). Para pegar en PostgreSQL -> SQL Editor.
-- Es idempotente: se puede correr varias veces sin romper nada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PERFILES Y ROLES
-- ---------------------------------------------------------------------
-- Roles del negocio: dueno, gerente, empleado, contador.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text,
  email      text,
  rol        text not null default 'empleado'
             check (rol in ('dueno','gerente','empleado','contador')),
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cuando se crea un usuario en Auth, se crea su perfil automaticamente.
-- El PRIMER usuario del sistema queda como 'dueno'. El resto, 'empleado'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  primer boolean;
begin
  select count(*) = 0 into primer from public.profiles;
  insert into public.profiles (id, email, nombre, rol)
  values (new.id, new.email, split_part(new.email, '@', 1),
          case when primer then 'dueno' else 'empleado' end);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Si ya creaste tu usuario en el Paso 2 (antes de correr esto),
-- te creamos el perfil ahora y te dejamos como dueno:
insert into public.profiles (id, email, nombre, rol)
select u.id, u.email, split_part(u.email, '@', 1), 'dueno'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 2) FUNCIONES AUXILIARES PARA LAS POLITICAS DE SEGURIDAD
-- ---------------------------------------------------------------------
create or replace function public.mi_rol()
returns text language sql stable security definer set search_path = public
as $$ select rol from public.profiles where id = auth.uid() $$;

create or replace function public.soy_activo()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select activo from public.profiles where id = auth.uid()), false) $$;

-- ---------------------------------------------------------------------
-- 3) TABLAS OPERATIVAS
-- ---------------------------------------------------------------------
create table if not exists public.clients (
  id          bigint generated always as identity primary key,
  nombre      text not null,
  telefono    text,
  email       text,
  cumpleanos  date,
  observaciones text,
  created_at  timestamptz not null default now()
);

create table if not exists public.reservations (
  id            bigint generated always as identity primary key,
  client_id     bigint references public.clients(id) on delete set null,
  nombre        text,                 -- por si la reserva no tiene cliente cargado
  telefono      text,
  fecha         date not null,
  hora          time,
  personas      int,
  tipo          text,                 -- general, poolfutbol, consolas, cumpleanos...
  sena          numeric(12,2) default 0,
  total_estimado numeric(12,2) default 0,
  estado        text not null default 'pendiente'
                check (estado in ('pendiente','confirmada','realizada','cancelada')),
  observaciones text,
  created_at    timestamptz not null default now()
);

create table if not exists public.birthday_reservations (
  id            bigint generated always as identity primary key,
  cumpleanero   text not null,
  edad          int,
  fecha         date not null,
  horario       time,
  cant_chicos   int,
  cant_adultos  int,
  pack          text,
  sena          numeric(12,2) default 0,
  total         numeric(12,2) default 0,
  estado        text not null default 'consultado'
                check (estado in ('consultado','senado','confirmado','realizado','cancelado')),
  estado_pago   text default 'pendiente',
  observaciones text,
  created_at    timestamptz not null default now()
);

create table if not exists public.sales (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  client_id   bigint references public.clients(id) on delete set null,
  total       numeric(12,2) not null default 0,
  medio_pago  text,                  -- efectivo, transferencia, mercadopago, mixto
  empleado_id uuid references public.profiles(id) on delete set null,
  observaciones text,
  created_at  timestamptz not null default now()
);

create table if not exists public.sale_items (
  id            bigint generated always as identity primary key,
  sale_id       bigint not null references public.sales(id) on delete cascade,
  categoria     text,                -- alquiler, cumpleanos, poolfutbol, consolas, bar, snacks, bebidas, otros
  descripcion   text,
  cantidad      numeric(12,2) not null default 1,
  precio_unit   numeric(12,2) not null default 0,
  total         numeric(12,2) not null default 0,
  product_id    bigint                -- se vincula a products en el Paso 5 (bar/stock)
);

create table if not exists public.cash_movements (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  usuario_id  uuid references public.profiles(id) on delete set null,
  tipo        text not null check (tipo in ('ingreso','egreso')),
  monto       numeric(12,2) not null,
  medio_pago  text,                  -- efectivo, transferencia, mercadopago, mixto
  concepto    text,
  observaciones text,
  created_at  timestamptz not null default now()
);

create table if not exists public.cash_closures (
  id           bigint generated always as identity primary key,
  fecha        date not null default current_date,
  usuario_id   uuid references public.profiles(id) on delete set null,
  apertura     numeric(12,2) default 0,
  ingresos     numeric(12,2) default 0,
  egresos      numeric(12,2) default 0,
  esperado     numeric(12,2) default 0,   -- lo que deberia haber en caja
  real_contado numeric(12,2) default 0,   -- lo que se conto fisicamente
  diferencia   numeric(12,2) default 0,
  observaciones text,
  created_at   timestamptz not null default now()
);

create table if not exists public.expenses (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  categoria   text,                  -- alquiler, servicios, sueldos, mercaderia, mantenimiento, publicidad, impuestos, otros
  concepto    text,
  monto       numeric(12,2) not null,
  medio_pago  text,
  comprobante text,
  observaciones text,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  categoria    text,                 -- bebidas, snacks, combos, otros
  stock_actual numeric(12,2) not null default 0,
  stock_min    numeric(12,2) not null default 0,
  costo        numeric(12,2) default 0,
  precio       numeric(12,2) default 0,
  proveedor    text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id          bigint generated always as identity primary key,
  product_id  bigint not null references public.products(id) on delete cascade,
  tipo        text not null check (tipo in ('ingreso','egreso','ajuste')),
  cantidad    numeric(12,2) not null,
  motivo      text,                  -- compra, venta, ajuste, rotura...
  fecha       timestamptz not null default now(),
  usuario_id  uuid references public.profiles(id) on delete set null
);

create table if not exists public.consoles (
  id        bigint generated always as identity primary key,
  nombre    text not null,
  estado    text not null default 'disponible'
            check (estado in ('disponible','en_uso','reservada','fuera_servicio')),
  created_at timestamptz not null default now()
);

create table if not exists public.console_sessions (
  id          bigint generated always as identity primary key,
  console_id  bigint references public.consoles(id) on delete set null,
  client_id   bigint references public.clients(id) on delete set null,
  juego       text,
  inicio      timestamptz,
  fin         timestamptz,
  precio      numeric(12,2) default 0,
  estado      text default 'abierta',
  created_at  timestamptz not null default now()
);

create table if not exists public.poolfootball_sessions (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  inicio      time,
  fin         time,
  client_id   bigint references public.clients(id) on delete set null,
  jugadores   int,
  precio      numeric(12,2) default 0,
  estado      text default 'reservada',
  medio_pago  text,
  observaciones text,
  created_at  timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id          bigint generated always as identity primary key,
  usuario_id  uuid references public.profiles(id) on delete set null,
  accion      text,
  tabla       text,
  detalle     text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4) SEGURIDAD (RLS) — politicas por rol
-- ---------------------------------------------------------------------
-- Lectura: cualquier usuario activo del equipo.
-- Alta/edicion: dueno, gerente, empleado.
-- Borrado: solo dueno (informacion sensible).
-- Contador: solo lectura (no entra en alta/edicion/borrado).
do $$
declare
  t text;
  oper text[] := array[
    'clients','reservations','birthday_reservations','sales','sale_items',
    'cash_movements','cash_closures','expenses','products','stock_movements',
    'consoles','console_sessions','poolfootball_sessions'
  ];
begin
  foreach t in array oper loop
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

-- profiles: cada uno ve su perfil; el dueno ve y administra todos.
alter table public.profiles enable row level security;
drop policy if exists profiles_sel on public.profiles;
create policy profiles_sel on public.profiles for select to authenticated
  using (id = auth.uid() or public.mi_rol() = 'dueno');
drop policy if exists profiles_upd on public.profiles;
create policy profiles_upd on public.profiles for update to authenticated
  using (public.mi_rol() = 'dueno') with check (public.mi_rol() = 'dueno');

-- activity_logs: cualquiera activo registra; ven dueno, gerente y contador.
alter table public.activity_logs enable row level security;
drop policy if exists logs_ins on public.activity_logs;
create policy logs_ins on public.activity_logs for insert to authenticated
  with check (public.soy_activo());
drop policy if exists logs_sel on public.activity_logs;
create policy logs_sel on public.activity_logs for select to authenticated
  using (public.mi_rol() in ('dueno','gerente','contador'));

-- ---------------------------------------------------------------------
-- 5) DATOS DE EJEMPLO (opcional — podes borrar este bloque)
-- ---------------------------------------------------------------------
insert into public.consoles (nombre) values
  ('PlayStation 5 - 1'), ('PlayStation 5 - 2'), ('Realidad Virtual'), ('Metegol')
on conflict do nothing;

-- =====================================================================
-- FIN. Si no hubo errores, la base quedo lista para el Paso 4.
-- =====================================================================
