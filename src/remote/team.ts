import { supabase } from '@/lib/supabase';
import type { Survey } from '@/types';

import { listClientsByIds } from './clients';
import { RemoteError, remoteMessage } from './errors';
import { listProjectsByIds } from './projects';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  photoPath?: string;
  active: boolean;
};

type ProfileRow = {
  id: string;
  nombre: string | null;
  email: string | null;
  foto_path: string | null;
  activo: boolean | null;
};

function toMember(row: ProfileRow): TeamMember {
  return {
    id: row.id,
    name: row.nombre?.trim() || row.email?.split('@')[0] || 'Técnico',
    email: row.email ?? '',
    photoPath: row.foto_path?.trim() || undefined,
    active: row.activo !== false,
  };
}

export async function listTeamMembers() {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, email, foto_path, activo')
    .order('nombre', { ascending: true });
  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes('row-level security') || text.includes('permission denied')) {
      throw new RemoteError(
        'Falta aplicar en Supabase la migración de Equipo VICAST. SQL Editor → pega supabase/migrations/20260920223000_team_library.sql y Run.',
      );
    }
    throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los técnicos.'), error);
  }
  return ((data ?? []) as ProfileRow[]).map(toMember);
}

export async function getTeamMember(id: string) {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, email, foto_path, activo')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo cargar el técnico.'), error);
  return data ? toMember(data as ProfileRow) : null;
}

export async function loadCatalogForSurveys(surveys: Survey[]) {
  const projects = await listProjectsByIds(surveys.map((survey) => survey.projectId));
  const clients = await listClientsByIds(projects.map((project) => project.clientId));
  return { clients, projects };
}
