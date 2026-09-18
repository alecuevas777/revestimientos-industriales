import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ProjectCard } from '@/components/ProjectCard';
import { TabBrandHeader } from '@/components/TabBrandHeader';
import { Button } from '@/components/ui/Button';
import { CatalogList } from '@/components/ui/CatalogList';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchInput } from '@/components/ui/SearchInput';
import { useAppActions, useAppData } from '@/context/AppProvider';
import { indexById, lastSurveyAtByProjectId, surveyCountByProjectId } from '@/lib/selectors';
import type { Project, ProjectStatus } from '@/types';

type Filter = 'all' | ProjectStatus;

export default function ProjectsScreen() {
  const { clients, projects, surveys, refreshing } = useAppData();
  const { refreshWorkspace } = useAppActions();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Filter>('all');

  const clientsById = useMemo(() => indexById(clients), [clients]);
  const surveyCounts = useMemo(() => surveyCountByProjectId(surveys), [surveys]);
  const lastSurveyAt = useMemo(() => lastSurveyAtByProjectId(surveys), [surveys]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
      const client = clientsById.get(project.clientId);
      const matchesStatus = status === 'all' || project.status === status;
      const matchesQuery = [project.name, project.location, project.city, project.address, client?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
      return matchesStatus && matchesQuery;
    });
  }, [clientsById, projects, query, status]);

  return (
    <Screen scroll={false} padded={false}>
      <CatalogList
        data={filtered}
        extraData={`${status}:${query}:${surveys.length}`}
        keyExtractor={(project) => project.id}
        refreshing={refreshing}
        onRefresh={refreshWorkspace}
        header={
          <>
            <TabBrandHeader title="Proyectos" subtitle="Gestiona tus proyectos y sigue su progreso" />
            <View className="gap-3">
              <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar proyecto, cliente o ubicación" />
              <FilterChips
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Activos' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'finished', label: 'Finalizados' },
                ]}
              />
              <Button
                label="Nuevo proyecto"
                className="rounded-full"
                icon={<Plus size={18} color="#fff" />}
                onPress={() => router.push('/proyectos/nuevo')}
              />
            </View>
          </>
        }
        empty={
          <EmptyState
            title={query || status !== 'all' ? 'Sin resultados' : 'Aún no hay proyectos'}
            description={
              query || status !== 'all'
                ? 'Cambia el filtro o el texto de búsqueda.'
                : 'Crea un proyecto asociado a un cliente para registrar levantamientos.'
            }
            action={
              query || status !== 'all' ? undefined : (
                <Button
                  label="Nuevo proyecto"
                  className="rounded-full"
                  icon={<Plus size={18} color="#fff" />}
                  onPress={() => router.push('/proyectos/nuevo')}
                />
              )
            }
          />
        }
        renderItem={(project: Project) => (
          <ProjectCard
            project={project}
            clientName={clientsById.get(project.clientId)?.name ?? 'Cliente'}
            surveyCount={surveyCounts.get(project.id) ?? 0}
            lastSurveyAt={lastSurveyAt.get(project.id)}
          />
        )}
      />
    </Screen>
  );
}
