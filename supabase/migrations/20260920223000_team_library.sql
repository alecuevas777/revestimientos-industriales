-- Equipo VICAST: los técnicos ven finalizados del resto y pueden descargar el informe.
-- No cambia alta/edición/borrado: cada uno sigue siendo dueño de lo suyo.
-- Pegar en: Supabase → SQL Editor → Run

-- Perfiles: el equipo puede ver nombres y fotos (el teléfono también queda visible).
drop policy if exists perfiles_select_equipo on public.perfiles;
create policy perfiles_select_equipo
on public.perfiles for select to authenticated
using (true);

-- Levantamientos finalizados visibles para cualquier técnico autenticado.
drop policy if exists levantamientos_select_equipo on public.levantamientos;
create policy levantamientos_select_equipo
on public.levantamientos for select to authenticated
using (estado = 'completed');

drop policy if exists sectores_select_equipo on public.sectores;
create policy sectores_select_equipo
on public.sectores for select to authenticated
using (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.estado = 'completed'
  )
);

drop policy if exists elementos_select_equipo on public.elementos;
create policy elementos_select_equipo
on public.elementos for select to authenticated
using (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.estado = 'completed'
  )
);

drop policy if exists fotos_select_equipo on public.fotos;
create policy fotos_select_equipo
on public.fotos for select to authenticated
using (
  exists (
    select 1 from public.levantamientos l
    where l.id = levantamiento_id and l.estado = 'completed'
  )
);

-- Fotos en Storage: lectura de equipo; subida/borrado siguen en la carpeta del dueño.
drop policy if exists fotos_storage_select_equipo on storage.objects;
create policy fotos_storage_select_equipo
on storage.objects for select to authenticated
using (bucket_id = 'fotos');
