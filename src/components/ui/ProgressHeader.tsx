import { Text, View } from 'react-native';

import { WIZARD_STEPS } from '@/constants/labels';

type Props = {
  step: number;
  savedLabel?: string;
};

export function ProgressHeader({ step, savedLabel }: Props) {
  const current = WIZARD_STEPS[step];
  const progress = ((step + 1) / WIZARD_STEPS.length) * 100;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-brand">
          Paso {step + 1} de {WIZARD_STEPS.length} · {current.title}
        </Text>
        {savedLabel ? <Text className="text-xs text-muted">{savedLabel}</Text> : null}
      </View>
      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <View className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
      </View>
    </View>
  );
}
