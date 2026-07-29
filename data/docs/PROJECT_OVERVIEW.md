# Project Overview

## Información general

Nombre: La Chispa Gamer 1.8

Descripción: sistema web y panel de administración para un salón gamer. La web pública vive en `/` y el panel interno en `/admin`, ambos dentro del mismo proyecto Next.js y conectados a una única base de datos en Supabase.

Cliente: La Chispa Gamer

Repositorio: LachispaGamer

Versión: 1.8

Estado:
- Desarrollo
- Producción
- Mantenimiento

---

# Objetivo del sistema

Resuelve la operación diaria de un salón gamer: captación de consultas desde la web, gestión de reservas, cumpleaños, caja, ventas, stock, consolas, pool fútbol, gastos, reportes y seguimiento de clientes.

Los usuarios principales son el equipo interno del local. La web pública la usan visitantes y potenciales clientes; el panel lo usan dueño, gerente, empleados y contador según rol.

Las funcionalidades principales incluyen login con Supabase Auth, dashboard con KPIs, formulario y listado de ventas, caja diaria, reservas, cumpleaños, stock, consolas, pool fútbol, gastos, clientes, calendario, reportes y captación de leads/eventos desde la web pública.

---

# Stack Tecnológico

## Frontend

Framework: Next.js 14.2.5 con App Router.

Lenguaje: JavaScript.

Gestor de paquetes: npm.

UI Library: React 18.3.1. Visualmente mezcla CSS propio, estilos inline, layouts de panel y componentes de gráficos con Recharts.

Estado: proyecto activo, con web pública estática servida por rewrite y panel administrativo dinámico.

## Backend

Framework: Next.js del lado servidor, usando Server Components y middleware.

Lenguaje: JavaScript.

Base de datos: Supabase Postgres.

ORM: no hay ORM detectado; el acceso se hace directo con `@supabase/supabase-js` y `@supabase/ssr`.

Autenticación: Supabase Auth.

## Infraestructura

Hosting: Vercel, según el README.

CI/CD: no se detecta pipeline definido en este workspace.

Docker: no se detecta.

Cloud: Supabase para Auth, base de datos y almacenamiento lógico del negocio.

Storage: Supabase para datos; además hay assets estáticos en `public/site/` y recursos de login en `public/login/`.

---

# Variables de entorno

| Variable | Descripción | Obligatoria |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase usada por cliente, servidor y middleware | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key pública de Supabase para autenticación y consultas sujetas a RLS | Sí |

---

# Arquitectura

La arquitectura es de un solo proyecto Next.js con dos zonas claras:

Frontend público
↓
rewrite `/` → `public/site/home.html`
↓
captación de leads y eventos en Supabase

Panel administrativo
↓
`/admin`
↓
middleware de autenticación + verificación de sesión en servidor
↓
Server Components para lectura de datos
↓
Client Components para formularios y mutaciones
↓
Supabase Postgres con RLS

El patrón dominante es “thin UI, data access directo”: las páginas del panel consultan Supabase desde el servidor para armar KPIs y tablas, mientras que los formularios del navegador escriben directamente con la anon key, apoyándose en RLS para seguridad.

La web pública no se reconstruye dentro de React: se sirve tal como está exportada, para no alterar el sitio existente.

---

# Estructura del proyecto

`app/`

`app/admin/`

`app/admin/(panel)/`

`app/admin/login/`

`components/`

`components/forms/`

`components/charts/`

`lib/`

`lib/supabase/`

`db/`

`public/site/`

`public/login/`

La estructura real ya está más especializada que la plantilla original. No usa `src/`, ni `pages/`, ni un backend separado. El centro del negocio está en `app/admin/(panel)/` y en `components/forms/`.

---

# Dependencias importantes

Nombre | Uso | Motivo
--- | --- | ---
`next` | Framework principal | Define App Router, layouts, middleware, rewrites y Server Components
`react` / `react-dom` | UI | Base de la interfaz
`@supabase/supabase-js` | Cliente de Supabase | Consultas y mutaciones desde el navegador
`@supabase/ssr` | Cliente SSR de Supabase | Integración con cookies, middleware y Server Components
`recharts` | Gráficos | Dashboard con embudo, donut, heatmap y métricas visuales

También son relevantes las utilidades locales en `lib/format.js`, `lib/categorias.js`, `lib/finanzas.js` y `lib/descuento.js`, porque centralizan cálculos de negocio que se reutilizan en varias pantallas.

---

# Flujo principal

1. El visitante entra al sitio público en `/`, servido desde `public/site/home.html`.
2. La web pública puede registrar visitas, clics de WhatsApp, leads y formularios vinculados a Supabase.
3. El usuario interno entra a `/admin`.
4. `middleware.js` valida la sesión con Supabase y redirige a `/admin/login` si no hay usuario autenticado.
5. Si hay sesión, `app/admin/(panel)/layout.jsx` vuelve a verificarla en servidor y renderiza el sidebar del panel.
6. El dashboard lee KPIs, embudos y gráficos desde Supabase.
7. Los módulos operativos permiten cargar ventas, caja, reservas, cumpleaños, stock, gastos, consolas, pool fútbol, clientes y reportes.
8. Los cambios se guardan directo en Supabase y quedan limitados por RLS según el rol del usuario.
9. El usuario cierra sesión desde el sidebar y vuelve al login.

---

# Convenciones

Nomenclatura: mezcla de español funcional del negocio con nombres técnicos en inglés cuando vienen de Supabase o React.

Formato: JavaScript moderno con componentes funcionales, Server Components y Client Components separados por necesidad.

Lint: existe script `npm run lint`, pero no se observa configuración adicional en este workspace.

Tests: no se detectan tests automatizados en el repositorio actual.

Commits: no hay convención visible en el workspace.

Branches: no hay convención visible en el workspace.

---

# Riesgos conocidos

Problemas conocidos: gran parte de la seguridad depende de que las políticas RLS en Supabase estén correctas y completas.

Limitaciones: la web pública está servida como HTML estático existente, así que cualquier cambio funcional en ese front requiere tratar ese asset con cuidado.

Deuda técnica: hay lógica de negocio importante distribuida entre páginas, formularios y utilidades locales; si no se mantiene alineada, pueden aparecer diferencias entre cálculos del dashboard, reportes y formularios.

Riesgo arquitectónico: varios módulos escriben directo desde el navegador con la anon key. Eso es válido solo si RLS, roles y permisos están cerrados al detalle.

Riesgo de rendimiento: el dashboard y reportes hacen consultas agregadas y lecturas amplias sobre tablas operativas; en crecimiento de datos, esas vistas pueden empezar a sentirse pesadas si no se optimizan índices y límites.

Riesgo de consistencia: hay múltiples rutas para el mismo dominio de negocio, por ejemplo ventas, bar, pool fútbol y reportes, y todas dependen de que las categorías y fórmulas se mantengan consistentes.

---

# Detalles adicionales

## Patrón de autenticación y seguridad

La protección de `/admin` se implementa en dos capas: middleware en la entrada de la ruta y verificación adicional en el layout del panel. Además, el login usa Supabase Auth en el navegador y refresca la navegación al dashboard.

La base de datos usa RLS por rol. Según los SQL del proyecto, existen roles de negocio como `dueno`, `gerente`, `empleado` y `contador`, con permisos diferenciados para lectura, escritura y borrado.

## Módulos principales detectados

- Dashboard
- Login de administración
- Reservas
- Cumpleaños
- Caja diaria
- Ventas
- PoolFútbol
- Consolas
- Gastos
- Clientes
- Stock
- Calendario
- Reportes
- Bar
- Formularios de alta/edición y botones de acciones rápidas

## Entidades y tablas más relevantes

- `profiles`
- `clients`
- `reservations`
- `birthday_reservations`
- `sales`
- `sale_items`
- `cash_movements`
- `cash_closures`
- `expenses`
- `products`
- `stock_movements`
- `consoles`
- `console_sessions`
- `poolfootball_sessions`
- `walkin_orders`
- `combos`
- `referral_codes`
- `web_leads`
- `web_events`
- `birthday_guests`
- `activity_logs`

## Observación funcional

El proyecto no separa backend y frontend como aplicaciones distintas. La separación es por capas dentro de Next.js y por responsabilidad de archivos: UI de panel, utilidades de negocio, cliente/servidor de Supabase y SQL por pasos para la base de datos.
