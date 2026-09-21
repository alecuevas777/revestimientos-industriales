import { useLocalSearchParams } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { InfoRow } from '@/components/InfoRow';
import { PhotoGrid } from '@/components/PhotoGrid';
import { ServiceMark } from '@/components/ServiceMark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SurveyExportButtons } from '@/components/SurveyExportButtons';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ConditionBadge, SeverityBadge, SurveyStatusBadge } from '@/components/ui/StatusBadge';
import {
  COATING_CONDITION_LABELS,
  CORROSION_LEVEL_LABELS,
  EXISTING_COATING_LABELS,
  FLOOR_SUBSTRATE_LABELS,
  FLOOR_SURFACE_LABELS,
  MATERIAL_LABELS,
  OPERATING_TEMP_LABELS,
  PROTECTION_LABELS,
  ROOF_KIND_LABELS,
  SCOPE_LABELS,
  YES_NO_LABELS,
  YES_NO_UNKNOWN_LABELS,
} from '@/constants/labels';
import { photoCategoriesForService } from '@/constants/options';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppProvider';
import { useSurveyRecord } from '@/hooks/useSurveyRecord';
import { elementTitle, exposureList, sectorProblemList, surveyHeadline, useList } from '@/lib/display';
import { formatArea, formatDate, formatTime } from '@/lib/format';
import { push, replace, routeParam } from '@/lib/nav';
import { collectPhotos } from '@/lib/survey';
import type { SurveyElement, SurveySector } from '@/types';

function ElementLine({ element }: { element: SurveyElement }) {
  return (
    <View className="rounded-2xl border border-line bg-canvas px-4 py-3">
      <Text className="text-sm font-semibold text-ink">{elementTitle(element)}</Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        <ConditionBadge condition={element.condition} />
        <SeverityBadge severity={element.severity} />
      </View>
      {element.corrosionLevel ? (
        <Text className="mt-2 text-sm text-muted">
          Corrosión {CORROSION_LEVEL_LABELS[element.corrosionLevel].toLowerCase()}
        </Text>
      ) : null}
      {element.material ? (
        <Text className="mt-1 text-sm text-muted">{MATERIAL_LABELS[element.material]}</Text>
      ) : null}
      <Text className="mt-1 text-sm text-muted">{element.photos.length} fotos</Text>
    </View>
  );
}

function SectorBlock({
  sector,
  expanded,
  onToggle,
}: {
  sector: SurveySector;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <Pressable onPress={onToggle} className="min-h-[52px]">
        <Text className="text-base font-semibold text-ink">{sector.name || 'Sector sin nombre'}</Text>
        {sector.approximateArea ? (
          <Text className="mt-1 text-sm text-muted">{formatArea(sector.approximateArea)}</Text>
        ) : null}
        <View className="mt-3 flex-row flex-wrap gap-2">
          <ConditionBadge condition={sector.condition} />
          <SeverityBadge severity={sector.severity} />
        </View>
        {!expanded ? (
          <Text className="mt-3 text-sm text-muted">
            {sector.elements.length > 0
              ? `${sector.elements.length} elementos · ${sector.photos.length} fotos`
              : `${sectorProblemList(sector)} · ${sector.photos.length} fotos`}
          </Text>
        ) : null}
      </Pressable>
      {expanded ? (
        <View className="mt-4 gap-3 border-t border-line pt-4">
          {sector.problems.length > 0 ? <InfoRow label="Problemas" value={sectorProblemList(sector)} /> : null}
          {sector.uses.length > 0 ? <InfoRow label="Uso" value={useList(sector.uses, sector.otherUse)} /> : null}
          {sector.exposures.length > 0 ? <InfoRow label="Exposición" value={exposureList(sector.exposures)} /> : null}
          <InfoRow label="Observación" value={sector.observations || 'Sin observación'} />
          {sector.elements.length > 0 ? (
            <View className="gap-2">
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted">Elementos</Text>
              {sector.elements.map((item) => (
                <ElementLine key={item.id} element={item} />
              ))}
            </View>
          ) : null}
          <PhotoGrid photos={[...sector.photos, ...sector.elements.flatMap((item) => item.photos)]} />
        </View>
      ) : (
        <Text className="mt-3 text-sm font-semibold text-brand">Ver detalle</Text>
      )}
    </Card>
  );
}

export default function SurveyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { discardSurvey, reopenSurvey } = useApp();
  const { survey, loading, ownerName, isOwner, project, client } = useSurveyRecord(routeParam(id));
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopening, setReopening] = useState(false);

  async function openEditor() {
    if (!survey || !isOwner) return;
    if (survey.status === 'completed') {
      setReopenOpen(true);
      return;
    }
    push(`/levantamientos/${survey.id}/editar`);
  }

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Levantamiento" />
        <View className="items-center py-16">
          <ActivityIndicator color={Colors.brand} />
          <Text className="mt-3 text-sm text-muted">Cargando levantamiento…</Text>
        </View>
      </Screen>
    );
  }

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
        <ScreenHeader
          title={survey.code}
          right={
            isOwner ? (
              <Pressable
                onPress={() => void openEditor()}
                className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
              >
                <Pencil size={18} color={Colors.ink} />
              </Pressable>
            ) : undefined
          }
        />
        <EmptyState
          title="Este levantamiento está en borrador"
          description="Puedes retomarlo y completar la inspección."
          action={<Button label="Continuar" onPress={() => void openEditor()} />}
        />
        <View className="mt-6 pb-4">
          <Button label="Eliminar levantamiento" variant="ghost" onPress={() => setDeleteOpen(true)} />
        </View>
        <ConfirmModal
          visible={deleteOpen}
          title="¿Eliminar levantamiento?"
          message="Se borrará este registro de este dispositivo. Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          destructive
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {
            setDeleteOpen(false);
            await discardSurvey(survey.id);
            replace('/levantamientos');
          }}
        />
      </Screen>
    );
  }

  const data = survey.serviceData;

  return (
    <Screen>
      <ScreenHeader
        title={survey.code}
        right={
          isOwner ? (
            <Pressable
              onPress={() => void openEditor()}
              className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
            >
              <Pencil size={18} color={Colors.ink} />
            </Pressable>
          ) : undefined
        }
      />

      <Card>
        <View className="mb-3">
          <SurveyStatusBadge status={survey.status} />
        </View>
        <Text className="text-2xl font-bold text-ink">{survey.code}</Text>
        <Text className="mt-1 text-base text-muted">{project?.name}</Text>
        <View className="mt-3">
          <ServiceMark type={survey.serviceType} size="md" />
        </View>
        <Text className="mt-3 text-sm leading-5 text-muted">{surveyHeadline(survey)}</Text>
      </Card>

      <View className="mt-6 gap-3">
        <SectionHeader title="Resumen" />
        <Card>
          <InfoRow label="Cliente" value={client?.name} />
          <InfoRow label="Proyecto" value={project?.name} />
          <InfoRow label="Técnico" value={ownerName} />
          <InfoRow label="Fecha" value={formatDate(survey.startedAt)} />
          <InfoRow label="Hora inicio" value={formatTime(survey.startedAt)} />
          <InfoRow label="Hora finalización" value={survey.completedAt ? formatTime(survey.completedAt) : '—'} />
          <InfoRow label="Alcance" value={survey.scope ? SCOPE_LABELS[survey.scope] : '—'} />
        </Card>
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Condición del servicio" />
        <Card>
          <View className="border-b border-line py-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted">Estado</Text>
            <View className="mt-2">
              {survey.overallCondition ? <ConditionBadge condition={survey.overallCondition} /> : <Text>—</Text>}
            </View>
          </View>
          {data.type === 'epoxy' || data.type === 'pu_cement' ? (
            <>
              <InfoRow label="Superficie" value={data.surfaceKind ? FLOOR_SURFACE_LABELS[data.surfaceKind] : '—'} />
              <InfoRow label="Sustrato" value={data.substrate ? FLOOR_SUBSTRATE_LABELS[data.substrate] : '—'} />
              <InfoRow label="Superficie total" value={formatArea(data.totalArea)} />
              <InfoRow
                label="Revestimiento existente"
                value={
                  data.existingCoating === 'yes'
                    ? [
                        data.existingCoatingType ? EXISTING_COATING_LABELS[data.existingCoatingType] : 'Sí',
                        data.existingCoatingCondition
                          ? COATING_CONDITION_LABELS[data.existingCoatingCondition]
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : data.existingCoating
                      ? YES_NO_UNKNOWN_LABELS[data.existingCoating]
                      : '—'
                }
              />
              {data.type === 'pu_cement' ? (
                <InfoRow
                  label="Temperatura operacional"
                  value={
                    [
                      data.operatingTemp ? OPERATING_TEMP_LABELS[data.operatingTemp] : null,
                      data.approxTempC ? `${data.approxTempC} °C` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'
                  }
                />
              ) : null}
            </>
          ) : null}
          {data.type === 'roof_waterproofing' ? (
            <>
              <InfoRow label="Tipo de cubierta" value={data.roofKind ? ROOF_KIND_LABELS[data.roofKind] : '—'} />
              <InfoRow label="Superficie total" value={formatArea(data.totalArea)} />
            </>
          ) : null}
          {data.type === 'corrosion_control' ? (
            <>
              <InfoRow
                label="Protección existente"
                value={
                  data.existingProtection === 'yes'
                    ? [
                        data.protectionType ? PROTECTION_LABELS[data.protectionType] : 'Sí',
                        data.protectionCondition ? COATING_CONDITION_LABELS[data.protectionCondition] : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')
                    : data.existingProtection
                      ? YES_NO_UNKNOWN_LABELS[data.existingProtection]
                      : '—'
                }
              />
              <InfoRow label="Exposición ambiental" value={exposureList(data.exposures)} />
            </>
          ) : null}
        </Card>
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Sectores" />
        {survey.sectors.length === 0 ? (
          <EmptyState title="Sin sectores" description="Este levantamiento no registró sectores." />
        ) : (
          survey.sectors.map((item) => (
            <SectorBlock
              key={item.id}
              sector={item}
              expanded={(openId ?? survey.sectors[0]?.id) === item.id}
              onToggle={() =>
                setOpenId((current) => {
                  const selected = current ?? survey.sectors[0]?.id;
                  return selected === item.id ? '' : item.id;
                })
              }
            />
          ))
        )}
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Evidencia" />
        <PhotoGrid
          photos={collectPhotos(survey)}
          sectors={survey.sectors}
          categories={photoCategoriesForService(survey.serviceType)}
        />
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

      {survey.plantOperational || survey.accessNotes ? (
        <View className="mt-6 gap-3">
          <SectionHeader title="Condiciones de ejecución" />
          <Card>
            <InfoRow
              label="Planta operativa"
              value={survey.plantOperational ? YES_NO_LABELS[survey.plantOperational] : '—'}
            />
            <InfoRow label="Acceso" value={survey.accessNotes} />
          </Card>
        </View>
      ) : null}

      <View className="mt-8 gap-3 pb-4">
        <SurveyExportButtons
          survey={survey}
          client={client}
          project={project}
          technician={ownerName}
        />
        {isOwner ? (
          <Button label="Eliminar levantamiento" variant="ghost" onPress={() => setDeleteOpen(true)} />
        ) : null}
      </View>

      <ConfirmModal
        visible={deleteOpen}
        title="¿Eliminar levantamiento?"
        message="Se borrará este registro de este dispositivo. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false);
          await discardSurvey(survey.id);
          replace('/levantamientos');
        }}
      />
      {isOwner ? (
        <ConfirmModal
          visible={reopenOpen}
          title="¿Reabrir como borrador?"
          message="El levantamiento volverá a borrador para que puedas editarlo. Los datos actuales se mantienen."
          confirmLabel="Reabrir"
          onCancel={() => setReopenOpen(false)}
          onConfirm={async () => {
            if (reopening) return;
            setReopening(true);
            try {
              setReopenOpen(false);
              await reopenSurvey(survey.id);
              push(`/levantamientos/${survey.id}/editar`);
            } finally {
              setReopening(false);
            }
          }}
        />
      ) : null}
    </Screen>
  );
}
