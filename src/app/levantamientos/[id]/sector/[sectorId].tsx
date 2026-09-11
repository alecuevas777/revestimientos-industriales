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
import { TextArea } from '@/components/ui/TextArea';
import { CONDITION_LABELS, SEVERITY_LABELS } from '@/constants/labels';
import { AREA_USE_OPTIONS, EXPOSURE_OPTIONS, problemsForSurface, TRAFFIC_OPTIONS } from '@/constants/options';
import { useApp } from '@/context/AppProvider';
import { ContaminationBlock, JointsBlock, MoistureBlock } from '@/features/survey/FieldBlocks';
import { routeParam } from '@/lib/nav';
import type { ExposureType, ProblemType, Severity, SurfaceCondition, SurveySector } from '@/types';

const CONDITIONS: SurfaceCondition[] = ['good', 'regular', 'bad', 'critical'];
const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

export default function SectorEditorScreen() {
  const { id, sectorId } = useLocalSearchParams<{ id: string; sectorId: string }>();
  const { getSurvey, saveSector, removeSector, addPhoto, updatePhoto, removePhoto } = useApp();
  const surveyId = routeParam(id) ?? '';
  const currentSectorId = routeParam(sectorId) ?? '';
  const survey = getSurvey(surveyId);
  const sector = survey?.sectors.find((item) => item.id === currentSectorId);
  const [nameError, setNameError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!survey || !sector) {
    return (
      <Screen>
        <ScreenHeader title="Sector" />
        <EmptyState title="Sector no encontrado" description="Este sector ya no está disponible." />
      </Screen>
    );
  }

  const current = sector;

  function patch(partial: Partial<SurveySector>) {
    void saveSector(surveyId, { ...current, ...partial });
  }

  function toggleExposures(next: ExposureType[]) {
    if (next.includes('none') && !current.exposures.includes('none')) {
      patch({ exposures: ['none'] });
      return;
    }
    patch({ exposures: next.filter((item) => item !== 'none') });
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
          placeholder="Área de producción"
          error={nameError}
        />
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

        <View className="gap-2">
          <FieldLabel label="Estado de la superficie" hint="Condición actual observada." />
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
          <FieldLabel label="Nivel de criticidad" hint="Qué tan urgente es intervenir o revisar." />
          {SEVERITIES.map((item) => (
            <SelectableCard
              key={item}
              title={SEVERITY_LABELS[item]}
              selected={sector.severity === item}
              onPress={() => patch({ severity: item })}
            />
          ))}
        </View>

        <ChoiceChips
          label="Problemas / condiciones"
          values={sector.problems}
          options={problemsForSurface(survey.surfaceType)}
          onChange={(problems: ProblemType[]) =>
            patch({
              problems,
              otherProblem: problems.includes('other') ? current.otherProblem : undefined,
            })
          }
        />
        {sector.problems.includes('other') ? (
          <TextArea
            label="Describe el problema"
            value={sector.otherProblem ?? ''}
            onChangeText={(otherProblem) => patch({ otherProblem })}
            placeholder="Describe la condición observada..."
          />
        ) : null}

        <MoistureBlock value={sector.moisture} onChange={(moisture) => patch({ moisture })} />

        <ContaminationBlock
          values={sector.contaminations}
          none={sector.noRelevantContamination}
          other={sector.otherContamination}
          onChange={({ values, none, other }) =>
            patch({ contaminations: values, noRelevantContamination: none, otherContamination: other })
          }
        />

        <JointsBlock value={sector.joints} onChange={(joints) => patch({ joints })} />

        <ChoiceChips
          label="Uso actual del área"
          values={sector.uses}
          options={AREA_USE_OPTIONS}
          onChange={(uses: SurveySector['uses']) =>
            patch({ uses, otherUse: uses.includes('other') ? current.otherUse : undefined })
          }
        />
        {sector.uses.includes('other') ? (
          <Input
            label="Otro uso"
            value={sector.otherUse ?? ''}
            onChangeText={(otherUse) => patch({ otherUse })}
            placeholder="Ej. zona de cuarentena"
          />
        ) : null}

        <ChoiceChips
          label="Nivel de tránsito"
          options={TRAFFIC_OPTIONS}
          value={sector.trafficLevel}
          onChange={(trafficLevel) => patch({ trafficLevel })}
        />

        <ChoiceChips
          label="Condiciones de exposición"
          values={sector.exposures}
          options={EXPOSURE_OPTIONS}
          onChange={toggleExposures}
        />

        <TextArea
          label="Observación del sector"
          value={sector.observations ?? ''}
          onChangeText={(observations) => patch({ observations })}
          placeholder="Describe el estado observado y la ubicación del hallazgo."
        />
        <TextArea
          label="Comentario técnico preliminar"
          value={sector.recommendation ?? ''}
          onChangeText={(recommendation) => patch({ recommendation })}
          placeholder="Evaluar reparación localizada y preparación mecánica antes de aplicar nuevo revestimiento."
        />

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">Evidencia fotográfica</Text>
          <PhotoGrid
            photos={sector.photos}
            editable
            onAdd={(uri) => void addPhoto({ surveyId, sectorId: sector.id, uri })}
            onUpdate={(photoId, photoPatch) => void updatePhoto(surveyId, photoId, photoPatch)}
            onRemove={(photoId) => void removePhoto(surveyId, photoId)}
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
        message="Se perderán las observaciones y fotografías de este sector."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false);
          await removeSector(surveyId, sector.id);
          router.back();
        }}
      />
    </Screen>
  );
}
