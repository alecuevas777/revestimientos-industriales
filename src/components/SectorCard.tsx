import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ConditionBadge, SeverityBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/theme';
import { formatArea } from '@/lib/format';
import type { SurveySector } from '@/types';

type Props = {
  sector: SurveySector;
  index: number;
  onPress: () => void;
  onDuplicate?: () => void;
};

export function SectorCard({ sector, index, onPress, onDuplicate }: Props) {
  const name = sector.name.trim() || 'Sector sin nombre';

  return (
    <Pressable onPress={onPress}>
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted">
              Sector {String(index + 1).padStart(2, '0')}
            </Text>
            <Text className="mt-1 text-base font-semibold text-ink">{name}</Text>
            <Text className="mt-1 text-sm text-muted">{formatArea(sector.approximateArea)}</Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
              <ConditionBadge condition={sector.condition} />
              <SeverityBadge severity={sector.severity} />
            </View>
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
              <Text className="text-sm text-muted">
                {sector.problems.length} {sector.problems.length === 1 ? 'problema' : 'problemas'}
              </Text>
              <Text className="text-sm text-muted">
                {sector.photos.length} {sector.photos.length === 1 ? 'fotografía' : 'fotografías'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.muted} />
        </View>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-brand">Ver / editar</Text>
          {onDuplicate ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.();
                onDuplicate();
              }}
              className="min-h-[40px] justify-center px-1"
            >
              <Text className="text-sm font-semibold text-muted">Duplicar</Text>
            </Pressable>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
