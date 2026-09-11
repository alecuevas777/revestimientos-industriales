import { Text, View } from 'react-native';

type Props = {
  label: string;
  value?: string | number | null;
};

export function InfoRow({ label, value }: Props) {
  return (
    <View className="border-b border-line py-3 last:border-b-0">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</Text>
      <Text className="mt-1 text-base text-ink">{value || '—'}</Text>
    </View>
  );
}
