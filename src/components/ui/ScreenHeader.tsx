import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, back = true, right }: Props) {
  return (
    <View className="mb-5 flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-start gap-2">
        {back ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="-ml-2 h-11 w-11 items-center justify-center rounded-full active:bg-line"
          >
            <ChevronLeft size={26} color={Colors.ink} />
          </Pressable>
        ) : null}
        <View className={`min-w-0 flex-1 ${back ? 'pt-1.5' : 'pt-0.5'}`}>
          <Text className="text-2xl font-bold leading-8 text-ink">{title}</Text>
          {subtitle ? <Text className="mt-1 text-[15px] leading-5 text-muted">{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}
