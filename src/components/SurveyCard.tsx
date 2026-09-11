import { Camera, ChevronRight, Layers } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ConditionBadge, SeverityBadge, SurveyStatusBadge } from '@/components/ui/StatusBadge';
import { DEMO_USER, SURFACE_TYPE_LABELS } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import { formatArea, formatDate } from '@/lib/format';
import { push } from '@/lib/nav';
import { maxSeverity, photoCount } from '@/lib/survey';
import type { Survey } from '@/types';

type Props = {
  survey: Survey;
  projectName?: string;
  clientName?: string;
  location?: string;
  compact?: boolean;
  technician?: string;
};

export function SurveyCard({
  survey,
  projectName,
  clientName,
  location,
  compact,
  technician = DEMO_USER.name,
}: Props) {
  const photos = photoCount(survey);
  const surface = survey.surfaceType ? SURFACE_TYPE_LABELS[survey.surfaceType] : 'Sin superficie';
  const highest = maxSeverity(survey);

  return (
    <Pressable
      onPress={() =>
        push(survey.status === 'draft' ? `/levantamientos/${survey.id}/editar` : `/levantamientos/${survey.id}`)
      }
    >
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-semibold text-brand">{survey.code}</Text>
            <Text className="mt-1 text-sm text-muted">{formatDate(survey.completedAt ?? survey.startedAt)}</Text>
            {projectName ? <Text className="mt-2 text-base font-semibold text-ink">{projectName}</Text> : null}
            {clientName || location ? (
              <Text className="mt-1 text-sm text-muted">{[clientName, location].filter(Boolean).join(' · ')}</Text>
            ) : null}
            <Text className="mt-2 text-sm text-muted">
              {surface} · {formatArea(survey.totalArea)}
            </Text>
          </View>
          <SurveyStatusBadge status={survey.status} />
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          {survey.overallCondition ? <ConditionBadge condition={survey.overallCondition} /> : null}
          {highest ? <SeverityBadge severity={highest} /> : null}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <Layers size={15} color={Colors.muted} />
              <Text className="text-sm text-muted">
                {survey.sectors.length} {survey.sectors.length === 1 ? 'sector' : 'sectores'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Camera size={15} color={Colors.muted} />
              <Text className="text-sm text-muted">
                {photos} {photos === 1 ? 'fotografía' : 'fotografías'}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-brand">{compact ? 'Ver' : 'Ver levantamiento'}</Text>
            <ChevronRight size={16} color={Colors.brand} />
          </View>
        </View>
        <Text className="mt-2 text-xs text-muted">Técnico: {technician}</Text>
      </Card>
    </Pressable>
  );
}
