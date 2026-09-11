import { Text, View } from 'react-native';

import { InfoRow } from '@/components/InfoRow';
import { SectorCard } from '@/components/SectorCard';
import { Card } from '@/components/ui/Card';
import { ConditionBadge, SeverityBadge } from '@/components/ui/StatusBadge';
import { SCOPE_LABELS, SUBSTRATE_LABELS, SURFACE_TYPE_LABELS } from '@/constants/labels';
import { formatArea, formatDate, formatTime } from '@/lib/format';
import { push } from '@/lib/nav';
import { criticalSectorCount, maxSeverity, photoCount, problemCount } from '@/lib/survey';
import type { Client, Project, Survey } from '@/types';

type Props = {
  survey: Survey;
  project?: Project;
  client?: Client;
  technician: string;
  errors: string[];
};

export function ReviewStep({ survey, project, client, technician, errors }: Props) {
  const highest = maxSeverity(survey);

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
        <View className="mt-4 gap-1">
          <InfoRow label="Cliente" value={client?.name} />
          <InfoRow
            label="Superficie"
            value={
              [
                survey.surfaceType ? SURFACE_TYPE_LABELS[survey.surfaceType] : null,
                formatArea(survey.totalArea),
                survey.substrateType ? SUBSTRATE_LABELS[survey.substrateType] : null,
                survey.scope ? SCOPE_LABELS[survey.scope] : null,
              ]
                .filter(Boolean)
                .join(' · ')
            }
          />
          <InfoRow label="Sectores" value={survey.sectors.length} />
          <InfoRow label="Fotografías" value={photoCount(survey)} />
          <InfoRow label="Problemas detectados" value={problemCount(survey)} />
          <InfoRow label="Sectores críticos" value={criticalSectorCount(survey)} />
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
              onPress={() => push(`/levantamientos/${survey.id}/sector/${item.id}`)}
            />
          ))
        )}
      </View>
    </View>
  );
}
