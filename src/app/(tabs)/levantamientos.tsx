import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { DraftCard } from '@/components/DraftCard';
import { SurveyCard } from '@/components/SurveyCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DEMO_USER } from '@/constants/labels';
import { useApp } from '@/context/AppProvider';
import { hasBadCondition, hasHighSeverity } from '@/lib/survey';
import type { ServiceType } from '@/types';

type Filter = 'all' | 'draft' | 'completed' | ServiceType | 'bad' | 'criticality';

export default function SurveysScreen() {
  const { clients, projects, surveys, session } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const drafts = useMemo(
    () =>
      surveys
        .filter((survey) => survey.status === 'draft')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [surveys],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return surveys
      .filter((survey) => {
        if (filter === 'draft' || filter === 'completed') return survey.status === filter;
        if (filter === 'epoxy' || filter === 'pu_cement' || filter === 'roof_waterproofing' || filter === 'corrosion_control') {
          return survey.serviceType === filter;
        }
        if (filter === 'bad') return hasBadCondition(survey);
        if (filter === 'criticality') return hasHighSeverity(survey);
        return true;
      })
      .filter((survey) => {
        const project = projects.find((item) => item.id === survey.projectId);
        const client = project ? clients.find((item) => item.id === project.clientId) : undefined;
        return [survey.code, project?.name, client?.name, project?.location, project?.city]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [clients, filter, projects, query, surveys]);

  const showDraftsApart = filter === 'all' && !query && drafts.length > 0;
  const history = showDraftsApart ? visible.filter((survey) => survey.status !== 'draft') : visible;

  return (
    <Screen bottomSafe={false}>
      <ScreenHeader title="Levantamientos" back={false} right={<ProfileButton />} />
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
            { value: 'epoxy', label: 'Epóxicos' },
            { value: 'pu_cement', label: 'PU cemento' },
            { value: 'roof_waterproofing', label: 'Cubiertas' },
            { value: 'corrosion_control', label: 'Corrosión' },
            { value: 'bad', label: 'Estado malo/crítico' },
            { value: 'criticality', label: 'Criticidad alta' },
          ]}
        />
        <Button label="+ Nuevo levantamiento" onPress={() => router.push('/levantamientos/nuevo')} />
        <Button
          label="Nuevo cliente y proyecto"
          variant="ghost"
          onPress={() => router.push('/levantamientos/nuevo?origen=nuevo')}
        />
      </View>

      {showDraftsApart ? (
        <View className="mt-6 gap-3">
          <SectionHeader title="Borradores" />
          {drafts.map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            return <DraftCard key={survey.id} survey={survey} projectName={project?.name} />;
          })}
        </View>
      ) : null}

      <View className="mt-6 gap-3">
        <SectionHeader title={filter === 'draft' ? 'Borradores' : 'Historial'} />
        {history.length === 0 ? (
          <EmptyState title="Sin resultados" description="Cambia el filtro o el texto de búsqueda." />
        ) : (
          history.map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            const client = project ? clients.find((item) => item.id === project.clientId) : undefined;
            return (
              <SurveyCard
                key={survey.id}
                survey={survey}
                projectName={project?.name}
                clientName={client?.name}
                location={project?.city}
                technician={session?.name ?? DEMO_USER.name}
              />
            );
          })
        )}
      </View>
    </Screen>
  );
}
