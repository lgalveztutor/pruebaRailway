# La Chispa Gamer 1.8 — Web + Panel /admin

Un solo proyecto Next.js: la web pública en `/` y el panel de administración en `/admin`.
Un solo hosting (Vercel) y una sola base de datos (Supabase). Costo mínimo.

## 👀 Para el revisor — qué quiero que mires

Gracias por revisar. Es un sistema de gestión para un salón gamer (web pública + panel
`/admin`) sobre **Next.js + Supabase**. Me interesa tu punto de vista, sobre todo en:

1. **Seguridad de Supabase / RLS.** Todas las tablas usan Row Level Security (ver
   `db/paso-*.sql`). ¿Están bien las políticas? ¿Se puede filtrar o robar datos con la
   *anon key* pública? **Esto es lo más importante.**
2. **Errores / bugs** en formularios y cálculos (caja, ventas, descuentos por referido,
   finanzas del mes, stock).
3. **Rendimiento y buenas prácticas** de Next.js (server vs. client components, queries).
4. **Opinión general:** qué mejorarías o harías distinto.

> **Importante:** por ahora es **solo revisión**. No hace falta que modifiques el código.
> Dejá tus comentarios y sugerencias (Issues o comentarios en el código) y los vemos
> juntos antes de aplicar nada.

## Cómo correrlo (local)

```bash
cd lachispagamer
npm install
npm run dev
```

- Web pública: http://localhost:3000/
- Panel: http://localhost:3000/admin → redirige a `/admin/login`

> Sin Supabase configurado, el panel se ve igual en modo desarrollo (la protección
> se activa cuando cargás las variables en el Paso 2).

## Estructura

```
lachispagamer/
├── app/
│   ├── layout.jsx              # layout raíz
│   └── admin/
│       ├── layout.jsx          # tema del panel
│       ├── login/page.jsx      # login (Supabase Auth)
│       └── (panel)/            # zona con sidebar (grupo de rutas)
│           ├── layout.jsx      # sidebar + contenido
│           ├── dashboard/      # KPIs
│           ├── reservas/  caja/  ventas/  gastos/  clientes/
│           └── stock/  calendario/  reportes/
├── components/                 # formularios, charts, sidebar
├── lib/                        # supabase client/server, format, categorías, finanzas, descuento
├── db/                         # migraciones SQL (paso-3 … paso-14) que se corren en Supabase
├── middleware.js               # protege /admin (redirige a /admin/login sin sesión)
├── public/site/                # web pública estática (home.html + invitados.html)
└── next.config.js              # rewrite "/" -> /site/home.html
```

## Base de datos (Supabase)

El esquema y las políticas viven en `db/paso-*.sql`. Se corren **en orden** desde el SQL
Editor de Supabase (Postgres). Cada archivo agrega una parte: tablas, RLS, roles, sistema
de referidos/descuentos, listas de invitados, retención, etc. La seguridad se apoya en
**Row Level Security**: la web pública usa la *anon key* (solo puede insertar leads,
eventos e invitados), y el panel usa sesión autenticada.

## La web pública

Se sirve **tal cual el export actual** (`public/site/home.html` + `support.js`), así no
rompemos nada. El rewrite en `next.config.js` la muestra en `/`.
En el Paso 6 se mejora: responsive móvil, SEO, Open Graph, favicon y optimización de imágenes.

## Próximos pasos

- **Paso 2:** conectar Supabase (Auth + cliente) y activar la protección de `/admin`.
- **Paso 3:** base de datos (tablas + RLS + roles).
- **Paso 4:** dashboard básico con datos reales (KPIs, Caja, Ventas, Reservas, Gastos, Clientes).
- **Paso 5:** Cumpleaños, PoolFútbol, Consolas, Bar, Stock, Calendario, Reportes.
- **Paso 6:** IA (resúmenes/alertas) + arreglos de la web pública.

## Migrar a subdominio en el futuro

Hoy el panel vive en `lachispagamer.com/admin`. Para mover a `admin.lachispagamer.com`
no hace falta rehacer nada: se apunta el subdominio al mismo deploy y se ajusta el matcher
del `middleware.js`. El código ya está separado por zonas para soportarlo.
