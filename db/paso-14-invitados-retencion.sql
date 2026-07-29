-- ============================================================
-- PASO 14 · Retención de invitados (máx. 1 mes) + permiso de borrado
-- ------------------------------------------------------------
-- La lista de invitados se guarda hasta 1 mes para no saturar la base.
-- El panel purga solo los contactos con más de 31 días cada vez que se
-- abre Clientes. Antes del cierre de mes, los dueños descargan el ZIP.
-- ============================================================

drop policy if exists "invitados_delete_staff" on birthday_guests;
create policy "invitados_delete_staff" on birthday_guests
  for delete to authenticated using (public.mi_rol() = 'dueno');

grant delete on birthday_guests to authenticated;

-- Opcional: función para purgar manualmente desde SQL si hiciera falta.
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

grant execute on function purgar_invitados_viejos() to authenticated;
