-- =====================================================================
-- DATOS DE EJEMPLO PARA DEPLOY
-- Credenciales de prueba:
--   email: admin@lachispagamer.test
--   password: Demo1234!
-- =====================================================================

create extension if not exists pgcrypto;

alter table public.clients add column if not exists codigo_referido text;
alter table public.clients add column if not exists descuento_pct numeric(5,2) default 0;
alter table public.clients add column if not exists descuento_bienvenida_usado boolean not null default false;
alter table public.clients add column if not exists visitas integer not null default 0;

alter table public.sales add column if not exists descuento numeric(12,2) not null default 0;

alter table public.expenses add column if not exists clasificacion text;
alter table public.expenses add column if not exists vida_util_meses int;

alter table public.walkin_orders add column if not exists telefono text;
alter table public.walkin_orders add column if not exists descuento_pct numeric(5,2) not null default 0;

insert into public.referral_codes (codigo, referidor, descuento_pct, comision_pct, activo, usos)
select v.codigo, v.referidor, v.descuento_pct, v.comision_pct, v.activo, v.usos
from (
  values ('LACHISPAGAMER', 'La Chispa Gamer', 10::numeric, 0::numeric, true, 3)
) as v(codigo, referidor, descuento_pct, comision_pct, activo, usos)
where not exists (select 1 from public.referral_codes rc where rc.codigo = v.codigo);

insert into public.profiles (email, nombre, rol, activo, password_hash)
select s.email, s.nombre, s.rol, s.activo, crypt(s.password, gen_salt('bf'))
from (
  values
    ('admin@lachispagamer.test', 'Admin Demo', 'dueno', true, 'Demo1234!'),
    ('empleado@lachispagamer.test', 'Empleado Demo', 'empleado', true, 'Demo1234!')
) as s(email, nombre, rol, activo, password)
on conflict (email) do update
set nombre = excluded.nombre,
    rol = excluded.rol,
    activo = excluded.activo,
    password_hash = excluded.password_hash;

insert into public.combos (nombre, color, precio, comida, duracion_min, activo)
select v.nombre, v.color, v.precio, v.comida, v.duracion_min, v.activo
from (
  values
    ('Combo Neon', '#19D3FF', 8000::numeric, '1 hora + gaseosa + papas', 60, true),
    ('Combo Gamer', '#FF2EA6', 12000::numeric, '1 hora + hamburguesa + gaseosa', 90, true)
) as v(nombre, color, precio, comida, duracion_min, activo)
where not exists (select 1 from public.combos c where c.nombre = v.nombre);

insert into public.products (nombre, categoria, stock_actual, stock_min, costo, precio, proveedor, activo)
select v.nombre, v.categoria, v.stock_actual, v.stock_min, v.costo, v.precio, v.proveedor, v.activo
from (
  values
    ('Papas fritas', 'snacks', 24::numeric, 6::numeric, 1200::numeric, 2500::numeric, 'Mayorista Central', true),
    ('Gaseosa cola 500ml', 'bebidas', 36::numeric, 12::numeric, 900::numeric, 2200::numeric, 'Bebidas del Sur', true),
    ('Hamburguesa simple', 'bar', 14::numeric, 4::numeric, 2200::numeric, 5200::numeric, 'Cocina', true),
    ('Combo promocional', 'combos', 8::numeric, 2::numeric, 5000::numeric, 10000::numeric, 'Armar', true)
) as v(nombre, categoria, stock_actual, stock_min, costo, precio, proveedor, activo)
where not exists (select 1 from public.products p where p.nombre = v.nombre);

insert into public.clients (nombre, telefono, email, cumpleanos, observaciones, codigo_referido, descuento_pct, descuento_bienvenida_usado, visitas)
select v.nombre, v.telefono, v.email, v.cumpleanos, v.observaciones, v.codigo_referido, v.descuento_pct, v.descuento_bienvenida_usado, v.visitas
from (
  values
    ('Juan Perez', '11 5555 1001', 'juan@example.com', current_date - 40, 'Cliente de ejemplo [seed-demo]', 'LACHISPAGAMER', 10::numeric, false, 1),
    ('Maria Gomez', '11 5555 1002', 'maria@example.com', current_date - 120, 'Cliente frecuente [seed-demo]', null, 0::numeric, false, 3),
    ('Tomas Ruiz', '11 5555 1003', 'tomas@example.com', current_date - 12, 'Cliente nuevo [seed-demo]', 'LACHISPAGAMER', 10::numeric, false, 0)
) as v(nombre, telefono, email, cumpleanos, observaciones, codigo_referido, descuento_pct, descuento_bienvenida_usado, visitas)
where not exists (select 1 from public.clients c where c.telefono = v.telefono);

insert into public.reservations (nombre, telefono, fecha, hora, personas, tipo, sena, total_estimado, estado, observaciones)
select v.nombre, v.telefono, v.fecha, v.hora, v.personas, v.tipo, v.sena, v.total_estimado, v.estado, v.observaciones
from (
  values
    ('Juan Perez', '11 5555 1001', current_date + 1, time '18:30', 8, 'general', 5000::numeric, 20000::numeric, 'confirmada', '[seed-demo] reserva general'),
    ('Maria Gomez', '11 5555 1002', current_date, time '20:00', 6, 'consolas', 3000::numeric, 15000::numeric, 'confirmada', '[seed-demo] reserva consolas')
) as v(nombre, telefono, fecha, hora, personas, tipo, sena, total_estimado, estado, observaciones)
where not exists (
  select 1 from public.reservations r
  where r.fecha = v.fecha
    and coalesce(r.nombre, '') = v.nombre
    and coalesce(r.telefono, '') = v.telefono
);

insert into public.birthday_reservations (cumpleanero, edad, fecha, horario, cant_chicos, cant_adultos, pack, sena, total, estado, observaciones)
select v.cumpleanero, v.edad, v.fecha, v.horario, v.cant_chicos, v.cant_adultos, v.pack, v.sena, v.total, v.estado, v.observaciones
from (
  values
    ('Sofia Garcia', 9, current_date + 7, time '17:00', 10, 12, 'Pack Gamer', 8000::numeric, 35000::numeric, 'confirmado', '[seed-demo] cumple principal'),
    ('Nico Lopez', 7, current_date + 14, time '16:00', 8, 10, 'Pack Neon', 6000::numeric, 28000::numeric, 'consultado', '[seed-demo] cumple secundario')
) as v(cumpleanero, edad, fecha, horario, cant_chicos, cant_adultos, pack, sena, total, estado, observaciones)
where not exists (
  select 1 from public.birthday_reservations b
  where b.fecha = v.fecha and b.cumpleanero = v.cumpleanero
);

insert into public.web_events (tipo, created_at)
select v.tipo, v.created_at
from (
  values
    ('visita', now()),
    ('clic_whatsapp', now())
) as v(tipo, created_at)
where not exists (
  select 1 from public.web_events e
  where e.tipo = v.tipo
    and e.created_at::date = current_date
);

insert into public.web_leads (nombre, telefono, experiencia, dia, hora, personas, codigo_referido, atendido)
select v.nombre, v.telefono, v.experiencia, v.dia, v.hora, v.personas, v.codigo_referido, v.atendido
from (
  values
    ('Agus Torres', '11 6000 2001', 'Cumpleanos', current_date + 3, time '19:00', 12, 'LACHISPAGAMER', false),
    ('Lucia Rivas', '11 6000 2002', 'Consolas', current_date + 4, time '18:00', 5, null, false)
) as v(nombre, telefono, experiencia, dia, hora, personas, codigo_referido, atendido)
where not exists (select 1 from public.web_leads l where l.telefono = v.telefono and coalesce(l.experiencia, '') = v.experiencia);

insert into public.birthday_guests (cumple_nombre, cumple_telefono, cumple_fecha, nino_nombre, nino_detalle, adulto_nombre, adulto_telefono, confirmado)
select v.cumple_nombre, v.cumple_telefono, v.cumple_fecha, v.nino_nombre, v.nino_detalle, v.adulto_nombre, v.adulto_telefono, v.confirmado
from (
  values
    ('Sofia Garcia', '11 7000 3001', current_date + 7, 'Mia', 'Quiere mesa cerca de la pantalla', 'Carla Perez', '11 8000 4001', false),
    ('Sofia Garcia', '11 7000 3001', current_date + 7, 'Bruno', 'Le gustan los juegos de carreras', 'Diego Garcia', '11 8000 4002', false)
) as v(cumple_nombre, cumple_telefono, cumple_fecha, nino_nombre, nino_detalle, adulto_nombre, adulto_telefono, confirmado)
where not exists (
  select 1 from public.birthday_guests g
  where g.cumple_telefono = v.cumple_telefono
    and g.nino_nombre = v.nino_nombre
);

with sale_service as (
  insert into public.sales (fecha, client_id, total, medio_pago, empleado_id, descuento, observaciones)
  select current_date, c.id, 20000::numeric, 'transferencia', p.id, 0::numeric, '[seed-demo] servicio principal'
  from public.clients c
  cross join public.profiles p
  where c.telefono = '11 5555 1001'
    and p.email = 'empleado@lachispagamer.test'
    and not exists (select 1 from public.sales s where s.observaciones = '[seed-demo] servicio principal')
  returning id
)
insert into public.sale_items (sale_id, categoria, descripcion, cantidad, precio_unit, total, product_id)
select id, 'alquiler', 'Alquiler de sala', 2::numeric, 10000::numeric, 20000::numeric, null
from sale_service;

with sale_bar as (
  insert into public.sales (fecha, client_id, total, medio_pago, empleado_id, descuento, observaciones)
  select current_date, c.id, 9700::numeric, 'efectivo', p.id, 0::numeric, '[seed-demo] venta buffet'
  from public.clients c
  cross join public.profiles p
  where c.telefono = '11 5555 1002'
    and p.email = 'admin@lachispagamer.test'
    and not exists (select 1 from public.sales s where s.observaciones = '[seed-demo] venta buffet')
  returning id
)
insert into public.sale_items (sale_id, categoria, descripcion, cantidad, precio_unit, total, product_id)
select id, 'bar', 'Hamburguesa simple', 1::numeric, 5200::numeric, 5200::numeric,
       (select id from public.products where nombre = 'Hamburguesa simple' limit 1)
from sale_bar
union all
select id, 'bebidas', 'Gaseosa cola 500ml', 2::numeric, 2250::numeric, 4500::numeric,
       (select id from public.products where nombre = 'Gaseosa cola 500ml' limit 1)
from sale_bar;

insert into public.cash_movements (fecha, usuario_id, tipo, monto, medio_pago, concepto, observaciones)
select v.fecha, p.id, v.tipo, v.monto, v.medio_pago, v.concepto, v.observaciones
from (
  values
    (current_date, 'ingreso', 20000::numeric, 'transferencia', 'Cobro de sala', '[seed-demo] ingreso caja'),
    (current_date, 'egreso', 4500::numeric, 'efectivo', 'Compra de insumos', '[seed-demo] egreso caja')
) as v(fecha, tipo, monto, medio_pago, concepto, observaciones)
cross join public.profiles p
where p.email = 'admin@lachispagamer.test'
  and not exists (select 1 from public.cash_movements m where m.observaciones = v.observaciones);

insert into public.expenses (fecha, categoria, concepto, monto, medio_pago, comprobante, observaciones, clasificacion, vida_util_meses)
select v.fecha, v.categoria, v.concepto, v.monto, v.medio_pago, v.comprobante, v.observaciones, v.clasificacion, v.vida_util_meses
from (
  values
    (current_date, 'alquiler', 'Alquiler local', 120000::numeric, 'transferencia', 'factura-001.pdf', '[seed-demo] gasto fijo', 'opex_fijo', null::int),
    (current_date, 'equipamiento', 'Consola adicional', 180000::numeric, 'transferencia', 'factura-002.pdf', '[seed-demo] capex', 'capex', 24::int)
) as v(fecha, categoria, concepto, monto, medio_pago, comprobante, observaciones, clasificacion, vida_util_meses)
where not exists (select 1 from public.expenses e where e.observaciones = v.observaciones);

insert into public.cash_closures (fecha, usuario_id, apertura, ingresos, egresos, esperado, real_contado, diferencia, observaciones)
select current_date, p.id, 50000::numeric, 29700::numeric, 4500::numeric, 75200::numeric, 75000::numeric, -200::numeric, '[seed-demo] cierre de caja'
from public.profiles p
where p.email = 'admin@lachispagamer.test'
  and not exists (select 1 from public.cash_closures c where c.fecha = current_date and c.observaciones = '[seed-demo] cierre de caja');

insert into public.consoles (nombre, estado)
select v.nombre, v.estado
from (
  values
    ('PlayStation 5 - Demo', 'disponible'),
    ('Realidad Virtual Demo', 'reservada')
) as v(nombre, estado)
where not exists (select 1 from public.consoles c where c.nombre = v.nombre);

insert into public.console_sessions (console_id, client_id, juego, inicio, fin, precio, estado)
select c.id, cl.id, 'FIFA 26', current_timestamp - interval '2 hours', current_timestamp - interval '1 hour 15 minutes', 7500::numeric, 'cerrada'
from public.consoles c
cross join public.clients cl
where c.nombre = 'PlayStation 5 - Demo'
  and cl.telefono = '11 5555 1002'
  and not exists (
    select 1 from public.console_sessions s
    where s.console_id = c.id and s.juego = 'FIFA 26' and s.inicio::date = current_date
  );

insert into public.poolfootball_sessions (fecha, inicio, fin, client_id, jugadores, precio, estado, medio_pago, observaciones)
select v.fecha, v.inicio, v.fin, cl.id, v.jugadores, v.precio, v.estado, v.medio_pago, v.observaciones
from (
  values
    (current_date, time '19:30', time '20:30', 10, 12000::numeric, 'reservada', 'efectivo', '[seed-demo] pool demo'),
    (current_date - 1, time '21:00', time '22:00', 8, 10000::numeric, 'reservada', 'transferencia', '[seed-demo] pool ayer')
) as v(fecha, inicio, fin, jugadores, precio, estado, medio_pago, observaciones)
cross join public.clients cl
where cl.telefono = '11 5555 1003'
  and not exists (
    select 1 from public.poolfootball_sessions p
    where p.fecha = v.fecha and p.inicio = v.inicio and p.observaciones = v.observaciones
  );

insert into public.walkin_orders (fecha, encargado, personas, sector, combo_id, color, precio, pago_total, medio_pago, hora_pedida, hora_terminada, estado, usuario_id, telefono, descuento_pct)
select current_date, v.encargado, v.personas, v.sector, c.id, v.color, v.precio, v.pago_total, v.medio_pago, v.hora_pedida, v.hora_terminada, v.estado, p.id, v.telefono, v.descuento_pct
from (
  values
    ('Lucia Rivas', 5, 'sector principal', '#19d3ff', 8000::numeric, 8000::numeric, 'efectivo', time '18:05', time '19:05', 'activa', '11 6000 2002', 0::numeric)
) as v(encargado, personas, sector, color, precio, pago_total, medio_pago, hora_pedida, hora_terminada, estado, telefono, descuento_pct)
cross join public.profiles p
cross join public.combos c
where p.email = 'empleado@lachispagamer.test'
  and c.nombre = 'Combo Neon'
  and not exists (
    select 1 from public.walkin_orders w
    where w.fecha = current_date and w.encargado = v.encargado and w.hora_pedida = v.hora_pedida
  );
