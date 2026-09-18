import { supabase } from '@/lib/supabase';
import type { Project } from '@/types';

import { PROJECT_COLUMNS } from './columns';
import { RemoteError, remoteMessage } from './errors';
import { projectFromRow, projectToRow, type ProyectoRow } from './mappers';

export async function listProjects() {
  const { data, error } = await supabase
    .from('proyectos')
    .select(PROJECT_COLUMNS)
    .order('actualizado_en', { ascending: false });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los proyectos.'), error);
  return ((data ?? []) as ProyectoRow[]).map(projectFromRow);
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
