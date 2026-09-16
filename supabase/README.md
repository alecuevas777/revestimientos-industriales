# Backend Supabase — fase 1

## Cómo aplicar el schema

1. Abre el proyecto en [Supabase](https://supabase.com/dashboard).
2. Menú **SQL Editor** → **New query**.
3. Abre `schema.sql` de esta carpeta, copia **todo** y pégalo.
4. Pulsa **Run**.
5. En **Table Editor** deberías ver: `profiles`, `clients`, `projects`, `surveys`, `survey_sectors`, `survey_elements`, `survey_photos`.

El diagrama está en `modelo-datos.pdf`.

## Qué hace el SQL

- Crea las tablas del dominio (cliente → proyecto → levantamiento → sector → elemento → foto).
- Activa RLS: el técnico solo ve **sus** levantamientos; clientes y proyectos son catálogo del equipo.
- Crea un perfil en `profiles` cada vez que se registra un usuario en Auth.

Todavía no hay Auth en la app ni sync. Eso es el siguiente paso, después de correr este SQL.
