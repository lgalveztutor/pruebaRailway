# Informe de Auditoría

## Resumen Ejecutivo

Estado general: Riesgoso. El sistema tiene buenas bases de separación entre panel, web pública y PostgreSQL, pero hay exposiciones de datos y problemas de consistencia que conviene corregir antes de escalar.

Calificación: 4/10

Fecha: 2026-07-28

Auditor: GitHub Copilot

---

# Hallazgos

## Críticos

### 1. Exposición de datos personales vía RPC pública de descuentos

Ubicación: [db/paso-12-descuento-bienvenida.sql](../../db/paso-12-descuento-bienvenida.sql)

Descripción: La función `preview_descuento(p_telefono)` está marcada como `security definer` y tiene `grant execute` para `anon`. Devuelve `nombre`, `codigo`, `pct` y `visitas` de la primera coincidencia por teléfono, por lo que un tercero con la anon key puede consultar si un número existe y recuperar datos de cliente sin autenticación.

Impacto: Filtración de PII y de información de fidelidad/referidos. Cualquier visitante podría enumerar teléfonos, identificar clientes y conocer si tienen descuento o cuántas visitas acumulan.

Cómo solucionarlo: Restringir la RPC a usuarios autenticados del panel o sustituirla por un flujo server-side con autorización explícita. Si debe seguir disponible, devolver solo el porcentaje necesario y nunca nombre/código/visitas para llamadas anónimas.

Buenas prácticas relacionadas: mínimo privilegio, no exponer funciones `security definer` a `anon`, evitar devolver más datos de los estrictamente necesarios.

## Altos

### 2. La tabla de invitados de cumpleaños quedó abierta a cualquier usuario autenticado

Ubicación: [db/paso-13-invitados.sql](../../db/paso-13-invitados.sql), [db/paso-14-invitados-retencion.sql](../../db/paso-14-invitados-retencion.sql)

Descripción: Las políticas `invitados_select_staff`, `invitados_update_staff` y `invitados_delete_staff` usan `using (true)` / `with check (true)` para `authenticated`, y además se otorgan permisos `select`, `update` y `delete` a ese rol. Eso deja lectura y modificación total de nombres y teléfonos de adultos responsables en manos de cualquier sesión autenticada, sin distinguir rol.

Impacto: Exposición y manipulación de datos sensibles de contactos. Un empleado o cuenta comprometida puede leer, editar o borrar toda la lista de invitados. Además, el panel ejecuta purgas desde la vista de Clientes, por lo que el borrado queda habilitado de forma muy amplia.

Cómo solucionarlo: Limitar lectura y escritura por rol real del negocio usando `public.mi_rol()` y separar claramente quién puede ver, editar o borrar. Para la retención, mover la purga a una tarea administrativa o RPC restringida a dueño/gerente.

Buenas prácticas relacionadas: RLS por rol, separación de permisos por operación, no usar `true` en políticas de producción, gestión administrativa fuera de los renders de página.

### 3. Stock y ventas no se actualizan de forma atómica y pueden quedar inconsistentes

Ubicación: [components/forms/VentaForm.jsx](../../components/forms/VentaForm.jsx), [components/forms/StockMovForm.jsx](../../components/forms/StockMovForm.jsx), [components/forms/ConsolaSessionForm.jsx](../../components/forms/ConsolaSessionForm.jsx)

Descripción: Las operaciones críticas hacen varios writes consecutivos sin transacción ni rollback. En ventas, primero se inserta la cabecera y el detalle, luego se descuenta stock y se registra el movimiento. En movimientos de stock, primero se actualiza `products.stock_actual` y después se registra el movimiento. Si un paso intermedio falla, el sistema deja datos parciales.

Impacto: Inventario desfasado, movimientos faltantes y potenciales diferencias entre caja, stock y reportes. En `VentaForm` además no hay validación para impedir stock negativo, así que se pueden registrar ventas por encima del stock disponible.

Cómo solucionarlo: Encapsular cabecera, detalle, stock y bitácora en una transacción o en una RPC backend única. Antes de descontar, validar stock disponible y rechazar la operación si no alcanza.

Buenas prácticas relacionadas: transacciones atómicas, validación de reglas de negocio en backend, integridad referencial con checks explícitos, evitar escrituras coordinadas desde el cliente sin garantía de rollback.

## Medios

### 4. El helper de fecha usa UTC y desplaza el día real en horarios locales

Ubicación: [lib/format.js](../../lib/format.js), [app/admin/(panel)/reportes/page.jsx](../../app/admin/(panel)/reportes/page.jsx), [app/admin/(panel)/dashboard/page.jsx](../../app/admin/(panel)/dashboard/page.jsx), [components/forms/ConsolaSessionForm.jsx](../../components/forms/ConsolaSessionForm.jsx)

Descripción: `hoyISO()` devuelve `new Date().toISOString().slice(0, 10)`, o sea fecha UTC. Varias pantallas y formularios lo usan para filtrar, crear o mostrar registros del día. En una operación local como esta, cerca de medianoche Argentina el sistema puede guardar o consultar el día equivocado.

Impacto: KPIs, cierres, ventas y reservas pueden caer en el día incorrecto, generando diferencias visibles en reportes y en la carga operativa.

Cómo solucionarlo: Centralizar una única función de fecha local del negocio, usando la zona horaria correcta, y usarla de forma consistente en clientes, reportes y filtros.

Buenas prácticas relacionadas: normalización de zona horaria, una sola fuente de verdad para fechas de negocio, evitar mezclar UTC con lógica comercial local.

### 5. El dashboard trunca datos con límites fijos y subcuenta métricas

Ubicación: [app/admin/(panel)/dashboard/page.jsx](../../app/admin/(panel)/dashboard/page.jsx)

Descripción: Las consultas de `reservations`, `birthday_reservations`, `poolfootball_sessions` y `sale_items` usan `limit(2000)`/`limit(3000)` antes de agregar. Si el volumen real supera esos cortes, el heatmap, el top de productos y otras métricas se calculan sobre un subconjunto.

Impacto: Analítica incompleta sin aviso. A medida que crecen los datos, el tablero deja de representar la actividad real del negocio.

Cómo solucionarlo: Agregar en SQL o en el backend con filtros y agregaciones específicas, o paginar/streaming de forma explícita. Evitar límites arbitrarios en métricas agregadas.

Buenas prácticas relacionadas: agregación del lado servidor, evitar truncado silencioso, consultas diseñadas para analítica y no para UI transaccional.

### 6. El consumo del descuento de bienvenida no es verdaderamente atómico

Ubicación: [db/paso-12-descuento-bienvenida.sql](../../db/paso-12-descuento-bienvenida.sql)

Descripción: `registrar_servicio_cliente(p_telefono)` lee el cliente, calcula el descuento y luego ejecuta dos `update` separados. Aunque el comentario dice que es atómico, dos llamadas concurrentes pueden ver el mismo estado previo y consumir el beneficio dos veces.

Impacto: Descuentos duplicados, totales incorrectos y potencial fuga de margen en picos de carga o doble click/duplicación de requests.

Cómo solucionarlo: Bloquear la fila con `select ... for update`, o usar una sola sentencia condicional que actualice y devuelva el estado solo si `descuento_bienvenida_usado = false`.

Buenas prácticas relacionadas: idempotencia, control de concurrencia, bloqueo de fila cuando una regla depende de un estado previo.

---

# Deuda Técnica

- Doble fuente de verdad para fechas locales y UTC.
- Mucha lógica de negocio vive en el cliente y en páginas Server Component en vez de en transacciones o RPCs dedicadas.
- Algunos límites de consulta están pensados para UI, no para analítica.

---

# Mejoras sugeridas

- Mover las operaciones críticas de venta, stock y descuentos a funciones transaccionales del lado de PostgreSQL.
- Revisar todas las políticas RLS de tablas con datos personales y reemplazar `true` por roles concretos.
- Unificar el manejo de fechas en horario local del negocio.
- Replantear el dashboard para que agregue datos en el servidor en vez de descargar filas crudas.

---

# Riesgos

- Exposición de datos de clientes e invitados si se compromete una sesión autenticada o un endpoint interno.
- Descuadres de inventario y caja por escrituras parciales.
- Reportes engañosos por truncado de datos y por desfases de fecha.

---

# Próximos pasos

1. Cerrar la fuga crítica de `preview_descuento`.
2. Endurecer RLS de invitados y mover la purga a un flujo administrativo.
3. Corregir stock/ventas con transacciones y validaciones de inventario.
4. Normalizar fechas en horario local.
5. Rehacer las agregaciones del dashboard sin límites arbitrarios.