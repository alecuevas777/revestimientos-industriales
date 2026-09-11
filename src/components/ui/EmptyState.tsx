import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-line bg-white px-6 py-10">
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-muted">{description}</Text>
      {action ? <View className="mt-5 w-full">{action}</View> : null}
    </View>
  );
}
