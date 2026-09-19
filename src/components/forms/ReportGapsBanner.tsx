import { Text, View } from 'react-native';

type Props = {
  missing: string[];
  hint?: string;
};

export function ReportGapsBanner({ missing, hint }: Props) {
  if (missing.length === 0) return null;
  return (
    <View className="rounded-2xl bg-warning-light px-4 py-3">
      <Text className="text-sm font-semibold text-warning">Faltan datos para el informe PDF</Text>
      <Text className="mt-1 text-sm leading-5 text-ink">{missing.join(', ')}.</Text>
      <Text className="mt-1 text-sm leading-5 text-muted">
        {hint ?? 'Puedes completarlos ahora o más adelante. No bloquean el levantamiento.'}
      </Text>
    </View>
  );
}
