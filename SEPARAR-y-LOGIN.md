# Separar del gimnasio + arreglar el login

## Por qué están mezclados

Usaste el **mismo proyecto Supabase** del gimnasio. Todas las tablas viven juntas en el
esquema `public`, por eso ves `gyms`, `members`, `routines`… al lado de las nuestras.
Además comparten los **usuarios de Auth**, que no querés mezclar (socios del gym vs. equipo del salón).

Sobre el "15 vs 16": son **15 tablas**. El plan original listaba `roles` y `reports` aparte;
los roles los metimos como columna en `profiles`, y los reportes se calculan con consultas
(no necesitan tabla). Está bien así.

## Solución: un proyecto Supabase propio para La Chispa Gamer (gratis)

5 minutos. Queda todo aislado.

1. En Supabase, arriba a la izquierda → **New project**.
   - Nombre: `La Chispa Gamer`
   - Elegí región cercana y una contraseña de base (guardala).
2. Cuando termine de crearse: **Project Settings → API**. Copiá:
   - **Project URL**
   - **anon / publishable key**
   Pegalas en `.env.local` (reemplazando las del proyecto del gimnasio).
3. **Authentication → Providers → Email**: desactivá **"Confirm email"** (así el login
   funciona sin verificar mail). Guardá.
4. **SQL Editor → New query**: pegá y corré `db/paso-3-schema.sql`.
5. **Authentication → Users → Add user**:
   - Email + contraseña del dueño.
   - ✅ Marcá **Auto Confirm User**.
   - Ese primer usuario queda como **dueño** automáticamente.
6. (Opcional, recomendado) En el proyecto **del gimnasio**, corré
   `db/limpiar-proyecto-gimnasio.sql` para sacar nuestras tablas de ahí y dejarlo limpio.

Reiniciá el server (`Ctrl+C` y `npm run dev`) para que tome el nuevo `.env.local`.

---

## Por qué te daba error el login

Lo más común: el usuario estaba **sin confirmar el email** (si no marcaste "Auto Confirm User"
y el proyecto pide confirmación). Con el paso 3 de arriba (desactivar "Confirm email" +
crear el usuario con Auto Confirm) se soluciona.

Para que veas el motivo exacto si vuelve a fallar, dejé el login mostrando el **mensaje real
de error** de Supabase (antes mostraba un texto genérico). Si reaparece, decime qué dice
y lo resolvemos al toque.

### Probar de nuevo

1. `http://localhost:3000/admin` → te lleva al login.
2. Email + contraseña del usuario que creaste (con Auto Confirm).
3. Entrás al Dashboard. ✅
