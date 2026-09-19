import { Text, View } from 'react-native';

import { ChoiceChips, FieldLabel } from '@/components/ui/ChoiceChips';
import { Input } from '@/components/ui/Input';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { CONDITION_LABELS, SCOPE_HINTS, SCOPE_LABELS } from '@/constants/labels';
import {
  AREA_USE_OPTIONS,
  COATING_CONDITION_OPTIONS,
  CORROSION_EXPOSURE_OPTIONS,
  EPOXY_EXPOSURE_OPTIONS,
  EPOXY_SUBSTRATE_OPTIONS,
  EXISTING_COATING_OPTIONS,
  FLOOR_PROBLEM_OPTIONS,
  FLOOR_SURFACE_OPTIONS,
  OPERATING_TEMP_OPTIONS,
  PROTECTION_OPTIONS,
  PU_EXPOSURE_OPTIONS,
  PU_SUBSTRATE_OPTIONS,
  ROOF_KIND_OPTIONS,
  ROOF_PROBLEM_OPTIONS,
  YES_NO_UNKNOWN_OPTIONS,
} from '@/constants/options';
import { patchServiceData } from '@/lib/service';
import type {
  CorrosionServiceData,
  FloorServiceData,
  RoofServiceData,
  SurfaceCondition,
  Survey,
  SurveyScope,
} from '@/types';

const SCOPES: SurveyScope[] = ['complete', 'sectors', 'critical_points'];
const CONDITIONS: SurfaceCondition[] = ['good', 'regular', 'bad', 'critical'];

type Props = {
  survey: Survey;
  errors?: string[];
  onChange: (patch: Partial<Survey>) => void;
};

export function ServiceConditionsStep({ survey, errors, onChange }: Props) {
  function patchData(patch: Partial<Survey['serviceData']>) {
    onChange({ serviceData: patchServiceData(survey, patch) });
  }

  return (
    <View className="gap-6">
      {errors?.length ? (
        <View className="rounded-2xl bg-danger-light px-4 py-3">
          {errors.map((error) => (
            <Text key={error} className="text-sm text-danger">
              {error}
            </Text>
          ))}
        </View>
      ) : null}

      <View className="gap-2">
        <FieldLabel label="Alcance" />
        {SCOPES.map((item) => (
          <SelectableCard
            key={item}
            title={SCOPE_LABELS[item]}
            description={SCOPE_HINTS[item]}
            selected={survey.scope === item}
            onPress={() => onChange({ scope: item })}
          />
        ))}
      </View>

      <View className="gap-2">
        <FieldLabel label="Estado general" hint="Condición actual observada, no la urgencia." />
        {CONDITIONS.map((item) => (
          <SelectableCard
            key={item}
            title={CONDITION_LABELS[item]}
            selected={survey.overallCondition === item}
            onPress={() => onChange({ overallCondition: item })}
          />
        ))}
      </View>

      {survey.serviceData.type === 'epoxy' || survey.serviceData.type === 'pu_cement' ? (
        <FloorFields data={survey.serviceData} onPatch={patchData} />
      ) : null}
      {survey.serviceData.type === 'roof_waterproofing' ? (
        <RoofFields data={survey.serviceData} onPatch={patchData} />
      ) : null}
      {survey.serviceData.type === 'corrosion_control' ? (
        <CorrosionFields data={survey.serviceData} onPatch={patchData} />
      ) : null}
    </View>
  );
}

function FloorFields({
  data,
  onPatch,
}: {
  data: FloorServiceData;
  onPatch: (patch: Partial<FloorServiceData>) => void;
}) {
  const pu = data.type === 'pu_cement';

  return (
    <View className="gap-5">
      <ChoiceChips
        label="Tipo de superficie"
        options={FLOOR_SURFACE_OPTIONS}
        value={data.surfaceKind}
        onChange={(surfaceKind) => onPatch({ surfaceKind })}
      />
      {data.surfaceKind === 'other' ? (
        <Input
          label="Describe la superficie"
          value={data.otherSurfaceKind ?? ''}
          onChangeText={(otherSurfaceKind) => onPatch({ otherSurfaceKind })}
          placeholder="Ej. canaleta de proceso"
        />
      ) : null}
      <ChoiceChips
        label="Sustrato"
        options={pu ? PU_SUBSTRATE_OPTIONS : EPOXY_SUBSTRATE_OPTIONS}
        value={data.substrate}
        onChange={(substrate) => onPatch({ substrate })}
      />
      <Input
        label="Superficie total aproximada (m²)"
        hint="Del piso o recinto que se inspecciona en esta visita. No es el área de cada sector."
        value={data.totalArea ? String(data.totalArea) : ''}
        onChangeText={(value) => {
          const parsed = Number(value.replace(',', '.'));
          onPatch({ totalArea: value.trim() && !Number.isNaN(parsed) ? parsed : undefined });
        }}
        keyboardType="decimal-pad"
        placeholder={pu ? '650' : '1250'}
      />
      <ChoiceChips
        label="¿Existe revestimiento actualmente?"
        options={YES_NO_UNKNOWN_OPTIONS}
        value={data.existingCoating}
        onChange={(existingCoating) => onPatch({ existingCoating })}
      />
      {data.existingCoating === 'yes' ? (
        <View className="gap-4">
          <ChoiceChips
            label="Tipo de revestimiento"
            options={EXISTING_COATING_OPTIONS}
            value={data.existingCoatingType}
            onChange={(existingCoatingType) => onPatch({ existingCoatingType })}
          />
          <ChoiceChips
            label="Estado del revestimiento"
            options={COATING_CONDITION_OPTIONS}
            value={data.existingCoatingCondition}
            onChange={(existingCoatingCondition) => onPatch({ existingCoatingCondition })}
          />
        </View>
      ) : null}
      <ChoiceChips
        label="Problemas"
        values={data.problems}
        options={FLOOR_PROBLEM_OPTIONS}
        onChange={(problems: FloorServiceData['problems']) => onPatch({ problems })}
      />
      <ChoiceChips
        label="Uso actual"
        values={data.uses}
        options={AREA_USE_OPTIONS}
        onChange={(uses: FloorServiceData['uses']) => onPatch({ uses })}
      />
      <ChoiceChips
        label="Exposición"
        values={data.exposures}
        options={pu ? PU_EXPOSURE_OPTIONS : EPOXY_EXPOSURE_OPTIONS}
        onChange={(exposures: FloorServiceData['exposures']) => onPatch({ exposures })}
      />
      {pu ? (
        <View className="gap-4">
          <ChoiceChips
            label="Temperatura operacional"
            options={OPERATING_TEMP_OPTIONS}
            value={data.operatingTemp}
            onChange={(operatingTemp) => onPatch({ operatingTemp })}
          />
          <Input
            label="Temperatura aproximada (°C)"
            value={data.approxTempC ? String(data.approxTempC) : ''}
            onChangeText={(value) => {
              const parsed = Number(value.replace(',', '.'));
              onPatch({ approxTempC: value.trim() && !Number.isNaN(parsed) ? parsed : undefined });
            }}
            keyboardType="decimal-pad"
            placeholder="42"
          />
        </View>
      ) : null}
    </View>
  );
}

function RoofFields({
  data,
  onPatch,
}: {
  data: RoofServiceData;
  onPatch: (patch: Partial<RoofServiceData>) => void;
}) {
  return (
    <View className="gap-5">
      <ChoiceChips
        label="Tipo de cubierta"
        options={ROOF_KIND_OPTIONS}
        value={data.roofKind}
        onChange={(roofKind) => onPatch({ roofKind })}
      />
      <Input
        label="Superficie total aproximada (m²)"
        hint="De la cubierta que se inspecciona en esta visita. El desglose por zona va en cada sector."
        value={data.totalArea ? String(data.totalArea) : ''}
        onChangeText={(value) => {
          const parsed = Number(value.replace(',', '.'));
          onPatch({ totalArea: value.trim() && !Number.isNaN(parsed) ? parsed : undefined });
        }}
        keyboardType="decimal-pad"
        placeholder="2800"
      />
      <ChoiceChips
        label="Problemas"
        values={data.problems}
        options={ROOF_PROBLEM_OPTIONS}
        onChange={(problems: RoofServiceData['problems']) => onPatch({ problems })}
      />
    </View>
  );
}

function CorrosionFields({
  data,
  onPatch,
}: {
  data: CorrosionServiceData;
  onPatch: (patch: Partial<CorrosionServiceData>) => void;
}) {
  return (
    <View className="gap-5">
      <ChoiceChips
        label="¿Existe sistema de protección?"
        options={YES_NO_UNKNOWN_OPTIONS}
        value={data.existingProtection}
        onChange={(existingProtection) => onPatch({ existingProtection })}
      />
      {data.existingProtection === 'yes' ? (
        <View className="gap-4">
          <ChoiceChips
            label="Tipo de protección"
            options={PROTECTION_OPTIONS}
            value={data.protectionType}
            onChange={(protectionType) => onPatch({ protectionType })}
          />
          <ChoiceChips
            label="Estado del recubrimiento"
            options={COATING_CONDITION_OPTIONS}
            value={data.protectionCondition}
            onChange={(protectionCondition) => onPatch({ protectionCondition })}
          />
        </View>
      ) : null}
      <ChoiceChips
        label="Exposición ambiental"
        hint="Solo registro de condiciones observadas."
        values={data.exposures}
        options={CORROSION_EXPOSURE_OPTIONS}
        onChange={(exposures: CorrosionServiceData['exposures']) => onPatch({ exposures })}
      />
    </View>
  );
}
