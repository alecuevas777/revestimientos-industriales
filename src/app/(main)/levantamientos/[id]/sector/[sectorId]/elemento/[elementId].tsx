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
import {
  CORROSION_LEVEL_OPTIONS,
  CORROSION_PROBLEM_OPTIONS,
  elementsForService,
  MATERIAL_OPTIONS,
  photoCategoriesForService,
  ROOF_PROBLEM_OPTIONS,
} from '@/constants/options';
import { exposuresForService } from '@/constants/options';
import { useAppActions } from '@/context/AppProvider';
import { elementTitle } from '@/lib/display';
import { routeParam } from '@/lib/nav';
import { useEditorTick } from '@/hooks/useEditorTick';
import type { ProblemType, Severity, SurfaceCondition, SurveyElement } from '@/types';

const CONDITIONS: SurfaceCondition[] = ['good', 'regular', 'bad', 'critical'];
const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical'];

export default function ElementEditorScreen() {
  const { id, sectorId, elementId } = useLocalSearchParams<{
    id: string;
    sectorId: string;
    elementId: string;
  }>();
  const { getSurvey, saveElement, removeElement, addPhoto, updatePhoto, removePhoto } = useAppActions();
  const tick = useEditorTick();
  const surveyId = routeParam(id) ?? '';
  const currentSectorId = routeParam(sectorId) ?? '';
  const currentElementId = routeParam(elementId) ?? '';
  const survey = getSurvey(surveyId);
  const sector = survey?.sectors.find((item) => item.id === currentSectorId);
  const element = sector?.elements.find((item) => item.id === currentElementId);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!survey || !sector || !element) {
    return (
      <Screen>
        <ScreenHeader title="Elemento" />
        <EmptyState title="Elemento no encontrado" description="Este registro ya no está disponible." />
      </Screen>
    );
  }

  const corrosion = survey.serviceType === 'corrosion_control';

  function patch(partial: Partial<SurveyElement>) {
    void saveElement(surveyId, { id: currentElementId, ...partial });
    tick();
  }

  return (
    <Screen>
      <ScreenHeader title={elementTitle(element)} subtitle={sector.name || survey.code} />

      <View className="gap-6 pb-8">
        <ChoiceChips
          label={corrosion ? 'Tipo de elemento' : 'Elemento asociado'}
          required={corrosion}
          options={elementsForService(survey.serviceType)}
          value={element.elementType}
          onChange={(elementType) => patch({ elementType })}
        />
        <Input
          label="Referencia"
          value={element.reference ?? ''}
          onChangeText={(reference) => patch({ reference })}
          placeholder={corrosion ? 'P-04' : 'Canaleta central'}
        />
        {corrosion ? (
          <ChoiceChips
            label="Material"
            options={MATERIAL_OPTIONS}
            value={element.material}
            onChange={(material) => patch({ material })}
          />
        ) : null}

        <View className="gap-2">
          <FieldLabel label="Estado" />
          {CONDITIONS.map((item) => (
            <SelectableCard
              key={item}
              title={CONDITION_LABELS[item]}
              selected={element.condition === item}
              onPress={() => patch({ condition: item })}
            />
          ))}
        </View>

        {corrosion ? (
          <ChoiceChips
            label="Nivel visual de corrosión"
            hint="Clasificación de terreno. No calcula pérdida de espesor."
            options={CORROSION_LEVEL_OPTIONS}
            value={element.corrosionLevel}
            onChange={(corrosionLevel) => patch({ corrosionLevel })}
          />
        ) : null}

        <View className="gap-2">
          <FieldLabel label="Criticidad" />
          {SEVERITIES.map((item) => (
            <SelectableCard
              key={item}
              title={SEVERITY_LABELS[item]}
              selected={element.severity === item}
              onPress={() => patch({ severity: item })}
            />
          ))}
        </View>

        <ChoiceChips
          label="Condiciones observadas"
          values={element.problems}
          options={corrosion ? CORROSION_PROBLEM_OPTIONS : ROOF_PROBLEM_OPTIONS}
          onChange={(problems: ProblemType[]) => patch({ problems })}
        />
        <ChoiceChips
          label="Exposición"
          values={element.exposures}
          options={exposuresForService(survey.serviceType)}
          onChange={(exposures: SurveyElement['exposures']) => patch({ exposures })}
        />
        <TextArea
          label="Observación"
          value={element.observations ?? ''}
          onChangeText={(observations) => patch({ observations })}
          placeholder="Describe el hallazgo y su ubicación."
        />

        <View className="gap-3">
          <Text className="text-lg font-semibold text-ink">Fotografías</Text>
          <PhotoGrid
            photos={element.photos}
            categories={photoCategoriesForService(survey.serviceType)}
            editable
            onAdd={async (uri) => {
              const photo = await addPhoto({ surveyId, sectorId: sector.id, elementId: element.id, uri });
              tick();
              return photo;
            }}
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

        <Button label="Listo" onPress={() => router.back()} />
        <Button label="Eliminar elemento" variant="ghost" onPress={() => setDeleteOpen(true)} />
      </View>

      <ConfirmModal
        visible={deleteOpen}
        title="¿Eliminar elemento?"
        message="Se perderán las observaciones y fotografías de este elemento."
        confirmLabel="Eliminar"
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false);
          await removeElement(surveyId, element.id);
          router.back();
        }}
      />
    </Screen>
  );
}
