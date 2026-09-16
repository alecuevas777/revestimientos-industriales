-- =============================================================================
-- Revestimientos Industriales — esquema inicial (nombres en español)
-- Pegar completo en: Supabase → SQL Editor → Run
--
-- Si ya corriste la versión en inglés, este script borra esas tablas
-- (estaban vacías) y crea las nuevas.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Quitar schema anterior en inglés (si existía)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.set_updated_at();

drop table if exists public.survey_photos cascade;
drop table if exists public.survey_elements cascade;
drop table if exists public.survey_sectors cascade;
drop table if exists public.surveys cascade;
drop table if exists public.projects cascade;
drop table if exists public.clients cascade;
drop table if exists public.profiles cascade;

drop table if exists public.fotos cascade;
drop table if exists public.elementos cascade;
drop table if exists public.sectores cascade;
drop table if exists public.levantamientos cascade;
drop table if exists public.proyectos cascade;
drop table if exists public.clientes cascade;
drop table if exists public.perfiles cascade;

drop function if exists public.al_crear_usuario();
drop function if exists public.set_actualizado_en();
drop function if exists public.perfiles_proteger_campos();

-- -----------------------------------------------------------------------------
-- Utilidad: actualizado_en
-- -----------------------------------------------------------------------------
create or replace function public.set_actualizado_en()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- El rol vive aquí, no en user_metadata (ese campo lo puede editar el usuario).
-- -----------------------------------------------------------------------------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text,
  rol text not null default 'tecnico'
    check (rol in ('tecnico', 'supervisor', 'admin')),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index perfiles_rol_idx on public.perfiles (rol);
create index perfiles_activo_idx on public.perfiles (activo);

create trigger perfiles_set_actualizado_en
before update on public.perfiles
for each row execute function public.set_actualizado_en();

create or replace function public.perfiles_proteger_campos()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    new.rol := old.rol;
    new.activo := old.activo;
  end if;
  return new;
end;
$$;

create trigger perfiles_proteger_campos
before update on public.perfiles
for each row execute function public.perfiles_proteger_campos();

create or replace function public.al_crear_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, email, rol, activo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Técnico'),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'tecnico'),
    true
  );
  return new;
end;
$$;

revoke all on function public.al_crear_usuario() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.al_crear_usuario();

-- -----------------------------------------------------------------------------
-- Clientes (catálogo compartido del equipo en fase 1)
-- -----------------------------------------------------------------------------
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid not null references auth.users (id),
  nombre text not null,
  rut text,
  nombre_contacto text,
  cargo_contacto text,
  telefono text,
  email text,
  direccion text,
  ciudad text,
  observaciones text,
  archivado boolean not null default false,
  archivado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index clientes_creado_por_idx on public.clientes (creado_por);
create index clientes_archivado_idx on public.clientes (archivado);
create index clientes_nombre_idx on public.clientes (nombre);

create trigger clientes_set_actualizado_en
before update on public.clientes
for each row execute function public.set_actualizado_en();

-- -----------------------------------------------------------------------------
-- Proyectos / recintos
-- -----------------------------------------------------------------------------
create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id),
  creado_por uuid not null references auth.users (id),
  nombre text not null,
  codigo text,
  direccion text,
  ciudad text,
  ubicacion text,
  contacto_terreno text,
  telefono_terreno text,
  descripcion text,
  observaciones text,
  estado text not null default 'active'
    check (estado in ('active', 'pending', 'finished')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index proyectos_cliente_id_idx on public.proyectos (cliente_id);
create index proyectos_creado_por_idx on public.proyectos (creado_por);
create index proyectos_estado_idx on public.proyectos (estado);

create trigger proyectos_set_actualizado_en
before update on public.proyectos
for each row execute function public.set_actualizado_en();

-- -----------------------------------------------------------------------------
-- Levantamientos
-- datos_servicio: JSON del tipo de servicio (epóxico, PU, cubierta, corrosión)
-- Los códigos de catálogo (epoxy, draft, good…) se mantienen en inglés
-- porque coinciden con la app.
-- -----------------------------------------------------------------------------
create table public.levantamientos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  proyecto_id uuid not null references public.proyectos (id),
  usuario_id uuid not null references auth.users (id),
  tipo_servicio text not null
    check (tipo_servicio in ('epoxy', 'pu_cement', 'roof_waterproofing', 'corrosion_control')),
  estado text not null default 'draft'
    check (estado in ('draft', 'completed')),
  alcance text
    check (alcance is null or alcance in ('complete', 'sectors', 'critical_points')),
  estado_general text
    check (estado_general is null or estado_general in ('good', 'regular', 'bad', 'critical')),
  motivo_visita text,
  observaciones_generales text,
  conclusion text,
  planta_operativa text
    check (planta_operativa is null or planta_operativa in ('yes', 'no')),
  restricciones_horario text
    check (restricciones_horario is null or restricciones_horario in ('yes', 'no')),
  notas_acceso text,
  maquinaria_retirar text
    check (maquinaria_retirar is null or maquinaria_retirar in ('yes', 'no')),
  comentarios_faena text,
  datos_servicio jsonb not null default '{}'::jsonb,
  iniciado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  finalizado_en timestamptz
);

create index levantamientos_proyecto_id_idx on public.levantamientos (proyecto_id);
create index levantamientos_usuario_id_idx on public.levantamientos (usuario_id);
create index levantamientos_estado_idx on public.levantamientos (estado);
create index levantamientos_tipo_servicio_idx on public.levantamientos (tipo_servicio);
create index levantamientos_actualizado_en_idx on public.levantamientos (actualizado_en desc);

create trigger levantamientos_set_actualizado_en
before update on public.levantamientos
for each row execute function public.set_actualizado_en();

-- -----------------------------------------------------------------------------
-- Sectores / puntos críticos
-- -----------------------------------------------------------------------------
create table public.sectores (
  id uuid primary key default gen_random_uuid(),
  levantamiento_id uuid not null references public.levantamientos (id) on delete cascade,
  nombre text not null default '',
  area_aproximada numeric,
  condicion text not null default 'regular'
    check (condicion in ('good', 'regular', 'bad', 'critical')),
  criticidad text not null default 'medium'
    check (criticidad in ('low', 'medium', 'high', 'critical')),
  problemas text[] not null default '{}',
  otro_problema text,
  usos text[] not null default '{}',
  otro_uso text,
  nivel_trafico text
    check (nivel_trafico is null or nivel_trafico in ('low', 'medium', 'high')),
  exposiciones text[] not null default '{}',
  observaciones text,
  recomendacion text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index sectores_levantamiento_id_idx on public.sectores (levantamiento_id);

create trigger sectores_set_actualizado_en
before update on public.sectores
for each row execute function public.set_actualizado_en();

-- -----------------------------------------------------------------------------
-- Elementos (pilar, canaleta, sello, etc.)
-- -----------------------------------------------------------------------------
create table public.elementos (
  id uuid primary key default gen_random_uuid(),
  levantamiento_id uuid not null references public.levantamientos (id) on delete cascade,
  sector_id uuid not null references public.sectores (id) on delete cascade,
  tipo_elemento text not null,
  referencia text,
  material text,
  condicion text not null default 'regular'
    check (condicion in ('good', 'regular', 'bad', 'critical')),
  nivel_corrosion text
    check (
      nivel_corrosion is null
      or nivel_corrosion in ('none', 'slight', 'moderate', 'severe', 'undetermined')
    ),
  problemas text[] not null default '{}',
  otro_problema text,
  exposiciones text[] not null default '{}',
  observaciones text,
  criticidad text not null default 'medium'
    check (criticidad in ('low', 'medium', 'high', 'critical')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index elementos_levantamiento_id_idx on public.elementos (levantamiento_id);
create index elementos_sector_id_idx on public.elementos (sector_id);

create trigger elementos_set_actualizado_en
before update on public.elementos
for each row execute function public.set_actualizado_en();

-- -----------------------------------------------------------------------------
-- Fotos de evidencia (ruta_storage = bucket, más adelante)
-- -----------------------------------------------------------------------------
create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  levantamiento_id uuid not null references public.levantamientos (id) on delete cascade,
  sector_id uuid references public.sectores (id) on delete cascade,
  elemento_id uuid references public.elementos (id) on delete cascade,
  ruta_storage text,
  uri_local text,
  categoria text default 'overview',
  leyenda text,
  creado_en timestamptz not null default now()
);

create index fotos_levantamiento_id_idx on public.fotos (levantamiento_id);
create index fotos_sector_id_idx on public.fotos (sector_id);
create index fotos_elemento_id_idx on public.fotos (elemento_id);

-- -----------------------------------------------------------------------------
-- Permisos Data API
-- -----------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.perfiles to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.proyectos to authenticated;
grant select, insert, update, delete on public.levantamientos to authenticated;
grant select, insert, update, delete on public.sectores to authenticated;
grant select, insert, update, delete on public.elementos to authenticated;
grant select, insert, update, delete on public.fotos to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.perfiles enable row level security;
alter table public.clientes enable row level security;
alter table public.proyectos enable row level security;
alter table public.levantamientos enable row level security;
alter table public.sectores enable row level security;
alter table public.elementos enable row level security;
alter table public.fotos enable row level security;

alter table public.perfiles force row level security;
alter table public.clientes force row level security;
alter table public.proyectos force row level security;
alter table public.levantamientos force row level security;
alter table public.sectores force row level security;
alter table public.elementos force row level security;
alter table public.fotos force row level security;

-- Perfil: cada uno ve y edita el suyo
create policy perfiles_select_propio
on public.perfiles for select to authenticated
using (id = (select auth.uid()));

create policy perfiles_update_propio
on public.perfiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Clientes / proyectos: catálogo compartido del equipo (fase 1).
-- Inserta con creado_por = usuario actual. No hay DELETE: se archiva.
create policy clientes_select_equipo
on public.clientes for select to authenticated
using (true);

create policy clientes_insert_propio
on public.clientes for insert to authenticated
with check (creado_por = (select auth.uid()));

create policy clientes_update_equipo
on public.clientes for update to authenticated
using (true)
with check (true);

create policy proyectos_select_equipo
on public.proyectos for select to authenticated
using (true);

create policy proyectos_insert_propio
on public.proyectos for insert to authenticated
with check (creado_por = (select auth.uid()));

create policy proyectos_update_equipo
on public.proyectos for update to authenticated
using (true)
with check (true);

-- Levantamientos: solo el técnico dueño
create policy levantamientos_select_propio
on public.levantamientos for select to authenticated
using (usuario_id = (select auth.uid()));

create policy levantamientos_insert_propio
on public.levantamientos for insert to authenticated
with check (usuario_id = (select auth.uid()));

create policy levantamientos_update_propio
on public.levantamientos for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()));

create policy levantamientos_delete_propio
on public.levantamientos for delete to authenticated
using (usuario_id = (select auth.uid()));

-- Hijos: existen si el levantamiento es del usuario
create policy sectores_todo_propio
on public.sectores for all to authenticated
using (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.usuario_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.usuario_id = (select auth.uid())
  )
);

create policy elementos_todo_propio
on public.elementos for all to authenticated
using (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.usuario_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.usuario_id = (select auth.uid())
  )
);

create policy fotos_todo_propio
on public.fotos for all to authenticated
using (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.usuario_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.usuario_id = (select auth.uid())
  )
);

-- -----------------------------------------------------------------------------
-- Storage: bucket privado de fotos
-- Ruta: fotos/{auth.uid()}/{levantamiento_id}/{archivo}
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos',
  'fotos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists fotos_storage_select on storage.objects;
drop policy if exists fotos_storage_insert on storage.objects;
drop policy if exists fotos_storage_update on storage.objects;
drop policy if exists fotos_storage_delete on storage.objects;

create policy fotos_storage_select
on storage.objects for select to authenticated
using (
  bucket_id = 'fotos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy fotos_storage_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'fotos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy fotos_storage_update
on storage.objects for update to authenticated
using (
  bucket_id = 'fotos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'fotos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy fotos_storage_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'fotos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
