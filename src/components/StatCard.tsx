import { Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
};

export function StatCard({ label, value }: Props) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-line bg-white px-4 py-3.5">
      <View className="mb-2 h-0.5 w-8 rounded-full bg-brand" />
      <Text className="text-[28px] font-bold tracking-tight text-ink">{value}</Text>
      <Text className="mt-1 text-[12px] font-medium leading-4 text-muted">{label}</Text>
    </View>
  );
}
