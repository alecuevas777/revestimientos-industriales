import { Text, View } from 'react-native';

import { QuietPressable } from '@/components/ui/QuietPressable';
import { Colors } from '@/constants/theme';

type Props = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectableCard({ title, description, selected, onPress }: Props) {
  return (
    <QuietPressable
      onPress={onPress}
      style={{
        minHeight: 72,
        flex: 1,
        borderRadius: 16,
        borderWidth: 2,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: selected ? Colors.brandLight : Colors.card,
        borderColor: selected ? Colors.brand : Colors.line,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-brand bg-brand' : 'border-line bg-white'}`}
        >
          {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
        </View>
        <View className="flex-1">
          <Text className={`text-base font-semibold ${selected ? 'text-brand-dark' : 'text-ink'}`}>
            {title}
          </Text>
          {description ? <Text className="mt-1 text-sm text-muted">{description}</Text> : null}
        </View>
      </View>
    </QuietPressable>
  );
}
