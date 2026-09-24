# VICAST · Levantamientos

Aplicación móvil para registrar, finalizar y compartir levantamientos de superficies industriales. Cada técnico trabaja con su propio catálogo de clientes y recintos; los informes finalizados se consultan y descargan en **Equipo VICAST**.

Sitio: [vicast.cl](https://vicast.cl)

---

## Qué hace

- Cuentas de técnico (correo y contraseña). Recuperación con código de 8 dígitos.
- Clientes y recintos **privados** del usuario que los crea.
- Levantamientos por tipo de servicio: epóxico, poliuretano cemento, cubiertas y control de corrosión.
- Wizard en terreno: información, condiciones, sectores, evidencia, observaciones y revisión.
- Fotografías desde cámara o galería, comprimidas y sincronizadas a Storage.
- Informe **PDF** e **Excel** (con fotos) para compartir desde el teléfono.
- Equipo VICAST: lectura y descarga de levantamientos **finalizados** de otros técnicos, sin copiarles el cliente.
- Uso **sin conexión**: el trabajo queda en el dispositivo y se sube al volver la red.

Fuera de este repositorio: Play Store, panel web y roles supervisor/admin.

---

## Stack

| Capa | Tecnología |
| --- | --- |
| App | Expo 57, React Native, TypeScript, Expo Router, NativeWind |
| Backend | Supabase (Auth, Postgres, Storage, RLS) |
| Informes | `expo-print` (PDF) y OOXML con JSZip (Excel) |
| Entrega Android | EAS Build, APK interno (`cl.vicast.levantamientos`) |

Arquitectura **local-first**: cache por usuario (`@ri/workspace/{userId}`), sincronización al haber sesión y red.

---

## Requisitos

- Node.js 20 o superior
- npm
- Cuenta [Expo](https://expo.dev) para generar el APK
- Proyecto [Supabase](https://supabase.com) (Auth + Postgres + bucket privado `fotos`)

---

## Configuración local

```bash
git clone <url-del-repo>
cd revestimientos-industriales
npm install
cp .env.example .env
```

En `.env` (no se versiona):

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

Usa la clave **anon / publishable**. Nunca la `service_role`.

```bash
npx expo start --clear
```

---

## Base de datos

| Situación | Qué correr |
| --- | --- |
| Proyecto **vacío** | `supabase/schema.sql` (una sola vez) |
| Proyecto **con datos** | Solo las migraciones que falten en `supabase/migrations/` |

**No ejecutes `schema.sql` sobre un proyecto con información real.** Ese script elimina tablas y las vuelve a crear.

Migraciones relevantes para un proyecto ya en uso:

1. `20260920223000_team_library.sql` — Equipo VICAST (finalizados visibles al equipo)
2. `20260921153000_catalog_owner.sql` — clientes y recintos solo del técnico que los creó

Detalle operativo: [`supabase/README.md`](supabase/README.md) y [`docs/guia-entrega-cliente.html`](docs/guia-entrega-cliente.html).

---

## Scripts

```bash
npm start          # Expo
npm run typecheck  # TypeScript
npm run android    # abrir en Android
npm run ios        # abrir en iOS
```

---

## APK de producción (interno)

No se publica en Play Store. El perfil `production` de EAS genera un APK instalable.

```bash
npx eas-cli login
npx eas-cli build --platform android --profile production
```

La primera vez, genera un **keystore nuevo** en Expo (`Generate a new Android Keystore?` → yes). El build corre en la nube; al terminar se descarga el `.apk`.

Identificador: `cl.vicast.levantamientos` · versión de app: `1.0.0`

Las variables `EXPO_PUBLIC_*` se inyectan en el binario desde `eas.json` en el momento del build.

---

## Cuentas

Las cuentas se crean en la app (**Crear cuenta** en el login) o en **Supabase → Authentication → Users**. En `perfiles`, completar `nombre` (sale en el informe). Para dar de baja: `activo = false`.

---

## Documentación

| Archivo | Uso |
| --- | --- |
| [`docs/manual-uso-vicast.pdf`](docs/manual-uso-vicast.pdf) | Manual del técnico |
| [`docs/guia-entrega-cliente.html`](docs/guia-entrega-cliente.html) | Puesta en marcha (Supabase, Auth, backups) |
| [`supabase/schema.sql`](supabase/schema.sql) | Esquema completo (proyecto vacío) |
| [`supabase/migrations/`](supabase/migrations/) | Cambios incrementales |

---

## Estructura

```
src/
  app/            Rutas (Expo Router)
  components/     UI y formularios
  context/        Sesión y workspace
  features/       Pasos del levantamiento
  remote/         Cliente Supabase
  repositories/   Hidratación y persistencia local-first
  services/       PDF, Excel, cola de fotos
  lib/            Dominio, validación, informes
supabase/
  schema.sql
  migrations/
docs/
```

---

## Seguridad

- RLS: cada técnico lee y escribe su catálogo; el equipo solo **lee** levantamientos `completed` y la ficha asociada al informe.
- Storage: bucket `fotos` privado. Ruta `fotos/{userId}/{surveyId}/…`
- `.env` está en `.gitignore`.

---

## Licencia

El código de la aplicación es propiedad de VICAST. El archivo `LICENSE` del template de Expo no aplica al producto.
