import { Text, View, type DimensionValue } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SERVICE_TYPE_SHORT } from '@/constants/labels';
import { formatArea, formatRelative } from '@/lib/format';
import { push } from '@/lib/nav';
import { surveyArea, surveyProgress } from '@/lib/survey';
import type { Survey } from '@/types';

type Props = {
  survey: Survey;
  projectName?: string;
  onContinue?: () => void;
};

export function DraftCard({ survey, projectName, onContinue }: Props) {
  const { done, total } = surveyProgress(survey);
  const width = `${Math.round((done / total) * 100)}%` as DimensionValue;

  return (
    <Card className="border-brand/20 bg-white">
      <Text className="text-xs font-semibold uppercase tracking-wide text-brand">Continuar levantamiento</Text>
      <Text className="mt-2 text-lg font-bold text-ink">{survey.code}</Text>
      {projectName ? <Text className="mt-1 text-sm text-muted">{projectName}</Text> : null}
      <Text className="mt-1 text-sm text-muted">
        {SERVICE_TYPE_SHORT[survey.serviceType]}
        {surveyArea(survey) ? ` · ${formatArea(surveyArea(survey))}` : ''}
      </Text>
      <Text className="mt-2 text-sm text-muted">Última modificación {formatRelative(survey.updatedAt)}</Text>
      <View className="mt-4">
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="text-xs font-semibold text-muted">
            {done} de {total} secciones
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-line">
          <View className="h-full rounded-full bg-brand" style={{ width }} />
        </View>
      </View>
      <View className="mt-4">
        <Button
          label="Continuar"
          onPress={onContinue ?? (() => push(`/levantamientos/${survey.id}/editar`))}
        />
      </View>
    </Card>
  );
}
