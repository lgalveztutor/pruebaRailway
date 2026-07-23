# Paso 3 — Base de datos (tablas + roles + seguridad)

Todo está en un solo script: **`db/paso-3-schema.sql`**. Se corre una vez en Supabase.

## Cómo aplicarlo (2 minutos)

1. Entrá a Supabase → tu proyecto → menú izquierdo **SQL Editor**.
2. Click en **New query**.
3. Abrí el archivo `db/paso-3-schema.sql` (con VS Code), copiá TODO el contenido y pegalo.
4. Click en **Run** (o Ctrl+Enter).
5. Si dice *Success / no rows returned*, quedó listo. (El script se puede correr de nuevo sin romper nada.)

## Qué crea

- **15 tablas**: profiles, clients, reservations, birthday_reservations, sales, sale_items,
  cash_movements, cash_closures, expenses, products, stock_movements, consoles,
  console_sessions, poolfootball_sessions, activity_logs.
- **Roles**: dueño, gerente, empleado, contador.
- **Perfiles automáticos**: cada usuario nuevo de Auth genera su perfil solo.
  El **primer** usuario queda como **dueño** automáticamente (vos, que ya creaste tu usuario en el Paso 2).
- **Seguridad RLS** en todas las tablas:
  - Leer: cualquier miembro activo del equipo.
  - Cargar / editar: dueño, gerente, empleado.
  - Borrar: solo dueño.
  - Contador: solo lectura.
- 4 consolas de ejemplo (PS5 x2, VR, Metegol). Podés editarlas o borrarlas después.

## Cómo cambiar el rol de alguien

Cuando sumes gente al equipo, en Supabase → **Table Editor → profiles**, editás la
columna `rol` de esa persona (`gerente`, `empleado` o `contador`). El dueño no se toca.

## Verificar que quedó bien

En Supabase → **Table Editor** deberías ver las 16 tablas. En `profiles` tenés que verte
a vos con `rol = dueno`.

---

Con esto listo, el **Paso 4** conecta el dashboard a estos datos (KPIs reales, Caja, Ventas,
Reservas, Gastos y Clientes funcionando).
