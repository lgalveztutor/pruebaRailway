-- ============================================================
-- PASO 15 · Operaciones atómicas para ventas, stock y consolas
-- ------------------------------------------------------------
-- Estas funciones encapsulan escrituras múltiples en una sola
-- transacción de PostgreSQL para evitar estados parciales.
-- ============================================================

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