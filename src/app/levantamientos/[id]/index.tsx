import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { InfoRow } from '@/components/InfoRow';
import { PhotoGrid } from '@/components/PhotoGrid';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ConditionBadge, SeverityBadge, SurveyStatusBadge } from '@/components/ui/StatusBadge';
import {
  COATING_CONDITION_LABELS,
  EXISTING_COATING_LABELS,
  JOINT_CONDITION_LABELS,
  MOISTURE_LABELS,
  SCOPE_LABELS,
  SUBSTRATE_LABELS,
  SURFACE_TYPE_LABELS,
  TRAFFIC_LABELS,
  YES_NO_LABELS,
  YES_NO_UNKNOWN_LABELS,
} from '@/constants/labels';
import { useApp } from '@/context/AppProvider';
import { contaminationList, exposureList, problemList, useList } from '@/lib/display';
import { formatArea, formatDate, formatTime } from '@/lib/format';
import { push, routeParam } from '@/lib/nav';
import { collectPhotos } from '@/lib/survey';
import type { SurveySector } from '@/types';

function SectorBlock({
  sector,
  index,
  expanded,
  onToggle,
}: {
  sector: SurveySector;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <Pressable onPress={onToggle} className="min-h-[52px]">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted">
          Sector {String(index + 1).padStart(2, '0')}
        </Text>
        <Text className="mt-1 text-base font-semibold text-ink">{sector.name || 'Sector sin nombre'}</Text>
        <Text className="mt-1 text-sm text-muted">{formatArea(sector.approximateArea)}</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <ConditionBadge condition={sector.condition} />
          <SeverityBadge severity={sector.severity} />
        </View>
        {!expanded ? (
          <View className="mt-3 gap-1">
            <Text className="text-sm text-muted">Problemas: {problemList(sector)}</Text>
            <Text className="text-sm text-muted">Uso: {useList(sector.uses, sector.otherUse)}</Text>
            <Text className="text-sm text-muted">
              Fotos: {sector.photos.length}
            </Text>
          </View>
        ) : null}
      </Pressable>
      {expanded ? (
        <View className="mt-4 gap-3 border-t border-line pt-4">
          <InfoRow label="Problemas" value={problemList(sector)} />
          <InfoRow label="Uso" value={useList(sector.uses, sector.otherUse)} />
          <InfoRow label="Tránsito" value={sector.trafficLevel ? TRAFFIC_LABELS[sector.trafficLevel] : '—'} />
          <InfoRow label="Exposición" value={exposureList(sector.exposures)} />
          <InfoRow
            label="Contaminación"
            value={contaminationList(sector.contaminations, sector.noRelevantContamination, sector.otherContamination)}
          />
          <InfoRow
            label="Humedad"
            value={
              sector.moisture?.observed
                ? [MOISTURE_LABELS[sector.moisture.observed], sector.moisture.notes].filter(Boolean).join(' · ')
                : '—'
            }
          />
          <InfoRow
            label="Juntas"
            value={
              sector.joints?.hasJoints === 'yes' && sector.joints.jointCondition
                ? JOINT_CONDITION_LABELS[sector.joints.jointCondition]
                : sector.joints?.hasJoints
                  ? YES_NO_LABELS[sector.joints.hasJoints]
                  : '—'
            }
          />
          <InfoRow label="Observación" value={sector.observations || 'Sin observación'} />
          <InfoRow label="Comentario técnico" value={sector.recommendation || 'Sin comentario preliminar'} />
          <PhotoGrid photos={sector.photos} />
        </View>
      ) : (
        <Text className="mt-3 text-sm font-semibold text-brand">Ver detalle</Text>
      )}
    </Card>
  );
}

export default function SurveyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSurvey, getProject, getClient, session } = useApp();
  const survey = getSurvey(routeParam(id) ?? '');
  const project = survey ? getProject(survey.projectId) : undefined;
  const client = project ? getClient(project.clientId) : undefined;
  const [openId, setOpenId] = useState<string | null>(survey?.sectors[0]?.id ?? null);

  if (!survey) {
    return (
      <Screen>
        <ScreenHeader title="Levantamiento" />
        <EmptyState title="Registro no encontrado" description="Este levantamiento ya no está disponible." />
      </Screen>
    );
  }

  if (survey.status === 'draft') {
    return (
      <Screen>
        <ScreenHeader title={survey.code} />
        <EmptyState
          title="Este levantamiento está en borrador"
          description="Puedes retomarlo y completar la inspección."
          action={<Button label="Continuar" onPress={() => push(`/levantamientos/${survey.id}/editar`)} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={survey.code} right={<SurveyStatusBadge status={survey.status} />} />

      <Card>
        <Text className="text-2xl font-bold text-ink">{survey.code}</Text>
        <Text className="mt-1 text-base text-muted">{project?.name}</Text>
      </Card>

      <View className="mt-6 gap-3">
        <SectionHeader title="Resumen" />
        <Card>
          <InfoRow label="Cliente" value={client?.name} />
          <InfoRow label="Proyecto" value={project?.name} />
          <InfoRow label="Técnico" value={session?.name ?? 'Técnico Demo'} />
          <InfoRow label="Fecha" value={formatDate(survey.startedAt)} />
          <InfoRow label="Hora inicio" value={formatTime(survey.startedAt)} />
          <InfoRow label="Hora finalización" value={survey.completedAt ? formatTime(survey.completedAt) : '—'} />
        </Card>
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Superficie" />
        <Card>
          <InfoRow label="Tipo" value={survey.surfaceType ? SURFACE_TYPE_LABELS[survey.surfaceType] : '—'} />
          <InfoRow label="Superficie" value={formatArea(survey.totalArea)} />
          <InfoRow
            label="Sustrato"
            value={
              survey.substrateType === 'other'
                ? survey.otherSubstrate
                : survey.substrateType
                  ? SUBSTRATE_LABELS[survey.substrateType]
                  : '—'
            }
          />
          <InfoRow label="Alcance" value={survey.scope ? SCOPE_LABELS[survey.scope] : '—'} />
        </Card>
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Condición general" />
        <Card>
          <View className="border-b border-line py-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted">Estado</Text>
            <View className="mt-2">
              {survey.overallCondition ? <ConditionBadge condition={survey.overallCondition} /> : <Text>—</Text>}
            </View>
          </View>
          <InfoRow
            label="Humedad"
            value={
              survey.moisture?.observed
                ? [MOISTURE_LABELS[survey.moisture.observed], survey.moisture.notes].filter(Boolean).join(' · ')
                : '—'
            }
          />
          <InfoRow
            label="Revestimiento existente"
            value={
              survey.existingCoating === 'yes'
                ? [
                    survey.existingCoatingType
                      ? EXISTING_COATING_LABELS[survey.existingCoatingType]
                      : 'Sí',
                    survey.existingCoatingCondition
                      ? COATING_CONDITION_LABELS[survey.existingCoatingCondition]
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : survey.existingCoating
                  ? YES_NO_UNKNOWN_LABELS[survey.existingCoating]
                  : '—'
            }
          />
          <InfoRow
            label="Contaminación"
            value={contaminationList(
              survey.contaminations,
              survey.noRelevantContamination,
              survey.otherContamination,
            )}
          />
        </Card>
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Sectores" />
        {survey.sectors.length === 0 ? (
          <EmptyState title="Sin sectores" description="Este levantamiento no registró sectores." />
        ) : (
          survey.sectors.map((sector, index) => (
            <SectorBlock
              key={sector.id}
              sector={sector}
              index={index}
              expanded={openId === sector.id}
              onToggle={() => setOpenId((current) => (current === sector.id ? null : sector.id))}
            />
          ))
        )}
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Evidencia" />
        <PhotoGrid photos={collectPhotos(survey)} sectors={survey.sectors} />
      </View>

      {survey.generalObservations ? (
        <View className="mt-6 gap-3">
          <SectionHeader title="Observaciones" />
          <Card>
            <Text className="text-base leading-6 text-ink">{survey.generalObservations}</Text>
          </Card>
        </View>
      ) : null}

      {survey.conclusion ? (
        <View className="mt-6 gap-3">
          <SectionHeader title="Conclusión general" />
          <Card>
            <Text className="text-base leading-6 text-ink">{survey.conclusion}</Text>
          </Card>
        </View>
      ) : null}

      {survey.plantOperational || survey.accessNotes || survey.siteComments ? (
        <View className="mt-6 gap-3 pb-4">
          <SectionHeader title="Condiciones de ejecución" />
          <Card>
            <InfoRow
              label="Planta operativa"
              value={survey.plantOperational ? YES_NO_LABELS[survey.plantOperational] : '—'}
            />
            <InfoRow
              label="Restricciones de horario"
              value={survey.scheduleRestrictions ? YES_NO_LABELS[survey.scheduleRestrictions] : '—'}
            />
            <InfoRow label="Acceso" value={survey.accessNotes} />
            <InfoRow
              label="Maquinaria a retirar"
              value={survey.machineryToRemove ? YES_NO_LABELS[survey.machineryToRemove] : '—'}
            />
            <InfoRow label="Comentarios" value={survey.siteComments} />
          </Card>
        </View>
      ) : (
        <View className="pb-4" />
      )}
    </Screen>
  );
}
