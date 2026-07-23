-- ============================================================
-- PASO 12 · Descuento de bienvenida por referido (100% automático)
-- ------------------------------------------------------------
-- Regla del dueño:
--  · El cliente se registra con un código de referido (ej: BRUNENGER).
--  · La PRIMERA vez que pide un servicio (orden de llegada / reserva /
--    cumpleaños) se le descuenta 10% AUTOMÁTICO del total.
--  · Una sola vez por cliente. Si vuelve, no hay descuento, pero suma
--    una visita al sistema de fidelidad.
--  · Los dueños no aplican nada a mano: el sistema lo calcula solo,
--    identificando al cliente por su teléfono.
-- ============================================================

-- 1) Columnas de control en la ficha del cliente
alter table clients add column if not exists descuento_pct numeric not null default 0;
alter table clients add column if not exists descuento_bienvenida_usado boolean not null default false;
alter table clients add column if not exists visitas integer not null default 0;

-- 2) Registro del descuento aplicado en cada venta (para Caja/Reportes)
alter table sales add column if not exists descuento numeric not null default 0;

-- Registro opcional en la orden de llegada
alter table walkin_orders add column if not exists telefono text;
alter table walkin_orders add column if not exists descuento_pct numeric not null default 0;

-- 3) PREVIEW: dice si al cliente le corresponde descuento, SIN consumirlo.
--    Se usa mientras el encargado carga el servicio, para mostrar el total ya rebajado.
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
  return jsonb_build_object(
    'encontrado', true, 'nombre', c.nombre, 'codigo', c.codigo_referido,
    'pct', v_pct, 'visitas', coalesce(c.visitas, 0)
  );
end;
$$;

-- 4) CONSUMIR: se llama al confirmar el servicio. Suma la visita (fidelidad)
--    y, si corresponde, marca el descuento como usado (atómico → una sola vez).
create or replace function registrar_servicio_cliente(p_telefono text)
returns jsonb
language plpgsql
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

  -- fidelidad: siempre suma una visita
  update clients set visitas = coalesce(visitas, 0) + 1 where id = c.id;

  -- descuento de bienvenida: una sola vez
  if c.codigo_referido is not null and coalesce(c.descuento_bienvenida_usado, false) = false then
    update clients set descuento_bienvenida_usado = true where id = c.id;
    v_pct := coalesce(c.descuento_pct, 0);
  end if;

  return jsonb_build_object(
    'encontrado', true, 'client_id', c.id, 'nombre', c.nombre,
    'codigo', c.codigo_referido, 'pct', v_pct, 'visitas', coalesce(c.visitas, 0) + 1
  );
end;
$$;

grant execute on function preview_descuento(text) to authenticated, anon;
grant execute on function registrar_servicio_cliente(text) to authenticated;
