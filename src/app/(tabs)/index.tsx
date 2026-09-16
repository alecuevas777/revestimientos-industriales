import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { DraftCard } from '@/components/DraftCard';
import { ProjectCard } from '@/components/ProjectCard';
import { StatCard } from '@/components/StatCard';
import { SurveyCard } from '@/components/SurveyCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { firstName, greetingForNow } from '@/lib/format';
import { completedOf, draftsOf, lastProjectSurveyAt, recentProjects, surveysForProject } from '@/lib/selectors';

export default function DashboardScreen() {
  const { ready, clients, projects, surveys } = useApp();
  const { session } = useAuth();
  const drafts = draftsOf(surveys);
  const recent = completedOf(surveys).slice(0, 4);
  const latestProjects = recentProjects(projects, surveys, 3);
  const activeProjects = projects.filter((project) => project.status === 'active').length;
  const completedCount = surveys.filter((survey) => survey.status === 'completed').length;

  if (!ready) {
    return (
      <Screen bottomSafe={false}>
        <View className="h-8 w-48 rounded-lg bg-line" />
        <View className="mt-3 h-5 w-32 rounded-lg bg-line" />
        <View className="mt-6 flex-row gap-3">
          <View className="h-24 flex-1 rounded-2xl bg-line" />
          <View className="h-24 flex-1 rounded-2xl bg-line" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen bottomSafe={false}>
      <View className="mb-6 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-bold text-ink">{greetingForNow()},</Text>
          <Text className="text-2xl font-bold text-ink">{firstName(session?.name ?? 'Técnico')}</Text>
          <Text className="mt-1 text-sm text-muted">Trabajo en terreno · guardado en este dispositivo</Text>
        </View>
        <ProfileButton />
      </View>

      <View className="flex-row gap-3">
        <StatCard label="Clientes" value={clients.filter((client) => !client.archived).length} />
        <StatCard label="Proyectos activos" value={activeProjects} />
      </View>
      <View className="mt-3 flex-row gap-3">
        <StatCard label="Levantamientos realizados" value={completedCount} />
        <StatCard label="Borradores" value={drafts.length} />
      </View>

      <View className="mt-6">
        <Button
          label="Nuevo levantamiento"
          icon={<Plus size={18} color="#fff" />}
          onPress={() => router.push('/levantamientos/nuevo')}
        />
      </View>

      {drafts.length > 0 ? (
        <View className="mt-8 gap-3">
          <SectionHeader title="Continuar levantamiento" />
          {drafts.slice(0, 2).map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            return <DraftCard key={survey.id} survey={survey} projectName={project?.name} />;
          })}
        </View>
      ) : null}

      <View className="mt-8 gap-3">
        <SectionHeader title="Actividad reciente" />
        {recent.length === 0 ? (
          <EmptyState
            title="Sin levantamientos finalizados"
            description="Cuando completes una inspección, aparecerá aquí."
          />
        ) : (
          recent.map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            return (
              <SurveyCard
                key={survey.id}
                survey={survey}
                projectName={project?.name}
                location={project?.city}
                technician={session?.name ?? 'Técnico'}
                compact
              />
            );
          })
        )}
      </View>

      <View className="mt-8 gap-3 pb-4">
        <SectionHeader title="Proyectos recientes" />
        {latestProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            clientName={clients.find((client) => client.id === project.clientId)?.name ?? 'Cliente'}
            surveyCount={surveysForProject(project.id, surveys).length}
            lastSurveyAt={lastProjectSurveyAt(project.id, surveys)}
          />
        ))}
      </View>
    </Screen>
  );
}
