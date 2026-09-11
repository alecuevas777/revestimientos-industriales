import { Text, View } from 'react-native';

import { ChoiceChips, FieldLabel } from '@/components/ui/ChoiceChips';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { CONDITION_LABELS } from '@/constants/labels';
import { AREA_USE_OPTIONS, EXPOSURE_OPTIONS, TRAFFIC_OPTIONS } from '@/constants/options';
import { ContaminationBlock, JointsBlock, MoistureBlock } from '@/features/survey/FieldBlocks';
import type { ExposureType, SurfaceCondition, Survey } from '@/types';

const CONDITIONS: SurfaceCondition[] = ['good', 'regular', 'bad', 'critical'];

type Props = {
  survey: Survey;
  error?: string;
  onChange: (patch: Partial<Survey>) => void;
};

export function ConditionsStep({ survey, error, onChange }: Props) {
  function toggleExposures(next: ExposureType[]) {
    if (next.includes('none') && !survey.exposures.includes('none')) {
      onChange({ exposures: ['none'] });
      return;
    }
    onChange({ exposures: next.filter((item) => item !== 'none') });
  }

  return (
    <View className="gap-6">
      <View className="gap-2">
        <FieldLabel label="Estado general" hint="Condición actual de la superficie, no la urgencia." />
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}
        {CONDITIONS.map((item) => (
          <SelectableCard
            key={item}
            title={CONDITION_LABELS[item]}
            selected={survey.overallCondition === item}
            onPress={() => onChange({ overallCondition: item })}
          />
        ))}
      </View>

      <MoistureBlock value={survey.moisture} onChange={(moisture) => onChange({ moisture })} />

      <ContaminationBlock
        values={survey.contaminations}
        none={survey.noRelevantContamination}
        other={survey.otherContamination}
        onChange={({ values, none, other }) =>
          onChange({ contaminations: values, noRelevantContamination: none, otherContamination: other })
        }
      />

      <JointsBlock value={survey.joints} onChange={(joints) => onChange({ joints })} />

      {survey.scope === 'complete' ? (
        <View className="gap-4">
          <ChoiceChips
            label="Uso actual del área"
            values={survey.uses}
            options={AREA_USE_OPTIONS}
            onChange={(uses: Survey['uses']) =>
              onChange({ uses, otherUse: uses.includes('other') ? survey.otherUse : undefined })
            }
          />
          <ChoiceChips
            label="Nivel de tránsito"
            options={TRAFFIC_OPTIONS}
            value={survey.trafficLevel}
            onChange={(trafficLevel) => onChange({ trafficLevel })}
          />
          <ChoiceChips
            label="Condiciones de exposición"
            values={survey.exposures}
            options={EXPOSURE_OPTIONS}
            onChange={toggleExposures}
          />
        </View>
      ) : null}
    </View>
  );
}
