# Backend Supabase — fase 1

## Cómo aplicar el schema

1. Abre el proyecto en [Supabase](https://supabase.com/dashboard).
2. Menú **SQL Editor** → **New query**.
3. Abre `schema.sql` de esta carpeta, copia **todo** y pégalo.
4. Pulsa **Run**.
5. En **Table Editor** deberías ver: `perfiles`, `clientes`, `proyectos`, `levantamientos`, `sectores`, `elementos`, `fotos`.
6. En **Storage** debe existir el bucket privado `fotos`.

Si ya habías corrido la versión en inglés, este script la borra (tablas vacías) y crea las tablas en español.

El diagrama está en `modelo-datos.pdf`.

## Tablas

| Tabla | Qué guarda |
|---|---|
| `perfiles` | Ficha del técnico (1:1 con Auth). Nombre, email, teléfono y `foto_path`. |
| `clientes` | Ficha comercial (catálogo del equipo) |
| `proyectos` | Recintos, ligados a un cliente |
| `levantamientos` | Inspección del técnico dueño (código LEV-…) |
| `sectores` | Zonas o puntos críticos |
| `elementos` | Pilar, canaleta, sello, etc. |
| `fotos` | Evidencia (`ruta_storage` en el bucket `fotos`) |

Los valores de catálogo (`epoxy`, `draft`, `good`…) siguen en inglés: son los mismos códigos que usa la app.

## Sync en la app

La app es **local-first**: guarda en el dispositivo y escribe en Supabase cuando hay sesión y red.

- IDs: UUID, iguales en la app y en Postgres.
- Clientes y proyectos: visibles para el equipo (RLS de catálogo).
- Levantamientos: solo el técnico dueño.
- Fotos de evidencia: `fotos/{userId}/{surveyId}/{photoId}.jpg`.
- Foto de perfil: `fotos/{userId}/perfil/avatar.jpg`.
- Sin red: el trabajo queda en cache por usuario (`@ri/workspace/{userId}`) y se sube al volver a entrar.
- Cerrar sesión no borra esa cache.

El seed demo ya no se carga al iniciar sesión.
