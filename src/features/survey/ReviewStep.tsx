import { Text, View } from 'react-native';

import { InfoRow } from '@/components/InfoRow';
import { SectorCard } from '@/components/SectorCard';
import { ServiceMark } from '@/components/ServiceMark';
import { Card } from '@/components/ui/Card';
import { ConditionBadge, SeverityBadge } from '@/components/ui/StatusBadge';
import { PROBLEM_LABELS, SCOPE_LABELS } from '@/constants/labels';
import { formatArea, formatDate, formatTime } from '@/lib/format';
import { surveyHeadline, surveyMetrics } from '@/lib/display';
import { push } from '@/lib/nav';
import { criticalItemCount, maxSeverity } from '@/lib/survey';
import type { Client, Project, Survey } from '@/types';

type Props = {
  survey: Survey;
  project?: Project;
  client?: Client;
  technician: string;
  errors: string[];
  onRemoveSector?: (sectorId: string) => void;
};

export function ReviewStep({ survey, project, client, technician, errors, onRemoveSector }: Props) {
  const highest = maxSeverity(survey);
  const metrics = surveyMetrics(survey);
  const mainProblems =
    'problems' in survey.serviceData
      ? survey.serviceData.problems.slice(0, 4).map((id) => PROBLEM_LABELS[id])
      : [];

  return (
    <View className="gap-5">
      {errors.length > 0 ? (
        <View className="rounded-2xl border border-danger-light bg-danger-light px-4 py-3">
          {errors.map((error) => (
            <Text key={error} className="text-sm leading-5 text-danger">
              {error}
            </Text>
          ))}
        </View>
      ) : null}

      <Card>
        <Text className="text-lg font-bold text-ink">{survey.code}</Text>
        <Text className="mt-1 text-base text-muted">{project?.name ?? '—'}</Text>
        <View className="mt-3">
          <ServiceMark type={survey.serviceType} size="md" />
        </View>
        <Text className="mt-3 text-sm leading-5 text-muted">{surveyHeadline(survey)}</Text>
        <View className="mt-4">
          <InfoRow label="Cliente" value={client?.name} />
          <InfoRow label="Alcance" value={survey.scope ? SCOPE_LABELS[survey.scope] : '—'} />
          {metrics.area ? <InfoRow label="Superficie" value={formatArea(metrics.area)} /> : null}
          <InfoRow label="Sectores" value={metrics.sectors} />
          {metrics.elements > 0 ? <InfoRow label="Elementos" value={metrics.elements} /> : null}
          <InfoRow label="Problemas detectados" value={metrics.problems} />
          {metrics.severe > 0 ? <InfoRow label="Corrosión severa" value={metrics.severe} /> : null}
          <InfoRow label="Hallazgos críticos" value={criticalItemCount(survey)} />
          <InfoRow label="Fotografías" value={metrics.photos} />
          {mainProblems.length > 0 ? <InfoRow label="Problemas principales" value={mainProblems.join(', ')} /> : null}
        </View>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {survey.overallCondition ? <ConditionBadge condition={survey.overallCondition} /> : null}
          {highest ? <SeverityBadge severity={highest} /> : null}
        </View>
        <InfoRow label="Técnico" value={technician} />
        <InfoRow label="Fecha" value={formatDate(survey.startedAt)} />
        <InfoRow label="Hora de inicio" value={formatTime(survey.startedAt)} />
      </Card>

      <View className="gap-3">
        <Text className="text-lg font-semibold text-ink">Sectores</Text>
        {survey.sectors.length === 0 ? (
          <Card>
            <Text className="text-sm text-muted">No se registraron sectores.</Text>
          </Card>
        ) : (
          survey.sectors.map((item, index) => (
            <SectorCard
              key={item.id}
              sector={item}
              index={index}
              serviceType={survey.serviceType}
              onPress={() => push(`/levantamientos/${survey.id}/sector/${item.id}`)}
              onDelete={onRemoveSector ? () => onRemoveSector(item.id) : undefined}
            />
          ))
        )}
      </View>
    </View>
  );
}
