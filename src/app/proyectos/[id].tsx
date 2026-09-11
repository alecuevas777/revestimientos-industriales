import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { DraftCard } from '@/components/DraftCard';
import { InfoRow } from '@/components/InfoRow';
import { SurveyCard } from '@/components/SurveyCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppProvider';
import { completedOf, draftsOf, surveysForProject } from '@/lib/selectors';
import { push, routeParam } from '@/lib/nav';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProject, getClient, surveys } = useApp();
  const project = getProject(routeParam(id) ?? '');
  const client = project ? getClient(project.clientId) : undefined;

  if (!project) {
    return (
      <Screen>
        <ScreenHeader title="Proyecto" />
        <EmptyState title="Proyecto no encontrado" description="Este recinto ya no está disponible." />
      </Screen>
    );
  }

  const projectSurveys = surveysForProject(project.id, surveys);
  const drafts = draftsOf(projectSurveys);
  const history = completedOf(projectSurveys);

  return (
    <Screen>
      <ScreenHeader
        title={project.name}
        right={
          <Pressable
            onPress={() => push(`/proyectos/editar/${project.id}`)}
            className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
          >
            <Pencil size={18} color={Colors.ink} />
          </Pressable>
        }
      />

      <Card>
        <View className="mb-3">
          <StatusBadge status={project.status} />
        </View>
        <InfoRow label="Cliente" value={client?.name} />
        <InfoRow label="Dirección" value={project.location || [project.address, project.city].filter(Boolean).join(', ')} />
        <InfoRow label="Contacto de terreno" value={project.siteContactName} />
        <InfoRow label="Teléfono" value={project.siteContactPhone} />
        <InfoRow label="Descripción" value={project.description} />
      </Card>

      <View className="mt-5">
        <Button
          label="Nuevo levantamiento"
          icon={<Plus size={18} color="#fff" />}
          onPress={() => router.push({ pathname: '/levantamientos/nuevo', params: { projectId: project.id } })}
        />
      </View>

      {drafts.length > 0 ? (
        <View className="mt-8 gap-3">
          <SectionHeader title="Borradores pendientes" />
          {drafts.map((survey) => (
            <DraftCard key={survey.id} survey={survey} projectName={project.name} />
          ))}
        </View>
      ) : null}

      <View className="mt-8 gap-3 pb-4">
        <SectionHeader title="Historial de levantamientos" />
        {history.length === 0 ? (
          <EmptyState
            title="Sin levantamientos"
            description="Registra el primer estado de superficie de este recinto."
            action={
              <Button
                label="+ Nuevo levantamiento"
                onPress={() =>
                  router.push({ pathname: '/levantamientos/nuevo', params: { projectId: project.id } })
                }
              />
            }
          />
        ) : (
          history.map((survey) => <SurveyCard key={survey.id} survey={survey} />)
        )}
      </View>
    </Screen>
  );
}
