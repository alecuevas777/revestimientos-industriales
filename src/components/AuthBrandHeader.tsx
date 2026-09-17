import { Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { APP_NAME } from '@/constants/brand';

type Props = {
  title: string;
  subtitle: string;
};

export function AuthBrandHeader({ title, subtitle }: Props) {
  return (
    <View>
      <BrandMark />
      <Text className="mt-6 text-sm font-semibold uppercase tracking-[2px] text-brand">{APP_NAME}</Text>
      <Text className="mt-2 text-3xl font-bold text-ink">{title}</Text>
      <Text className="mt-2 text-base leading-6 text-muted">{subtitle}</Text>
    </View>
  );
}
