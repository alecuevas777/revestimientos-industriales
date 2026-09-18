create policy clientes_delete_equipo
on public.clientes for delete to authenticated
using (true);

create policy proyectos_delete_equipo
on public.proyectos for delete to authenticated
using (true);
