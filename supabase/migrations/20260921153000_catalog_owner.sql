-- Clientes y recintos son del técnico que los creó.
-- Equipo VICAST solo lee ficha de un levantamiento FINALIZADO para el informe.
-- No asocia ese cliente al catálogo de otro usuario (no puede editarlo ni usarlo de nuevo).
-- Pegar en: Supabase → SQL Editor → Run

drop policy if exists clientes_select_equipo on public.clientes;
drop policy if exists clientes_update_equipo on public.clientes;
drop policy if exists clientes_delete_equipo on public.clientes;
drop policy if exists proyectos_select_equipo on public.proyectos;
drop policy if exists proyectos_update_equipo on public.proyectos;
drop policy if exists proyectos_delete_equipo on public.proyectos;

create policy clientes_select_propio
on public.clientes for select to authenticated
using (creado_por = (select auth.uid()));

create policy clientes_update_propio
on public.clientes for update to authenticated
using (creado_por = (select auth.uid()))
with check (creado_por = (select auth.uid()));

create policy clientes_delete_propio
on public.clientes for delete to authenticated
using (creado_por = (select auth.uid()));

create policy proyectos_select_propio
on public.proyectos for select to authenticated
using (creado_por = (select auth.uid()));

create policy proyectos_update_propio
on public.proyectos for update to authenticated
using (creado_por = (select auth.uid()))
with check (creado_por = (select auth.uid()));

create policy proyectos_delete_propio
on public.proyectos for delete to authenticated
using (creado_por = (select auth.uid()));

-- Lectura de informe: ficha del recinto/cliente de un levantamiento ya finalizado.
create policy clientes_select_informe_equipo
on public.clientes for select to authenticated
using (
  exists (
    select 1
    from public.proyectos p
    join public.levantamientos l on l.proyecto_id = p.id
    where p.cliente_id = clientes.id
      and l.estado = 'completed'
  )
);

create policy proyectos_select_informe_equipo
on public.proyectos for select to authenticated
using (
  exists (
    select 1
    from public.levantamientos l
    where l.proyecto_id = proyectos.id
      and l.estado = 'completed'
  )
);
