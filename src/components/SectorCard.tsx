import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { CardActions } from '@/components/ui/CardActions';
import { ConditionBadge, SeverityBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/theme';
import { usesElements } from '@/constants/options';
import { formatArea } from '@/lib/format';
import type { ServiceType, SurveySector } from '@/types';

type Props = {
  sector: SurveySector;
  index: number;
  serviceType?: ServiceType;
  onPress: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
};

export function SectorCard({ sector, index, serviceType, onPress, onDuplicate, onDelete }: Props) {
  const name = sector.name.trim() || 'Sector sin nombre';
  const showElements = usesElements(serviceType);

  return (
    <Card>
      <Pressable onPress={onPress}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted">
              Sector {String(index + 1).padStart(2, '0')}
            </Text>
            <Text className="mt-1 text-base font-semibold text-ink">{name}</Text>
            {sector.approximateArea ? (
              <Text className="mt-1 text-sm text-muted">{formatArea(sector.approximateArea)}</Text>
            ) : null}
            <View className="mt-3 flex-row flex-wrap gap-2">
              <ConditionBadge condition={sector.condition} />
              <SeverityBadge severity={sector.severity} />
            </View>
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
              {showElements ? (
                <Text className="text-sm text-muted">
                  {sector.elements.length} {sector.elements.length === 1 ? 'elemento' : 'elementos'}
                </Text>
              ) : (
                <Text className="text-sm text-muted">
                  {sector.problems.length} {sector.problems.length === 1 ? 'problema' : 'problemas'}
                </Text>
              )}
              <Text className="text-sm text-muted">
                {sector.photos.length + sector.elements.reduce((total, item) => total + item.photos.length, 0)} fotos
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.muted} />
        </View>
      </Pressable>
      <CardActions
        editLabel="Editar"
        onEdit={onPress}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />
    </Card>
  );
}
