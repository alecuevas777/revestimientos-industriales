import { View } from 'react-native';

import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import {
  CONTAMINATION_OPTIONS,
  JOINT_CONDITION_OPTIONS,
  MOISTURE_OPTIONS,
  YES_NO_OPTIONS,
} from '@/constants/options';
import type { ContaminationType, JointsRecord, MoistureRecord } from '@/types';

export function MoistureBlock({
  value,
  onChange,
}: {
  value?: MoistureRecord;
  onChange: (next: MoistureRecord) => void;
}) {
  const current = value ?? {};

  return (
    <View className="gap-4">
      <ChoiceChips
        label="¿Se observa humedad?"
        options={MOISTURE_OPTIONS}
        value={current.observed}
        onChange={(observed) => onChange({ ...current, observed })}
      />
      {current.observed === 'yes' ? (
        <TextArea
          label="Observación de humedad"
          value={current.notes ?? ''}
          onChangeText={(notes) => onChange({ ...current, notes })}
          placeholder="Humedad localizada cercana a acceso lateral."
        />
      ) : null}
      {current.observed === 'yes' ? (
        <ChoiceChips
          label="¿Se realizó medición?"
          options={YES_NO_OPTIONS}
          value={current.measured}
          onChange={(measured) => onChange({ ...current, measured })}
        />
      ) : null}
      {current.observed === 'yes' && current.measured === 'yes' ? (
        <View className="gap-3">
          <Input
            label="Método"
            value={current.method ?? ''}
            onChangeText={(method) => onChange({ ...current, method })}
            placeholder="Higrómetro de superficie"
          />
          <Input
            label="Resultado"
            value={current.result ?? ''}
            onChangeText={(result) => onChange({ ...current, result })}
            placeholder="4.8"
          />
          <Input
            label="Unidad"
            value={current.unit ?? ''}
            onChangeText={(unit) => onChange({ ...current, unit })}
            placeholder="% HR"
          />
        </View>
      ) : null}
    </View>
  );
}

export function ContaminationBlock({
  values,
  none,
  other,
  onChange,
}: {
  values: ContaminationType[];
  none?: boolean;
  other?: string;
  onChange: (next: { values: ContaminationType[]; none?: boolean; other?: string }) => void;
}) {
  return (
    <View className="gap-3">
      <ChoiceChips
        label="Condiciones de contaminación"
        hint="Marca lo observado o indica que no hay contaminación relevante."
        options={[{ value: 'none' as const, label: 'No se observa contaminación relevante' }]}
        value={none ? 'none' : undefined}
        onChange={() => onChange({ values: [], none: !none, other: undefined })}
      />
      {none ? null : (
        <ChoiceChips
          values={values}
          options={CONTAMINATION_OPTIONS}
          onChange={(next: ContaminationType[]) =>
            onChange({ values: next, none: false, other: next.includes('other') ? other : undefined })
          }
        />
      )}
      {!none && values.includes('other') ? (
        <TextArea
          label="Describe la contaminación"
          value={other ?? ''}
          onChangeText={(text) => onChange({ values, none, other: text })}
          placeholder="Residuo oleoso junto a línea de llenado."
        />
      ) : null}
    </View>
  );
}

export function JointsBlock({
  value,
  onChange,
}: {
  value?: JointsRecord;
  onChange: (next: JointsRecord) => void;
}) {
  const current = value ?? {};

  return (
    <View className="gap-4">
      <ChoiceChips
        label="¿Existen fisuras?"
        options={YES_NO_OPTIONS}
        value={current.hasCracks}
        onChange={(hasCracks) => onChange({ ...current, hasCracks })}
      />
      <ChoiceChips
        label="¿Existen juntas?"
        options={YES_NO_OPTIONS}
        value={current.hasJoints}
        onChange={(hasJoints) => onChange({ ...current, hasJoints })}
      />
      {current.hasJoints === 'yes' ? (
        <ChoiceChips
          label="Estado de juntas"
          options={JOINT_CONDITION_OPTIONS}
          value={current.jointCondition}
          onChange={(jointCondition) => onChange({ ...current, jointCondition })}
        />
      ) : null}
    </View>
  );
}
