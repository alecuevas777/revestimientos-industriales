import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  action?: ReactNode;
};

export function SectionHeader({ title, action }: Props) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="text-[13px] font-semibold uppercase tracking-[1.4px] text-muted">{title}</Text>
      {action}
    </View>
  );
}
