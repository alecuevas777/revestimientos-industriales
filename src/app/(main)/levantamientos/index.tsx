import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DraftCard } from '@/components/DraftCard';
import { SurveyCard } from '@/components/SurveyCard';
import { TabBrandHeader } from '@/components/TabBrandHeader';
import { Button } from '@/components/ui/Button';
import { CatalogList } from '@/components/ui/CatalogList';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchInput } from '@/components/ui/SearchInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAppActions, useAppData } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { indexById } from '@/lib/selectors';
import type { Survey } from '@/types';

type Filter = 'all' | 'draft' | 'completed';

export default function SurveysScreen() {
  const { clients, projects, surveys, refreshing } = useAppData();
  const { refreshWorkspace } = useAppActions();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query);
  const [filter, setFilter] = useState<Filter>('all');

  const projectsById = useMemo(() => indexById(projects), [projects]);
  const clientsById = useMemo(() => indexById(clients), [clients]);

  const drafts = useMemo(
    () =>
      surveys
        .filter((survey) => survey.status === 'draft')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [surveys],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return surveys
      .filter((survey) => {
        if (filter === 'draft' || filter === 'completed') return survey.status === filter;
        return true;
      })
      .filter((survey) => {
        const project = projectsById.get(survey.projectId);
        const client = project ? clientsById.get(project.clientId) : undefined;
        return [survey.code, project?.name, client?.name, project?.location, project?.city]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [clientsById, filter, projectsById, search, surveys]);

  const showDraftsApart = filter === 'all' && !search && drafts.length > 0;
  const previewDrafts = drafts.slice(0, 2);
  const history = showDraftsApart ? visible.filter((survey) => survey.status !== 'draft') : visible;
  const emptyCatalog = surveys.length === 0 && !search && filter === 'all';
  const noResults = history.length === 0 && !showDraftsApart;

  return (
    <Screen scroll={false} padded={false}>
      <CatalogList
        data={history}
        extraData={`${filter}:${search}:${session?.name ?? ''}`}
        keyExtractor={(survey) => survey.id}
        refreshing={refreshing}
        onRefresh={refreshWorkspace}
        header={
          <>
            <TabBrandHeader title="Levantamientos" subtitle="Continúa borradores y revisa su avance" />
            <View className="gap-3">
              <SearchInput
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar por código, proyecto, cliente o ubicación"
              />
              <FilterChips
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'draft', label: 'Borradores' },
                  { value: 'completed', label: 'Finalizados' },
                ]}
              />
              <Button
                label="Nuevo levantamiento"
                className="rounded-full"
                icon={<Plus size={18} color="#fff" />}
                onPress={() => router.push('/levantamientos/nuevo')}
              />
            </View>
            {showDraftsApart ? (
              <View className="mt-6 gap-3">
                <SectionHeader
                  title="Borradores"
                  action={
                    drafts.length > 0 ? (
                      <Pressable onPress={() => setFilter('draft')} className="flex-row items-center">
                        <Text className="text-sm font-semibold text-brand">Ver todos</Text>
                        <Text className="text-sm font-semibold text-brand"> {'>'}</Text>
                      </Pressable>
                    ) : null
                  }
                />
                {previewDrafts.map((survey) => {
                  const project = projectsById.get(survey.projectId);
                  return <DraftCard key={survey.id} survey={survey} projectName={project?.name} />;
                })}
              </View>
            ) : null}
            {filter === 'all' && history.length > 0 ? (
              <View className="mt-6">
                <SectionHeader title="Historial" />
              </View>
            ) : null}
            {filter === 'draft' ? (
              <View className="mt-6">
                <SectionHeader title="Borradores" />
              </View>
            ) : null}
          </>
        }
        empty={
          emptyCatalog ? (
            <EmptyState
              title="Aún no hay levantamientos"
              description="Crea el primer levantamiento asociado a un proyecto."
              action={
                <Button
                  label="Nuevo levantamiento"
                  className="rounded-full"
                  icon={<Plus size={18} color="#fff" />}
                  onPress={() => router.push('/levantamientos/nuevo')}
                />
              }
            />
          ) : noResults ? (
            <EmptyState title="Sin resultados" description="Cambia el filtro o el texto de búsqueda." />
          ) : null
        }
        renderItem={(survey: Survey) => {
          const project = projectsById.get(survey.projectId);
          if (filter === 'draft') {
            return <DraftCard survey={survey} projectName={project?.name} />;
          }
          const client = project ? clientsById.get(project.clientId) : undefined;
          return (
            <SurveyCard
              survey={survey}
              projectName={project?.name}
              clientName={client?.name}
              location={project?.city}
              technician={session?.name ?? 'Técnico'}
            />
          );
        }}
      />
    </Screen>
  );
}
