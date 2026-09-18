import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { DraftCard } from '@/components/DraftCard';
import { SurveyCard } from '@/components/SurveyCard';
import { TabBrandHeader } from '@/components/TabBrandHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchInput } from '@/components/ui/SearchInput';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';

type Filter = 'all' | 'draft' | 'completed';

export default function SurveysScreen() {
  const { clients, projects, surveys } = useApp();
  const { session } = useAuth();
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
  const previewDrafts = drafts.slice(0, 2);
  const history = showDraftsApart ? visible.filter((survey) => survey.status !== 'draft') : visible;

  return (
    <Screen>
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
        <Button
          label="Nuevo cliente y proyecto"
          variant="ghost"
          className="rounded-full bg-white"
          onPress={() => router.push('/levantamientos/nuevo?origen=nuevo')}
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
            const project = projects.find((item) => item.id === survey.projectId);
            return <DraftCard key={survey.id} survey={survey} projectName={project?.name} />;
          })}
        </View>
      ) : null}

      <View className="mt-6 gap-3">
        {filter === 'all' && history.length > 0 ? <SectionHeader title="Historial" /> : null}
        {filter === 'draft' ? <SectionHeader title="Borradores" /> : null}
        {history.length === 0 && !showDraftsApart ? (
          <EmptyState title="Sin resultados" description="Cambia el filtro o el texto de búsqueda." />
        ) : filter === 'draft' ? (
          history.map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            return <DraftCard key={survey.id} survey={survey} projectName={project?.name} />;
          })
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
                technician={session?.name ?? 'Técnico'}
              />
            );
          })
        )}
      </View>
    </Screen>
  );
}
