-- =============================================================================
-- Revestimientos Industriales — esquema inicial
-- Pegar completo en: Supabase → SQL Editor → Run
-- Proyecto vacío. Ejecutar una sola vez.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Utilidad: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- El rol vive en profiles, no en user_metadata (ese campo lo puede editar el usuario).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'tecnico'
    check (role in ('tecnico', 'supervisor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Técnico'),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'tecnico')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Clientes (catálogo compartido del equipo en fase 1)
-- -----------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id),
  name text not null,
  rut text,
  contact_name text,
  contact_role text,
  phone text,
  email text,
  address text,
  city text,
  observations text,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_created_by_idx on public.clients (created_by);
create index if not exists clients_archived_idx on public.clients (archived);
create index if not exists clients_name_idx on public.clients (name);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Proyectos / recintos
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id),
  created_by uuid not null references auth.users (id),
  name text not null,
  code text,
  address text,
  city text,
  location text,
  site_contact_name text,
  site_contact_phone text,
  description text,
  observations text,
  status text not null default 'active'
    check (status in ('active', 'pending', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists projects_created_by_idx on public.projects (created_by);
create index if not exists projects_status_idx on public.projects (status);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Levantamientos
-- service_data: JSON del tipo de servicio (epóxico, PU, cubierta, corrosión)
-- -----------------------------------------------------------------------------
create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  project_id uuid not null references public.projects (id),
  user_id uuid not null references auth.users (id),
  service_type text not null
    check (service_type in ('epoxy', 'pu_cement', 'roof_waterproofing', 'corrosion_control')),
  status text not null default 'draft'
    check (status in ('draft', 'completed')),
  scope text
    check (scope is null or scope in ('complete', 'sectors', 'critical_points')),
  overall_condition text
    check (overall_condition is null or overall_condition in ('good', 'regular', 'bad', 'critical')),
  visit_reason text,
  general_observations text,
  conclusion text,
  plant_operational text
    check (plant_operational is null or plant_operational in ('yes', 'no')),
  schedule_restrictions text
    check (schedule_restrictions is null or schedule_restrictions in ('yes', 'no')),
  access_notes text,
  machinery_to_remove text
    check (machinery_to_remove is null or machinery_to_remove in ('yes', 'no')),
  site_comments text,
  service_data jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists surveys_project_id_idx on public.surveys (project_id);
create index if not exists surveys_user_id_idx on public.surveys (user_id);
create index if not exists surveys_status_idx on public.surveys (status);
create index if not exists surveys_service_type_idx on public.surveys (service_type);
create index if not exists surveys_updated_at_idx on public.surveys (updated_at desc);

drop trigger if exists surveys_set_updated_at on public.surveys;
create trigger surveys_set_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sectores / puntos críticos
-- -----------------------------------------------------------------------------
create table if not exists public.survey_sectors (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  name text not null default '',
  approximate_area numeric,
  condition text not null default 'regular'
    check (condition in ('good', 'regular', 'bad', 'critical')),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  problems text[] not null default '{}',
  other_problem text,
  uses text[] not null default '{}',
  other_use text,
  traffic_level text
    check (traffic_level is null or traffic_level in ('low', 'medium', 'high')),
  exposures text[] not null default '{}',
  observations text,
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists survey_sectors_survey_id_idx on public.survey_sectors (survey_id);

drop trigger if exists survey_sectors_set_updated_at on public.survey_sectors;
create trigger survey_sectors_set_updated_at
before update on public.survey_sectors
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Elementos (pilar, canaleta, sello, etc.)
-- -----------------------------------------------------------------------------
create table if not exists public.survey_elements (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  sector_id uuid not null references public.survey_sectors (id) on delete cascade,
  element_type text not null,
  reference text,
  material text,
  condition text not null default 'regular'
    check (condition in ('good', 'regular', 'bad', 'critical')),
  corrosion_level text
    check (
      corrosion_level is null
      or corrosion_level in ('none', 'slight', 'moderate', 'severe', 'undetermined')
    ),
  problems text[] not null default '{}',
  other_problem text,
  exposures text[] not null default '{}',
  observations text,
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists survey_elements_survey_id_idx on public.survey_elements (survey_id);
create index if not exists survey_elements_sector_id_idx on public.survey_elements (sector_id);

drop trigger if exists survey_elements_set_updated_at on public.survey_elements;
create trigger survey_elements_set_updated_at
before update on public.survey_elements
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Fotos de evidencia (storage_path = ruta en el bucket, más adelante)
-- -----------------------------------------------------------------------------
create table if not exists public.survey_photos (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  sector_id uuid references public.survey_sectors (id) on delete cascade,
  element_id uuid references public.survey_elements (id) on delete cascade,
  storage_path text,
  local_uri text,
  category text default 'overview',
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists survey_photos_survey_id_idx on public.survey_photos (survey_id);
create index if not exists survey_photos_sector_id_idx on public.survey_photos (sector_id);
create index if not exists survey_photos_element_id_idx on public.survey_photos (element_id);

-- -----------------------------------------------------------------------------
-- Permisos Data API
-- -----------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.surveys to authenticated;
grant select, insert, update, delete on public.survey_sectors to authenticated;
grant select, insert, update, delete on public.survey_elements to authenticated;
grant select, insert, update, delete on public.survey_photos to authenticated;

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_sectors enable row level security;
alter table public.survey_elements enable row level security;
alter table public.survey_photos enable row level security;

alter table public.profiles force row level security;
alter table public.clients force row level security;
alter table public.projects force row level security;
alter table public.surveys force row level security;
alter table public.survey_sectors force row level security;
alter table public.survey_elements force row level security;
alter table public.survey_photos force row level security;

-- Perfil: cada uno ve y edita el suyo
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Clientes / proyectos: catálogo compartido del equipo (fase 1).
-- Inserta con created_by = usuario actual. No hay DELETE: se archiva.
drop policy if exists clients_select_team on public.clients;
create policy clients_select_team
on public.clients for select to authenticated
using (true);

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own
on public.clients for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists clients_update_team on public.clients;
create policy clients_update_team
on public.clients for update to authenticated
using (true)
with check (true);

drop policy if exists projects_select_team on public.projects;
create policy projects_select_team
on public.projects for select to authenticated
using (true);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own
on public.projects for insert to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists projects_update_team on public.projects;
create policy projects_update_team
on public.projects for update to authenticated
using (true)
with check (true);

-- Levantamientos: solo el técnico dueño
drop policy if exists surveys_select_own on public.surveys;
create policy surveys_select_own
on public.surveys for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists surveys_insert_own on public.surveys;
create policy surveys_insert_own
on public.surveys for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists surveys_update_own on public.surveys;
create policy surveys_update_own
on public.surveys for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists surveys_delete_own on public.surveys;
create policy surveys_delete_own
on public.surveys for delete to authenticated
using (user_id = (select auth.uid()));

-- Hijos: existen si el survey es del usuario
drop policy if exists survey_sectors_all_own on public.survey_sectors;
create policy survey_sectors_all_own
on public.survey_sectors for all to authenticated
using (
  exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.user_id = (select auth.uid())
  )
);

drop policy if exists survey_elements_all_own on public.survey_elements;
create policy survey_elements_all_own
on public.survey_elements for all to authenticated
using (
  exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.user_id = (select auth.uid())
  )
);

drop policy if exists survey_photos_all_own on public.survey_photos;
create policy survey_photos_all_own
on public.survey_photos for all to authenticated
using (
  exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.surveys s
    where s.id = survey_id and s.user_id = (select auth.uid())
  )
);
