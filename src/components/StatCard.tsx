import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';

type Props = {
  label: string;
  value: number;
};

export function StatCard({ label, value }: Props) {
  return (
    <Card className="flex-1">
      <Text className="text-3xl font-bold text-ink">{value}</Text>
      <Text className="mt-1 text-sm text-muted">{label}</Text>
    </Card>
  );
}
