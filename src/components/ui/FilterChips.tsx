import { ScrollView, Text } from 'react-native';

import { QuietPressable } from '@/components/ui/QuietPressable';
import { Colors } from '@/constants/theme';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Base<T extends string> = {
  options: Option<T>[];
};

type SingleProps<T extends string> = Base<T> & {
  value: T;
  values?: never;
  onChange: (value: T) => void;
};

type MultiProps<T extends string> = Base<T> & {
  values: T[];
  value?: never;
  onChange: (values: T[]) => void;
};

function isMulti<T extends string>(props: SingleProps<T> | MultiProps<T>): props is MultiProps<T> {
  return Array.isArray((props as MultiProps<T>).values);
}

export function FilterChips<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  function press(option: T) {
    if (isMulti(props)) {
      const next = props.values.includes(option)
        ? props.values.filter((item) => item !== option)
        : [...props.values, option];
      props.onChange(next);
      return;
    }
    props.onChange(option);
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 pr-1"
      style={{ overflow: 'hidden' }}
    >
      {props.options.map((option) => {
        const selected = isMulti(props) ? props.values.includes(option.value) : props.value === option.value;
        return (
          <QuietPressable
            key={option.value}
            onPress={() => press(option.value)}
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
