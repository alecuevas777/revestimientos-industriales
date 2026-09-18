import { Building2, ChevronRight, Clock, Layers } from 'lucide-react-native';
import { Pressable, Text, View, type DimensionValue } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SERVICE_TYPE_SHORT } from '@/constants/labels';
import { Colors } from '@/constants/theme';
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
  const continueTo = onContinue ?? (() => push(`/levantamientos/${survey.id}/editar`));

  return (
    <Card>
      <Pressable onPress={continueTo}>
        <View className="flex-row items-start justify-between gap-2">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.2px] text-brand">
            Continuar levantamiento
          </Text>
          <ChevronRight size={18} color={Colors.muted} />
        </View>
        <Text className="mt-2 text-lg font-bold text-ink">{survey.code}</Text>
        {projectName ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <Building2 size={14} color={Colors.muted} />
            <Text className="text-sm text-muted">{projectName}</Text>
          </View>
        ) : null}
        <View className="mt-1.5 flex-row items-center gap-1.5">
          <Layers size={14} color={Colors.muted} />
          <Text className="text-sm text-muted">
            {SERVICE_TYPE_SHORT[survey.serviceType]}
            {surveyArea(survey) ? ` · ${formatArea(surveyArea(survey))}` : ''}
          </Text>
        </View>
        <View className="mt-1.5 flex-row items-center gap-1.5">
          <Clock size={14} color={Colors.muted} />
          <Text className="text-sm text-muted">Última modificación {formatRelative(survey.updatedAt)}</Text>
        </View>
        <View className="mt-4">
          <Text className="mb-2 text-xs font-semibold text-muted">
            {done} de {total} secciones
          </Text>
          <View className="h-1.5 overflow-hidden rounded-full bg-line">
            <View className="h-full rounded-full bg-brand" style={{ width }} />
          </View>
        </View>
      </Pressable>
      <View className="mt-4">
        <Button label="Continuar" className="rounded-full" onPress={continueTo} />
      </View>
    </Card>
  );
}
