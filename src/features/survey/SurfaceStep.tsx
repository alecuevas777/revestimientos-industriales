import { Text, View } from 'react-native';

import { ChoiceChips, FieldLabel } from '@/components/ui/ChoiceChips';
import { Input } from '@/components/ui/Input';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { SCOPE_HINTS, SCOPE_LABELS, SURFACE_TYPE_LABELS } from '@/constants/labels';
import {
  COATING_CONDITION_OPTIONS,
  EXISTING_COATING_OPTIONS,
  substratesForSurface,
  YES_NO_UNKNOWN_OPTIONS,
} from '@/constants/options';
import type { SurfaceType, Survey, SurveyScope } from '@/types';

const SURFACES: SurfaceType[] = ['floor', 'roof'];
const SCOPES: SurveyScope[] = ['complete', 'sectors', 'critical_points'];

type Props = {
  survey: Survey;
  errors?: Partial<Record<'surfaceType' | 'totalArea' | 'scope', string>>;
  onChange: (patch: Partial<Survey>) => void;
};

export function SurfaceStep({ survey, errors, onChange }: Props) {
  return (
    <View className="gap-5">
      <View className="gap-2">
        <FieldLabel label="Tipo de superficie" />
        {errors?.surfaceType ? <Text className="text-sm text-danger">{errors.surfaceType}</Text> : null}
        {SURFACES.map((item) => (
          <SelectableCard
            key={item}
            title={SURFACE_TYPE_LABELS[item]}
            selected={survey.surfaceType === item}
            onPress={() =>
              onChange({
                surfaceType: item,
                substrateType: undefined,
                otherSubstrate: undefined,
              })
            }
          />
        ))}
      </View>

      <Input
        label="Superficie total aproximada (m²)"
        value={survey.totalArea ? String(survey.totalArea) : ''}
        onChangeText={(value) => {
          const parsed = Number(value.replace(',', '.'));
          onChange({ totalArea: value.trim() && !Number.isNaN(parsed) ? parsed : undefined });
        }}
        keyboardType="decimal-pad"
        placeholder="1250"
        error={errors?.totalArea}
      />

      <View className="gap-2">
        <FieldLabel label="Alcance" />
        {errors?.scope ? <Text className="text-sm text-danger">{errors.scope}</Text> : null}
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

      {survey.surfaceType ? (
        <View className="gap-3">
          <ChoiceChips
            label="Tipo de sustrato"
            options={substratesForSurface(survey.surfaceType)}
            value={survey.substrateType}
            onChange={(substrateType) =>
              onChange({
                substrateType,
                otherSubstrate: substrateType === 'other' ? survey.otherSubstrate : undefined,
              })
            }
          />
          {survey.substrateType === 'other' ? (
            <Input
              label="Describe el sustrato"
              value={survey.otherSubstrate ?? ''}
              onChangeText={(otherSubstrate) => onChange({ otherSubstrate })}
              placeholder="Ej. losa con regularización antigua"
            />
          ) : null}
        </View>
      ) : null}

      <ChoiceChips
        label="¿Existe actualmente algún revestimiento?"
        options={YES_NO_UNKNOWN_OPTIONS}
        value={survey.existingCoating}
        onChange={(existingCoating) =>
          onChange({
            existingCoating,
            existingCoatingType: existingCoating === 'yes' ? survey.existingCoatingType : undefined,
            existingCoatingCondition: existingCoating === 'yes' ? survey.existingCoatingCondition : undefined,
            otherExistingCoating: existingCoating === 'yes' ? survey.otherExistingCoating : undefined,
          })
        }
      />

      {survey.existingCoating === 'yes' ? (
        <View className="gap-4">
          <ChoiceChips
            label="Tipo de revestimiento existente"
            options={EXISTING_COATING_OPTIONS}
            value={survey.existingCoatingType}
            onChange={(existingCoatingType) =>
              onChange({
                existingCoatingType,
                otherExistingCoating: existingCoatingType === 'other' ? survey.otherExistingCoating : undefined,
              })
            }
          />
          {survey.existingCoatingType === 'other' ? (
            <Input
              label="Describe el revestimiento"
              value={survey.otherExistingCoating ?? ''}
              onChangeText={(otherExistingCoating) => onChange({ otherExistingCoating })}
              placeholder="Ej. sistema epóxico antiguo sin ficha"
            />
          ) : null}
          <ChoiceChips
            label="Estado del revestimiento"
            options={COATING_CONDITION_OPTIONS}
            value={survey.existingCoatingCondition}
            onChange={(existingCoatingCondition) => onChange({ existingCoatingCondition })}
          />
        </View>
      ) : null}
    </View>
  );
}
