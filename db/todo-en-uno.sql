-- =====================================================================
-- LA CHISPA GAMER 1.8 — SQL UNIFICADO
-- Incluye los pasos 3, 6, 7, 8, 9, 10, 11, 12, 13, 14 y 15
-- para ejecutar todo junto en una pagina externa.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PASO 3 — Base de datos: tablas, roles y seguridad
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  nombre     text,
  email      text unique,
  rol        text not null default 'empleado'
             check (rol in ('dueno','gerente','empleado','contador')),
  activo     boolean not null default true,
  password_hash text,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_id()
returns uuid language sql stable security definer set search_path = public
as $$ select nullif(current_setting('app.user_id', true), '')::uuid $$;

create or replace function public.mi_rol()
returns text language sql stable security definer set search_path = public
as $$ select rol from public.profiles where id = public.current_user_id() $$;

create or replace function public.soy_activo()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select activo from public.profiles where id = public.current_user_id()), false) $$;

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
  nombre        text,
  telefono      text,
  fecha         date not null,
  hora          time,
  personas      int,
  tipo          text,
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
  medio_pago  text,
  empleado_id uuid references public.profiles(id) on delete set null,
  observaciones text,
  created_at  timestamptz not null default now()
);

create table if not exists public.sale_items (
  id            bigint generated always as identity primary key,
  sale_id       bigint not null references public.sales(id) on delete cascade,
  categoria     text,
  descripcion   text,
  cantidad      numeric(12,2) not null default 1,
  precio_unit   numeric(12,2) not null default 0,
  total         numeric(12,2) not null default 0,
  product_id    bigint
);

create table if not exists public.cash_movements (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  usuario_id  uuid references public.profiles(id) on delete set null,
  tipo        text not null check (tipo in ('ingreso','egreso')),
  monto       numeric(12,2) not null,
  medio_pago  text,
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
  esperado     numeric(12,2) default 0,
  real_contado numeric(12,2) default 0,
  diferencia   numeric(12,2) default 0,
  observaciones text,
  created_at   timestamptz not null default now()
);

create table if not exists public.expenses (
  id          bigint generated always as identity primary key,
  fecha       date not null default current_date,
  categoria   text,
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
  categoria    text,
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
  motivo      text,
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
    execute format('create policy %I on public.%I for select using (public.soy_activo());', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I;', t||'_ins', t);
    execute format('create policy %I on public.%I for insert with check (public.mi_rol() in (''dueno'',''gerente'',''empleado''));', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I;', t||'_upd', t);
    execute format('create policy %I on public.%I for update using (public.mi_rol() in (''dueno'',''gerente'',''empleado'')) with check (public.mi_rol() in (''dueno'',''gerente'',''empleado''));', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I;', t||'_del', t);
    execute format('create policy %I on public.%I for delete using (public.mi_rol() = ''dueno'');', t||'_del', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists profiles_sel on public.profiles;
create policy profiles_sel on public.profiles for select
  using (id = public.current_user_id() or public.mi_rol() = 'dueno');
drop policy if exists profiles_upd on public.profiles;
create policy profiles_upd on public.profiles for update
  using (public.mi_rol() = 'dueno') with check (public.mi_rol() = 'dueno');

alter table public.activity_logs enable row level security;
drop policy if exists logs_ins on public.activity_logs;
create policy logs_ins on public.activity_logs for insert
  with check (public.soy_activo());
drop policy if exists logs_sel on public.activity_logs;
create policy logs_sel on public.activity_logs for select
  using (public.mi_rol() in ('dueno','gerente','contador'));

insert into public.consoles (nombre) values
  ('PlayStation 5 - 1'), ('PlayStation 5 - 2'), ('Realidad Virtual'), ('Metegol')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- PASO 6 — Pulseras / órdenes de llegada + combos
-- ---------------------------------------------------------------------
create table if not exists public.combos (
  id           bigint generated always as identity primary key,
  nombre       text not null,
  color        text not null default '#19D3FF',
  precio       numeric(12,2) not null default 0,
  comida       text,
  duracion_min int not null default 60,
  activo       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.walkin_orders (
  id            bigint generated always as identity primary key,
  fecha         date not null default current_date,
  encargado     text not null,
  personas      int,
  sector        text,
  combo_id      bigint references public.combos(id) on delete set null,
  color         text,
  precio        numeric(12,2) not null default 0,
  pago_total    numeric(12,2) not null default 0,
  medio_pago    text,
  hora_pedida   time,
  hora_terminada time,
  estado        text not null default 'activa' check (estado in ('activa','devuelta')),
  usuario_id    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

do $$
declare t text;
  tablas text[] := array['combos','walkin_orders'];
begin
  foreach t in array tablas loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t||'_sel', t);
    execute format('create policy %I on public.%I for select using (public.soy_activo());', t||'_sel', t);
    execute format('drop policy if exists %I on public.%I;', t||'_ins', t);
    execute format('create policy %I on public.%I for insert with check (public.mi_rol() in (''dueno'',''gerente'',''empleado''));', t||'_ins', t);
    execute format('drop policy if exists %I on public.%I;', t||'_upd', t);
    execute format('create policy %I on public.%I for update using (public.mi_rol() in (''dueno'',''gerente'',''empleado'')) with check (public.mi_rol() in (''dueno'',''gerente'',''empleado''));', t||'_upd', t);
    execute format('drop policy if exists %I on public.%I;', t||'_del', t);
    execute format('create policy %I on public.%I for delete using (public.mi_rol() = ''dueno'');', t||'_del', t);
  end loop;
end $$;

insert into public.combos (nombre, color, precio, comida)
select * from (values
  ('Combo Verde',   '#9CFF2E', 6000::numeric,  '1 hora + gaseosa + papas'),
  ('Combo Cyan',    '#19D3FF', 8000::numeric,  '1 hora + hamburguesa + gaseosa'),
  ('Combo Magenta', '#FF2EA6', 10000::numeric, '1 hora + combo doble + gaseosa'),
  ('Combo Amarillo','#FFD166', 12000::numeric, '1 hora + pizza chica + gaseosas'),
  ('Combo Naranja', '#FF7A00', 15000::numeric, '1 hora + pizza grande + gaseosas')
) as v(nombre,color,precio,comida)
where not exists (select 1 from public.combos);

-- ---------------------------------------------------------------------
-- PASO 7 — Estados editables
-- ---------------------------------------------------------------------
alter table public.reservations drop constraint if exists reservations_estado_check;
alter table public.birthday_reservations drop constraint if exists birthday_reservations_estado_check;

-- ---------------------------------------------------------------------
-- PASO 8 — Sistema de referidos
-- ---------------------------------------------------------------------
create table if not exists public.referral_codes (
  id            bigint generated always as identity primary key,
  codigo        text unique not null,
  referidor     text,
  descuento_pct numeric(5,2) not null default 0,
  comision_pct  numeric(5,2) not null default 0,
  activo        boolean not null default true,
  usos          int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.clients add column if not exists codigo_referido text;
alter table public.clients add column if not exists descuento_pct  numeric(5,2) default 0;

alter table public.referral_codes enable row level security;
drop policy if exists rc_sel on public.referral_codes;
create policy rc_sel on public.referral_codes for select using (public.soy_activo());
drop policy if exists rc_ins on public.referral_codes;
create policy rc_ins on public.referral_codes for insert with check (public.mi_rol() in ('dueno','gerente'));
drop policy if exists rc_upd on public.referral_codes;
create policy rc_upd on public.referral_codes for update using (public.mi_rol() in ('dueno','gerente')) with check (public.mi_rol() in ('dueno','gerente'));
drop policy if exists rc_del on public.referral_codes;
create policy rc_del on public.referral_codes for delete using (public.mi_rol() = 'dueno');

create or replace function public.usar_codigo(p_codigo text)
returns void language sql security definer set search_path = public
as $$ update public.referral_codes set usos = usos + 1 where upper(codigo) = upper(p_codigo); $$;

delete from public.referral_codes where codigo = 'BRUNENGER';

insert into public.referral_codes (codigo, referidor, descuento_pct, comision_pct)
values ('LACHISPAGAMER', 'La Chispa Gamer', 10, 0)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------
-- PASO 9 — Embudo web / leads
-- ---------------------------------------------------------------------
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

alter table public.web_leads add column if not exists telefono text;
alter table public.web_leads enable row level security;

drop policy if exists wl_ins on public.web_leads;
create policy wl_ins on public.web_leads
  for insert with check (true);

drop policy if exists wl_sel on public.web_leads;
create policy wl_sel on public.web_leads
  for select using (public.soy_activo());
drop policy if exists wl_upd on public.web_leads;
create policy wl_upd on public.web_leads
  for update using (public.soy_activo()) with check (public.soy_activo());
drop policy if exists wl_del on public.web_leads;
create policy wl_del on public.web_leads
  for delete using (public.mi_rol() in ('dueno','gerente'));

-- ---------------------------------------------------------------------
-- PASO 10 — Tracking web
-- ---------------------------------------------------------------------
create table if not exists public.web_events (
  id         bigint generated always as identity primary key,
  tipo       text not null check (tipo in ('visita', 'clic_whatsapp')),
  created_at timestamptz not null default now()
);

alter table public.web_events enable row level security;

drop policy if exists we_ins on public.web_events;
create policy we_ins on public.web_events
  for insert with check (tipo in ('visita', 'clic_whatsapp'));

drop policy if exists we_sel on public.web_events;
create policy we_sel on public.web_events
  for select using (public.soy_activo());

create index if not exists web_events_tipo_idx on public.web_events (tipo);

-- ---------------------------------------------------------------------
-- PASO 11 — Motor financiero
-- ---------------------------------------------------------------------
alter table public.expenses add column if not exists clasificacion text;
alter table public.expenses add column if not exists vida_util_meses int;

-- ---------------------------------------------------------------------
-- PASO 12 — Descuento de bienvenida por referido
-- ---------------------------------------------------------------------
alter table public.clients add column if not exists descuento_pct numeric not null default 0;
alter table public.clients add column if not exists descuento_bienvenida_usado boolean not null default false;
alter table public.clients add column if not exists visitas integer not null default 0;

alter table public.sales add column if not exists descuento numeric not null default 0;

alter table public.walkin_orders add column if not exists telefono text;
alter table public.walkin_orders add column if not exists descuento_pct numeric not null default 0;

create or replace function preview_descuento(p_telefono text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c clients%rowtype;
  v_pct numeric := 0;
begin
  if p_telefono is null or btrim(p_telefono) = '' then
    return jsonb_build_object('encontrado', false, 'pct', 0);
  end if;
  select * into c from clients where telefono = btrim(p_telefono) order by created_at asc limit 1;
  if not found then
    return jsonb_build_object('encontrado', false, 'pct', 0);
  end if;
  if c.codigo_referido is not null and coalesce(c.descuento_bienvenida_usado, false) = false then
    v_pct := coalesce(c.descuento_pct, 0);
  end if;
  return jsonb_build_object('encontrado', true, 'nombre', c.nombre, 'pct', v_pct);
end;
$$;

create or replace function registrar_servicio_cliente(p_telefono text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c clients%rowtype;
  v_pct numeric := 0;
  v_visitas integer := 0;
begin
  if p_telefono is null or btrim(p_telefono) = '' then
    return jsonb_build_object('encontrado', false, 'pct', 0);
  end if;
  select * into c from clients where telefono = btrim(p_telefono) order by created_at asc limit 1 for update;
  if not found then
    return jsonb_build_object('encontrado', false, 'pct', 0);
  end if;

  update clients
  set visitas = coalesce(visitas, 0) + 1,
      descuento_bienvenida_usado = case
        when c.codigo_referido is not null and coalesce(c.descuento_bienvenida_usado, false) = false then true
        else descuento_bienvenida_usado
      end
  where id = c.id
  returning visitas into v_visitas;

  if c.codigo_referido is not null and coalesce(c.descuento_bienvenida_usado, false) = false then
    v_pct := coalesce(c.descuento_pct, 0);
  end if;

  return jsonb_build_object(
    'encontrado', true, 'client_id', c.id, 'nombre', c.nombre,
    'pct', v_pct, 'visitas', v_visitas
  );
end;
$$;

grant execute on function preview_descuento(text) to public;
grant execute on function registrar_servicio_cliente(text) to public;

-- ---------------------------------------------------------------------
-- PASO 13 — Lista de invitados de cumpleaños
-- ---------------------------------------------------------------------
create table if not exists public.birthday_guests (
  id               bigint generated by default as identity primary key,
  created_at       timestamptz not null default now(),
  cumple_nombre    text,
  cumple_telefono  text,
  cumple_fecha     date,
  nino_nombre      text not null,
  nino_detalle     text,
  adulto_nombre    text not null,
  adulto_telefono  text not null,
  confirmado       boolean not null default false
);

create index if not exists idx_birthday_guests_cumple on birthday_guests (cumple_telefono, cumple_nombre);

alter table birthday_guests enable row level security;

drop policy if exists "invitados_insert_publico" on birthday_guests;
create policy "invitados_insert_publico" on birthday_guests
  for insert with check (true);

drop policy if exists "invitados_select_staff" on birthday_guests;
create policy "invitados_select_staff" on birthday_guests
  for select using (public.mi_rol() in ('dueno', 'gerente', 'contador'));

drop policy if exists "invitados_update_staff" on birthday_guests;
create policy "invitados_update_staff" on birthday_guests
  for update using (public.mi_rol() in ('dueno', 'gerente')) with check (public.mi_rol() in ('dueno', 'gerente'));

-- ---------------------------------------------------------------------
-- PASO 14 — Retención de invitados y permiso de borrado
-- ---------------------------------------------------------------------
drop policy if exists "invitados_delete_staff" on birthday_guests;
create policy "invitados_delete_staff" on birthday_guests
  for delete using (public.mi_rol() = 'dueno');

create or replace function purgar_invitados_viejos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if public.mi_rol() not in ('dueno', 'gerente') then
    raise exception 'No autorizado para purgar invitados viejos';
  end if;
  delete from birthday_guests where created_at < now() - interval '31 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function purgar_invitados_viejos() to public;

-- ---------------------------------------------------------------------
-- PASO 15 — Operaciones atomicas para ventas, stock y consolas
-- ---------------------------------------------------------------------
create or replace function registrar_venta_productos(
  p_fecha date,
  p_medio_pago text,
  p_empleado_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id bigint;
  v_total numeric(12,2) := 0;
  item jsonb;
  v_product_id bigint;
  v_cantidad numeric(12,2);
  v_precio_unit numeric(12,2);
  v_total_item numeric(12,2);
  v_stock_actual numeric(12,2);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta necesita al menos un item';
  end if;

  for item in select * from jsonb_array_elements(p_items) loop
    v_total_item := coalesce((item ->> 'total')::numeric, 0);
    if v_total_item < 0 then
      raise exception 'El total de cada item debe ser positivo';
    end if;
    v_total := v_total + v_total_item;
  end loop;

  insert into sales (fecha, total, medio_pago, empleado_id)
  values (coalesce(p_fecha, current_date), v_total, p_medio_pago, p_empleado_id)
  returning id into v_sale_id;

  for item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (item ->> 'product_id')::bigint;
    v_cantidad := coalesce((item ->> 'cantidad')::numeric, 0);
    v_precio_unit := coalesce((item ->> 'precio_unit')::numeric, 0);
    v_total_item := coalesce((item ->> 'total')::numeric, 0);

    if v_product_id is null then
      raise exception 'Falta product_id en un item de la venta';
    end if;
    if v_cantidad <= 0 then
      raise exception 'La cantidad de un item debe ser mayor que cero';
    end if;

    select stock_actual into v_stock_actual
    from products
    where id = v_product_id
    for update;

    if not found then
      raise exception 'El producto % no existe', v_product_id;
    end if;
    if v_stock_actual < v_cantidad then
      raise exception 'Stock insuficiente para el producto %', v_product_id;
    end if;

    update products
    set stock_actual = v_stock_actual - v_cantidad
    where id = v_product_id;

    insert into sale_items (
      sale_id, categoria, descripcion, cantidad, precio_unit, total, product_id
    )
    values (
      v_sale_id,
      item ->> 'categoria',
      item ->> 'nombre',
      v_cantidad,
      v_precio_unit,
      v_total_item,
      v_product_id
    );

    insert into stock_movements (
      product_id, tipo, cantidad, motivo, usuario_id
    )
    values (
      v_product_id,
      'egreso',
      v_cantidad,
      'venta',
      p_empleado_id
    );
  end loop;

  return jsonb_build_object('sale_id', v_sale_id, 'total', v_total);
end;
$$;

create or replace function registrar_movimiento_stock(
  p_product_id bigint,
  p_tipo text,
  p_cantidad numeric,
  p_motivo text,
  p_usuario_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_actual numeric(12,2);
  v_nuevo_stock numeric(12,2);
begin
  if p_product_id is null then
    raise exception 'Falta product_id';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor que cero';
  end if;
  if p_tipo not in ('ingreso', 'egreso', 'ajuste') then
    raise exception 'Tipo de movimiento inválido';
  end if;

  select stock_actual into v_stock_actual
  from products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'El producto % no existe', p_product_id;
  end if;

  if p_tipo = 'ingreso' then
    v_nuevo_stock := v_stock_actual + p_cantidad;
  elsif p_tipo = 'egreso' then
    if v_stock_actual < p_cantidad then
      raise exception 'Stock insuficiente para el egreso';
    end if;
    v_nuevo_stock := v_stock_actual - p_cantidad;
  else
    v_nuevo_stock := p_cantidad;
  end if;

  update products set stock_actual = v_nuevo_stock where id = p_product_id;

  insert into stock_movements (product_id, tipo, cantidad, motivo, usuario_id)
  values (p_product_id, p_tipo, p_cantidad, p_motivo, p_usuario_id);

  return jsonb_build_object('product_id', p_product_id, 'stock_actual', v_nuevo_stock);
end;
$$;

create or replace function registrar_sesion_consola(
  p_console_id bigint,
  p_juego text,
  p_inicio timestamptz,
  p_fin timestamptz,
  p_precio numeric,
  p_empleado_id uuid,
  p_fecha date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_console_name text;
  v_session_id bigint;
  v_sale_id bigint;
  v_estado text;
begin
  if p_console_id is null then
    raise exception 'Falta console_id';
  end if;

  select nombre into v_console_name
  from consoles
  where id = p_console_id;

  if not found then
    raise exception 'La consola % no existe', p_console_id;
  end if;

  v_estado := case when p_fin is null then 'abierta' else 'cerrada' end;

  insert into console_sessions (
    console_id, juego, inicio, fin, precio, estado
  )
  values (
    p_console_id,
    nullif(p_juego, ''),
    p_inicio,
    p_fin,
    coalesce(p_precio, 0),
    case when p_fin is null then 'abierta' else 'cerrada' end
  )
  returning id into v_session_id;

  update consoles
  set estado = case when p_fin is null then 'en_uso' else 'disponible' end
  where id = p_console_id;

  if coalesce(p_precio, 0) > 0 then
    insert into sales (fecha, total, medio_pago, empleado_id)
    values (coalesce(p_fecha, current_date), p_precio, 'efectivo', p_empleado_id)
    returning id into v_sale_id;

    insert into sale_items (
      sale_id, categoria, descripcion, cantidad, precio_unit, total
    )
    values (
      v_sale_id,
      'consolas',
      v_console_name || case when nullif(p_juego, '') is not null then ' · ' || p_juego else '' end,
      1,
      p_precio,
      p_precio
    );
  end if;

  return jsonb_build_object('session_id', v_session_id, 'sale_id', v_sale_id, 'estado', v_estado);
end;
$$;

grant execute on function preview_descuento(text) to public;
grant execute on function registrar_servicio_cliente(text) to public;
grant execute on function registrar_venta_productos(date, text, uuid, jsonb) to public;
grant execute on function registrar_movimiento_stock(bigint, text, numeric, text, uuid) to public;
grant execute on function registrar_sesion_consola(bigint, text, timestamptz, timestamptz, numeric, uuid, date) to public;

-- =====================================================================
-- FIN
-- =====================================================================