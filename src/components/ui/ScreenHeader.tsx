import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { MenuButton } from '@/components/ui/MenuButton';
import { QuietPressable } from '@/components/ui/QuietPressable';
import { APP_NAME_FULL, BrandImages } from '@/constants/brand';
import { Colors } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, back = true, right }: Props) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center">
        <View className="min-w-[84px] flex-row items-center">
          <MenuButton />
          {back ? (
            <QuietPressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={() => router.back()}
              style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}
            >
              <ChevronLeft size={24} color={Colors.ink} />
            </QuietPressable>
          ) : null}
        </View>
        <View className="flex-1 items-center">
          <Image
            accessibilityLabel={APP_NAME_FULL}
            source={BrandImages.logoBlack}
            style={{ width: 148, height: 64 }}
            contentFit="contain"
          />
        </View>
        <View className="min-w-[84px] items-end">
          {right ? <View className="flex-row items-center">{right}</View> : null}
        </View>
      </View>
      <View className="mt-4">
        <Text className="text-[26px] font-bold leading-8 text-ink">{title}</Text>
        {subtitle ? <Text className="mt-1 text-[15px] leading-5 text-muted">{subtitle}</Text> : null}
      </View>
    </View>
  );
}
