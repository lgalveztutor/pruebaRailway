# Paso 2 — Conectar Supabase (login real + protección de rutas)

El código ya está listo. Solo faltan **3 cosas tuyas** en Supabase. 5 minutos.

## 1) Copiar tus claves al proyecto

En Supabase → tu proyecto → **Project Settings → API**. Copiá:

- **Project URL** → va en `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Abrí el archivo **`.env.local`** (ya está en la carpeta del proyecto) y pegá los dos valores.
No uses comillas. Quedaría así:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## 2) Crear el primer usuario (el dueño)

En Supabase → **Authentication → Users → Add user → Create new user**:

- Email: el del dueño (ej. `dueno@lachispagamer.com`)
- Password: una contraseña
- ✅ Marcá **"Auto Confirm User"** (así puede entrar sin verificar mail)

Click en **Create user**.

> Más adelante (Paso 3) agregamos roles (dueño, gerente, empleado, contador).
> Por ahora cualquier usuario creado acá puede entrar al panel.

## 3) Reiniciar el servidor y probar

En PowerShell, dentro de la carpeta del proyecto:

```powershell
cd "C:\Users\BAITER\Desktop\Local Gamer\lachispagamer"
npm run dev
```

(Si ya estaba corriendo, cortalo con Ctrl+C y volvé a `npm run dev` para que tome el `.env.local`.)

Probá:

- `http://localhost:3000/` → la web pública (igual que siempre).
- `http://localhost:3000/admin` → ahora te manda a **/admin/login**.
- Ingresá con el email y contraseña que creaste → entrás al **Dashboard**.
- Si entrás a `/admin/dashboard` sin estar logueado, te rebota al login. ✅
- Botón **Cerrar sesión** en el sidebar.

## ¿Cómo sé que la protección está activa?

- **Sin** las claves en `.env.local` → modo desarrollo: el panel se ve sin login (para trabajarlo).
- **Con** las claves cargadas → el login es obligatorio y las rutas `/admin` quedan protegidas
  por partida doble (middleware + chequeo en el servidor).

---

Cuando esto te funcione, seguimos con el **Paso 3: base de datos** (tablas, roles y reglas de seguridad RLS).
