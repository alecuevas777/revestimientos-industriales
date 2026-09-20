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
import { SERVICE_TYPE_LABELS, SERVICE_TYPE_SHORT } from '@/constants/labels';
import { useAppActions, useAppData } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { indexById } from '@/lib/selectors';
import { surveyMatchesFindings, surveyMatchesService, type HistoryFinding } from '@/lib/survey';
import type { ServiceType, Survey } from '@/types';

type StatusFilter = 'all' | 'draft' | 'completed';
type ServiceFilter = 'all' | ServiceType;

const SERVICE_FILTERS: { value: ServiceFilter; label: string }[] = [
  { value: 'all', label: 'Todos los servicios' },
  { value: 'epoxy', label: SERVICE_TYPE_SHORT.epoxy },
  { value: 'pu_cement', label: SERVICE_TYPE_SHORT['pu_cement'] },
  { value: 'roof_waterproofing', label: SERVICE_TYPE_SHORT.roof_waterproofing },
  { value: 'corrosion_control', label: SERVICE_TYPE_SHORT.corrosion_control },
];

const FINDING_FILTERS: { value: HistoryFinding; label: string }[] = [
  { value: 'bad', label: 'Malo / crítico' },
  { value: 'high', label: 'Criticidad alta' },
];

export default function SurveysScreen() {
  const { clients, projects, surveys, refreshing } = useAppData();
  const { refreshWorkspace } = useAppActions();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [serviceType, setServiceType] = useState<ServiceFilter>('all');
  const [findings, setFindings] = useState<HistoryFinding[]>([]);

  const projectsById = useMemo(() => indexById(projects), [projects]);
  const clientsById = useMemo(() => indexById(clients), [clients]);
  const extraFiltersOn = serviceType !== 'all' || findings.length > 0;

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
      .filter((survey) => surveyMatchesService(survey, serviceType))
      .filter((survey) => surveyMatchesFindings(survey, findings))
      .filter((survey) => {
        if (!term) return true;
        const project = projectsById.get(survey.projectId);
        const client = project ? clientsById.get(project.clientId) : undefined;
        return [
          survey.code,
          project?.name,
          client?.name,
          project?.location,
          project?.city,
          SERVICE_TYPE_SHORT[survey.serviceType],
          SERVICE_TYPE_LABELS[survey.serviceType],
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [clientsById, filter, findings, projectsById, search, serviceType, surveys]);

  const showDraftsApart = filter === 'all' && !search && !extraFiltersOn && drafts.length > 0;
  const previewDrafts = drafts.slice(0, 2);
  const history = showDraftsApart ? visible.filter((survey) => survey.status !== 'draft') : visible;
  const emptyCatalog = surveys.length === 0 && !search && filter === 'all' && !extraFiltersOn;
  const noResults = history.length === 0 && !showDraftsApart;

  function clearExtraFilters() {
    setServiceType('all');
    setFindings([]);
  }

  return (
    <Screen scroll={false} padded={false}>
      <CatalogList
        data={history}
        extraData={`${filter}:${serviceType}:${findings.join(',')}:${search}:${session?.name ?? ''}`}
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
              <FilterChips value={serviceType} onChange={setServiceType} options={SERVICE_FILTERS} />
              <FilterChips values={findings} onChange={setFindings} options={FINDING_FILTERS} />
              {extraFiltersOn ? (
                <Pressable onPress={clearExtraFilters} className="self-start py-1">
                  <Text className="text-sm font-semibold text-brand">Quitar filtros</Text>
                </Pressable>
              ) : null}
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
                <SectionHeader
                  title={extraFiltersOn || search ? 'Resultados' : 'Historial'}
                  action={
                    extraFiltersOn || search ? (
                      <Text className="text-sm font-medium text-muted">
                        {history.length} {history.length === 1 ? 'registro' : 'registros'}
                      </Text>
                    ) : null
                  }
                />
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
            <EmptyState
              title="Sin resultados"
              description={
                extraFiltersOn
                  ? 'Ningún levantamiento coincide con esos filtros.'
                  : 'Cambia el filtro o el texto de búsqueda.'
              }
              action={
                extraFiltersOn ? (
                  <Button label="Quitar filtros" variant="secondary" onPress={clearExtraFilters} />
                ) : null
              }
            />
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
