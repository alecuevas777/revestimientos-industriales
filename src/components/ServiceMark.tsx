import { Layers, Shield, SquareStack, Warehouse } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { SERVICE_TYPE_LABELS, SERVICE_TYPE_SHORT } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import type { ServiceType } from '@/types';

const ICONS = {
  epoxy: Layers,
  pu_cement: SquareStack,
  roof_waterproofing: Warehouse,
  corrosion_control: Shield,
} as const;

type Props = {
  type: ServiceType;
  short?: boolean;
  size?: 'sm' | 'md';
};

export function ServiceMark({ type, short, size = 'sm' }: Props) {
  const Icon = ICONS[type];
  const iconSize = size === 'md' ? 18 : 15;

  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={iconSize} color={Colors.brand} />
      <Text className={size === 'md' ? 'text-base font-semibold text-ink' : 'text-sm font-medium text-ink'}>
        {short ? SERVICE_TYPE_SHORT[type] : SERVICE_TYPE_LABELS[type]}
      </Text>
    </View>
  );
}
