import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ProjectCard } from '@/components/ProjectCard';
import { TabBrandHeader } from '@/components/TabBrandHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchInput } from '@/components/ui/SearchInput';
import { useApp } from '@/context/AppProvider';
import { lastProjectSurveyAt, surveysForProject } from '@/lib/selectors';
import type { ProjectStatus } from '@/types';

type Filter = 'all' | ProjectStatus;

export default function ProjectsScreen() {
  const { clients, projects, surveys } = useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects.filter((project) => {
      const client = clients.find((item) => item.id === project.clientId);
      const matchesStatus = status === 'all' || project.status === status;
      const matchesQuery = [project.name, project.location, project.city, project.address, client?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
      return matchesStatus && matchesQuery;
    });
  }, [clients, projects, query, status]);

  return (
    <Screen>
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
      <View className="mt-5 gap-3">
        {filtered.length === 0 ? (
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
        ) : (
          filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={clients.find((client) => client.id === project.clientId)?.name ?? 'Cliente'}
              surveyCount={surveysForProject(project.id, surveys).length}
              lastSurveyAt={lastProjectSurveyAt(project.id, surveys)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
