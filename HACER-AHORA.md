# HACER AHORA — Proyecto limpio + todo vinculado (≈10 min)

El código (frontend + backend) ya está 100% listo. Solo falta crear el proyecto Supabase
limpio y pegar 2 datos. Seguí esto tal cual.

---

## 1) Crear el proyecto nuevo (2 min)

- En Supabase, arriba a la izquierda donde dice **neuraxAI** → **New project**.
- Name: `La Chispa Gamer`
- Database Password: tocá **Generate a password** (no hace falta que la recuerdes ahora).
- Region: la más cercana (South America / Brazil).
- **Create new project**. Esperá a que termine de crearse (~1-2 min).

## 2) Apagar la confirmación de email (30 seg)

- Menú izquierdo → **Authentication** → **Sign In / Providers** (o "Providers") → **Email**.
- Desactivá **Confirm email** (queda en OFF). **Save**.

## 3) Copiar las 2 claves al proyecto (1 min)

- Menú izquierdo → **Project Settings** (engranaje) → **API Keys**.
- Copiá:
  - **Project URL** (arriba, en "Data API" / "Project URL").  → si no lo ves ahí, está en
    Settings → **Data API** → "Project URL".
  - La **Publishable key** (`sb_publishable_...`).
- Abrí `.env.local` en VS Code y reemplazá las DOS líneas (ver abajo). Guardá (Ctrl+S).

```
NEXT_PUBLIC_SUPABASE_URL=https://NUEVO-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_NUEVA_CLAVE
```

## 4) Crear las tablas (1 min)

- Menú izquierdo → **SQL Editor** → **New query**.
- Abrí `db/paso-3-schema.sql` en VS Code, **copiá TODO**, pegalo y **Run** (Ctrl+Enter).
- Tiene que decir *Success*. (Ahora SIN tablas del gimnasio: proyecto limpio.)

## 5) Crear tu usuario (1 min)

- Menú izquierdo → **Authentication** → **Users** → **Add user** → **Create new user**.
- Email + contraseña del dueño.
- ✅ Marcá **Auto Confirm User** → **Create user**.
- (Ese usuario queda como **dueño** automáticamente.)

## 6) Reiniciar y probar (1 min)

En PowerShell (en la carpeta del proyecto):

```powershell
# Si está corriendo, cortalo con Ctrl+C, y después:
npm run dev
```

- `http://localhost:3000/` → web pública (la de tu colega).
- `http://localhost:3000/admin` → login → entrás con tu usuario → **Dashboard con KPIs**.
- Probá: **Clientes → Agregar** un cliente. Aparece en la lista. ✅
- Igual en **Gastos** y **Reservas**.

---

## Después (opcional, 1 min) — limpiar el proyecto del gimnasio

En el proyecto VIEJO (el del gimnasio) → SQL Editor → pegá y corré
`db/limpiar-proyecto-gimnasio.sql`. Saca nuestras tablas de ahí y deja el gym intacto.

---

### Si el login falla, decime el texto exacto del error (ahora lo muestra completo) y lo cierro al toque.
