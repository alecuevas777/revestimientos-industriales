import { Image } from 'expo-image';
import { View } from 'react-native';

import { APP_NAME_FULL, BrandImages } from '@/constants/brand';

type Props = {
  inverted?: boolean;
  compact?: boolean;
  caption?: string;
};

export function BrandLockup({ inverted = false, compact = false }: Props) {
  const height = compact ? 64 : 88;
  const width = compact ? 148 : 196;

  return (
    <View className="items-center justify-center" accessibilityLabel={APP_NAME_FULL}>
      <Image
        source={inverted ? BrandImages.logo : BrandImages.logoBlack}
        style={{ width, height }}
        contentFit="contain"
      />
    </View>
  );
}
