import { Image } from 'expo-image';
import { View } from 'react-native';

import { APP_NAME, APP_NAME_FULL, BrandImages } from '@/constants/brand';

type Props = {
  variant?: 'logo' | 'mark';
  height?: number;
};

export function BrandMark({ variant = 'logo', height = 80 }: Props) {
  const source = variant === 'logo' ? BrandImages.logo : BrandImages.mark;
  const width = variant === 'logo' ? Math.round(height * 2.6) : height;

  return (
    <View className="items-center justify-center overflow-hidden rounded-3xl bg-ink px-6 py-7">
      <Image
        accessibilityLabel={variant === 'logo' ? APP_NAME_FULL : APP_NAME}
        source={source}
        style={{ width, height }}
        contentFit="contain"
      />
    </View>
  );
}
