import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PhotoGrid } from '@/components/PhotoGrid';
import { Button } from '@/components/ui/Button';
import { ChoiceChips, FieldLabel } from '@/components/ui/ChoiceChips';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { CardActions } from '@/components/ui/CardActions';
import { TextArea } from '@/components/ui/TextArea';
import { CONDITION_LABELS, CORROSION_LEVEL_LABELS, SEVERITY_LABELS } from '@/constants/labels';
import {
  AREA_USE_OPTIONS,
  exposuresForService,
  isFloorService,
  photoCategoriesForService,
  problemsForService,
  TRAFFIC_OPTIONS,
  usesElements,
} from '@/constants/options';
import { useAppActions } from '@/context/AppProvider';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useEditorTick } from '@/hooks/useEditorTick';
import { elementTitle } from '@/lib/display';
import { push, routeParam } from '@/lib/nav';
import type { ProblemType, Severity, SurfaceCondition, SurveySector } from '@/types';

const CONDITIONS: SurfaceCondition[] = ['good', 'regular', 'bad', 'critical'];
const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

export default function SectorEditorScreen() {
  const { id, sectorId } = useLocalSearchParams<{ id: string; sectorId: string }>();
  const { getSurvey, saveSector, removeSector, addElement, removeElement, addPhoto, updatePhoto, removePhoto } =
    useAppActions();
  const tick = useEditorTick();
  const surveyId = routeParam(id) ?? '';
  const currentSectorId = routeParam(sectorId) ?? '';
  const survey = getSurvey(surveyId);
  const sector = survey?.sectors.find((item) => item.id === currentSectorId);
  const [nameError, setNameError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { ask, modal } = useConfirmAction();

  if (!survey || !sector) {
    return (
      <Screen>
        <ScreenHeader title="Sector" />
        <EmptyState title="Sector no encontrado" description="Este sector ya no está disponible." />
      </Screen>
    );
  }

  const floor = isFloorService(survey.serviceType);
  const withElements = usesElements(survey.serviceType);

  function patch(partial: Partial<SurveySector>) {
    void saveSector(surveyId, { id: currentSectorId, ...partial });
    tick();
  }

  return (
    <Screen>
      <ScreenHeader title={sector.name.trim() || 'Nuevo sector'} subtitle={survey.code} />

      <View className="gap-6 pb-8">
        <Input
          label="Nombre del sector"
          value={sector.name}
          onChangeText={(name) => {
            setNameError('');
            patch({ name });
          }}
          placeholder={survey.serviceType === 'corrosion_control' ? 'Área bombas' : 'Área de producción'}
          error={nameError}
        />
        {survey.serviceType !== 'corrosion_control' ? (
          <Input
            label="Superficie aproximada (m²)"
            value={sector.approximateArea ? String(sector.approximateArea) : ''}
            onChangeText={(value) => {
              const parsed = Number(value.replace(',', '.'));
              patch({ approximateArea: value.trim() && !Number.isNaN(parsed) ? parsed : undefined });
            }}
            keyboardType="decimal-pad"
            placeholder="180"
          />
        ) : null}

        <View className="gap-2">
          <FieldLabel label="Estado" hint="Condición actual observada." />
          {CONDITIONS.map((item) => (
            <SelectableCard
              key={item}
              title={CONDITION_LABELS[item]}
              selected={sector.condition === item}
              onPress={() => patch({ condition: item })}
            />
          ))}
        </View>

        <View className="gap-2">
          <FieldLabel label="Criticidad" hint="Qué tan urgente es intervenir." />
          {SEVERITIES.map((item) => (
            <SelectableCard
              key={item}
              title={SEVERITY_LABELS[item]}
              selected={sector.severity === item}
              onPress={() => patch({ severity: item })}
            />
          ))}
        </View>

        {!withElements || survey.serviceType === 'roof_waterproofing' ? (
          <ChoiceChips
            label="Problemas / condiciones"
            values={sector.problems}
            options={problemsForService(survey.serviceType)}
            onChange={(problems: ProblemType[]) =>
              patch({ problems, otherProblem: problems.includes('other') ? sector.otherProblem : undefined })
            }
          />
        ) : null}

        {floor ? (
          <>
            <ChoiceChips
              label="Uso actual"
              values={sector.uses}
              options={AREA_USE_OPTIONS}
              onChange={(uses: SurveySector['uses']) => patch({ uses })}
            />
            <ChoiceChips
              label="Nivel de tránsito"
              options={TRAFFIC_OPTIONS}
              value={sector.trafficLevel}
              onChange={(trafficLevel) => patch({ trafficLevel })}
            />
            <ChoiceChips
              label="Exposición"
              values={sector.exposures}
              options={exposuresForService(survey.serviceType)}
              onChange={(exposures: SurveySector['exposures']) => patch({ exposures })}
            />
          </>
        ) : null}

        <TextArea
          label="Observación del sector"
          value={sector.observations ?? ''}
          onChangeText={(observations) => patch({ observations })}
          placeholder="Describe el estado observado en esta zona."
        />
        {floor ? (
          <TextArea
            label="Comentario técnico preliminar"
            value={sector.recommendation ?? ''}
            onChangeText={(recommendation) => patch({ recommendation })}
            placeholder="Evaluar reparación localizada antes de aplicar nuevo revestimiento."
          />
        ) : null}

        {withElements ? (
          <View className="gap-3">
            <Text className="text-lg font-semibold text-ink">
              {survey.serviceType === 'corrosion_control' ? 'Elementos inspeccionados' : 'Elementos asociados'}
            </Text>
            <Button
              label="+ Agregar elemento"
              variant="secondary"
              onPress={async () => {
                const created = await addElement(surveyId, sector.id);
                tick();
                if (created) push(`/levantamientos/${surveyId}/sector/${sector.id}/elemento/${created.id}`);
              }}
            />
            {sector.elements.length === 0 ? (
              <EmptyState
                title="Sin elementos"
                description={
                  survey.serviceType === 'corrosion_control'
                    ? 'Agrega pilares, vigas u otros elementos de este sector.'
                    : 'Puedes registrar canaletas, sellos u otros elementos de la cubierta.'
                }
              />
            ) : (
              sector.elements.map((item) => (
                <View key={item.id}>
                  <SelectableCard
                    title={elementTitle(item)}
                    description={[
                      CONDITION_LABELS[item.condition],
                      item.corrosionLevel ? `Corrosión ${CORROSION_LEVEL_LABELS[item.corrosionLevel].toLowerCase()}` : null,
                      `${item.photos.length} fotos`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    selected={false}
                    onPress={() => push(`/levantamientos/${surveyId}/sector/${sector.id}/elemento/${item.id}`)}
                  />
                  <CardActions
                    onEdit={() => push(`/levantamientos/${surveyId}/sector/${sector.id}/elemento/${item.id}`)}
                    onDelete={() =>
                      ask({
                        title: '¿Eliminar elemento?',
                        message: 'Se perderán las observaciones y fotografías de este elemento.',
                        onConfirm: async () => {
                          await removeElement(surveyId, item.id);
                          tick();
                        },
                      })
                    }
                  />
                </View>
              ))
            )}
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">Evidencia del sector</Text>
          <PhotoGrid
            photos={sector.photos}
            categories={photoCategoriesForService(survey.serviceType)}
            editable
            onAdd={(uri) =>
              void addPhoto({ surveyId, sectorId: sector.id, uri }).then(() => tick())
            }
            onUpdate={(photoId, photoPatch) => {
              void updatePhoto(surveyId, photoId, photoPatch);
              tick();
            }}
            onRemove={(photoId) => {
              void removePhoto(surveyId, photoId);
              tick();
            }}
          />
        </View>

        <Button
          label="Listo"
          onPress={() => {
            if (!sector.name.trim()) {
              setNameError('Ingresa el nombre del sector.');
              return;
            }
            router.back();
          }}
        />
        <Button label="Eliminar sector" variant="ghost" onPress={() => setDeleteOpen(true)} />
      </View>

      <ConfirmModal
        visible={deleteOpen}
        title="¿Eliminar sector?"
        message="Se perderán las observaciones, elementos y fotografías de este sector."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false);
          await removeSector(surveyId, sector.id);
          router.back();
        }}
      />
      {modal}
    </Screen>
  );
}
