import { ScrollView, Text } from 'react-native';

import { QuietPressable } from '@/components/ui/QuietPressable';
import { Colors } from '@/constants/theme';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <QuietPressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              minHeight: 42,
              justifyContent: 'center',
              borderRadius: 999,
              paddingHorizontal: 16,
              backgroundColor: selected ? Colors.ink : Colors.card,
              borderWidth: selected ? 0 : 1,
              borderColor: Colors.line,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: selected ? '#FFFFFF' : Colors.ink,
              }}
            >
              {option.label}
            </Text>
          </QuietPressable>
        );
      })}
    </ScrollView>
  );
}
