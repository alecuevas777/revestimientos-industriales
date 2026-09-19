import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SurveyReportButton } from '@/components/SurveyReportButton';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { replace, routeParam } from '@/lib/nav';
import { photoCount, problemCount } from '@/lib/survey';
import { Text, View } from 'react-native';

export default function SurveySuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSurvey, getProject, getClient } = useApp();
  const { session } = useAuth();
  const survey = getSurvey(routeParam(id) ?? '');
  const project = survey ? getProject(survey.projectId) : undefined;
  const client = project ? getClient(project.clientId) : undefined;

  if (!survey) {
    return (
      <Screen>
        <ScreenHeader title="Levantamiento" back={false} />
        <EmptyState title="Registro no encontrado" description="El levantamiento ya no está disponible." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Levantamiento guardado" back={false} />
      <Card>
        <Text className="text-sm font-semibold uppercase tracking-wide text-success">Guardado en este dispositivo</Text>
        <Text className="mt-3 text-2xl font-bold text-ink">{survey.code}</Text>
        <Text className="mt-2 text-base text-muted">{project?.name}</Text>
        <View className="mt-5 gap-1">
          <Text className="text-sm text-ink">
            {survey.sectors.length} {survey.sectors.length === 1 ? 'sector' : 'sectores'}
          </Text>
          <Text className="text-sm text-ink">
            {photoCount(survey)} {photoCount(survey) === 1 ? 'fotografía' : 'fotografías'}
          </Text>
          <Text className="text-sm text-ink">
            {problemCount(survey)} {problemCount(survey) === 1 ? 'problema detectado' : 'problemas detectados'}
          </Text>
        </View>
      </Card>
      <View className="mt-6 gap-3">
        <SurveyReportButton
          survey={survey}
          client={client}
          project={project}
          technician={session?.name ?? 'Técnico'}
        />
        <Button label="Ver levantamiento" variant="secondary" onPress={() => replace(`/levantamientos/${survey.id}`)} />
        <Button
          label="Volver al proyecto"
          variant="ghost"
          onPress={() => replace(`/proyectos/${survey.projectId}`)}
        />
      </View>
    </Screen>
  );
}
