import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { MenuButton } from '@/components/ui/MenuButton';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { APP_NAME, BrandImages } from '@/constants/brand';

export function TabBrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-5">
      <View className="flex-row items-center">
        <View className="w-11 items-start">
          <MenuButton />
        </View>
        <View className="min-w-0 flex-1 flex-row items-center justify-center gap-2">
          <View className="h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-ink">
            <Image
              accessibilityLabel={APP_NAME}
              source={BrandImages.mark}
              style={{ width: 22, height: 20 }}
              contentFit="contain"
            />
          </View>
          <Text className="text-[18px] font-extrabold tracking-tight text-brand">{APP_NAME}</Text>
        </View>
        <View className="w-11 items-end">
          <ProfileButton />
        </View>
      </View>
      <Text className="mt-5 text-[28px] font-bold leading-8 text-ink">{title}</Text>
      <Text className="mt-1 text-[15px] leading-5 text-muted">{subtitle}</Text>
    </View>
  );
}
