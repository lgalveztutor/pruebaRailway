# Changelog

## 2026-08-01

- Migré la base del proyecto desde Supabase a PostgreSQL en Railway, reemplazando el stack de acceso a datos por [lib/postgres.js](../../lib/postgres.js), [lib/postgres-client.js](../../lib/postgres-client.js) y [lib/postgres-client.server.js](../../lib/postgres-client.server.js).
- Reescribí la autenticación del panel con sesiones firmadas propias, agregando la verificación Edge en [lib/session-edge.js](../../lib/session-edge.js) y ajustando [middleware.js](../../middleware.js) para proteger `/admin` sin depender de `next/headers`.
- Moví los endpoints de API a [pages/api](../../pages/api) para evitar conflictos de build con App Router, dejando allí login, logout, sesión, BD, clientes, descuentos y formularios públicos.
- Marqué los handlers de BD como dinámicos y Node-only para que Next no intente prerenderizarlos durante `next build`.
- Eliminé las dependencias `@supabase/ssr` y `@supabase/supabase-js`, además de los wrappers viejos bajo `lib/supabase/`.
- Reemplacé la mayor parte del panel y de los formularios para que consuman el nuevo cliente PostgreSQL sin cambiar la interfaz de usuario.
- Corregí el error de hidratación en [app/admin/login/page.jsx](../../app/admin/login/page.jsx) haciendo estable el render inicial del aviso de desarrollo.
- Ajusté la ruta de las imágenes del login para que apunten a `/site/galeria/...` y coincidan con la ubicación real bajo `public/site/galeria/`.
- Limpié la documentación y los SQL por pasos para que describan el stack real sobre PostgreSQL/Railway en lugar de Supabase.
- Validé el resultado con `npm run build`, que volvió a compilar correctamente después de la migración y los ajustes de rutas.

## 2026-07-28

- Endurecí `preview_descuento` en [db/paso-12-descuento-bienvenida.sql](../../db/paso-12-descuento-bienvenida.sql): ahora solo se expone a usuarios autenticados y el payload devuelve únicamente `encontrado`, `nombre` y `pct`.
- Hice atómico el consumo del descuento de bienvenida en [db/paso-12-descuento-bienvenida.sql](../../db/paso-12-descuento-bienvenida.sql) usando bloqueo de fila y una sola actualización para visitas + flag de uso.
- Reemplacé las políticas abiertas de invitados en [db/paso-13-invitados.sql](../../db/paso-13-invitados.sql) por reglas basadas en `public.mi_rol()`, limitando lectura y edición por rol real.
- Cerré la purga de invitados en [db/paso-14-invitados-retencion.sql](../../db/paso-14-invitados-retencion.sql): el borrado quedó restringido al dueño y la función administrativa ahora valida rol antes de ejecutar.
- Agregué [db/paso-15-transacciones.sql](../../db/paso-15-transacciones.sql) con funciones atómicas para ventas, movimientos de stock y sesiones de consola, evitando escrituras parciales.
- Refactoricé [components/forms/VentaForm.jsx](../../components/forms/VentaForm.jsx) para usar la RPC atómica de ventas y validar stock antes de enviar la operación.
- Refactoricé [components/forms/StockMovForm.jsx](../../components/forms/StockMovForm.jsx) para delegar el alta de movimientos a una RPC única que ajusta stock y registra la bitácora en la misma transacción.
- Refactoricé [components/forms/ConsolaSessionForm.jsx](../../components/forms/ConsolaSessionForm.jsx) para registrar sesión, estado de consola y venta asociada desde una sola RPC.
- Corregí la fuente de fecha de negocio en [lib/format.js](../../lib/format.js) para que `hoyISO()` use la zona horaria local del local en lugar de UTC.
- Ajusté [app/admin/(panel)/dashboard/page.jsx](../../app/admin/(panel)/dashboard/page.jsx) y [app/admin/(panel)/reportes/page.jsx](../../app/admin/(panel)/reportes/page.jsx) para que los rangos relativos usen fechas locales consistentes.
- Moví la purga de invitados en [app/admin/(panel)/clientes/page.jsx](../../app/admin/(panel)/clientes/page.jsx) a la RPC administrativa `purgar_invitados_viejos`, en lugar de borrar filas directamente desde la vista.
- Creé [data/content.ts](../../data/content.ts) como fuente central de marca, contacto, ubicación, pricing y plantillas de WhatsApp para facilitar cambios rápidos.
- En [public/site/home.html](../../public/site/home.html) centralicé el título, la meta description y el teléfono de WhatsApp en un único objeto runtime y añadí normalización automática de enlaces `wa.me`.
- Alineé [public/site/invitados.html](../../public/site/invitados.html) con la versión de marca 1.8 para evitar títulos inconsistentes.
