-- =============================================================================
-- Seguridad: activo en perfiles + Storage privado
-- Pegar en: Supabase → SQL Editor → Run
-- No borra tablas ni datos existentes.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfiles: usuario activo / inactivo
-- -----------------------------------------------------------------------------
alter table public.perfiles
  add column if not exists activo boolean not null default true;

create index if not exists perfiles_activo_idx on public.perfiles (activo);

create or replace function public.perfiles_proteger_campos()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Desde la app (JWT) no se puede cambiar rol ni activo.
  -- El SQL Editor (rol postgres, sin auth.uid) sí puede.
  if auth.uid() is not null then
    new.rol := old.rol;
    new.activo := old.activo;
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_proteger_campos on public.perfiles;
create trigger perfiles_proteger_campos
before update on public.perfiles
for each row execute function public.perfiles_proteger_campos();

-- -----------------------------------------------------------------------------
-- Storage: bucket privado de fotos
-- Ruta esperada: fotos/{auth.uid()}/{levantamiento_id}/{archivo}
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
