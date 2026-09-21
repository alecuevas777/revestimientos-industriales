import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

import { PROJECT_COLUMNS } from './columns';
import { RemoteError, remoteMessage } from './errors';
import { projectFromRow, projectToRow, type ProyectoRow } from './mappers';

function chunk<T>(items: T[], size = 100) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export async function listProjects(userId: string) {
  const { data, error } = await supabase
    .from('proyectos')
    .select(PROJECT_COLUMNS)
    .eq('creado_por', userId)
    .order('actualizado_en', { ascending: false });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los proyectos.'), error);
  return ((data ?? []) as ProyectoRow[]).map(projectFromRow);
}

export async function listProjectsByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const rows: ProyectoRow[] = [];
  for (const group of chunk(unique)) {
    const { data, error } = await supabase.from('proyectos').select(PROJECT_COLUMNS).in('id', group);
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los proyectos.'), error);
    rows.push(...((data ?? []) as ProyectoRow[]));
  }
  return rows.map(projectFromRow);
}

export async function upsertProject(project: Project, userId: string) {
  const row = projectToRow(project, userId);
  const { error } = await supabase.from('proyectos').upsert(row, { onConflict: 'id' });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo guardar el proyecto.'), error);
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase.from('proyectos').delete().eq('id', projectId);
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo eliminar el proyecto.'), error);
}
