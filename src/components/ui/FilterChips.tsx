import { Pressable, ScrollView, Text } from 'react-native';

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
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            className={`min-h-[44px] justify-center rounded-full px-4 ${selected ? 'bg-brand' : 'bg-white border border-line'}`}
          >
            <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-ink'}`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
