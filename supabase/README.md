# Backend Supabase — fase 1

## Cómo aplicar el schema

1. Abre el proyecto en [Supabase](https://supabase.com/dashboard).
2. Menú **SQL Editor** → **New query**.
3. Abre `schema.sql` de esta carpeta, copia **todo** y pégalo.
4. Pulsa **Run**.
5. En **Table Editor** deberías ver: `perfiles`, `clientes`, `proyectos`, `levantamientos`, `sectores`, `elementos`, `fotos`.

Si ya habías corrido la versión en inglés, este script la borra (tablas vacías) y crea las tablas en español.

El diagrama está en `modelo-datos.pdf`.

## Tablas

| Tabla | Qué guarda |
|---|---|
| `perfiles` | Ficha del técnico (1:1 con Auth) |
| `clientes` | Ficha comercial |
| `proyectos` | Recintos, ligados a un cliente |
| `levantamientos` | Inspección (código LEV-…) |
| `sectores` | Zonas o puntos críticos |
| `elementos` | Pilar, canaleta, sello, etc. |
| `fotos` | Evidencia (ruta en Storage más adelante) |

Los valores de catálogo (`epoxy`, `draft`, `good`…) siguen en inglés: son los mismos códigos que usa la app.

Todavía no hay Auth en la app ni sync. Eso es el siguiente paso, después de correr este SQL.
