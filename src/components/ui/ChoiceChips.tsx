import { Pressable, Text, View } from 'react-native';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
};

type Common<T extends string> = {
  options: ChoiceOption<T>[];
  label?: string;
  hint?: string;
};

type SingleProps<T extends string> = Common<T> & {
  value?: T;
  values?: never;
  onChange: (value: T) => void;
};

type MultiProps<T extends string> = Common<T> & {
  values: T[];
  value?: never;
  onChange: (values: T[]) => void;
};

export function FieldLabel({ label, hint }: { label?: string; hint?: string }) {
  if (!label && !hint) return null;
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-semibold text-ink">{label}</Text> : null}
      {hint ? <Text className="text-sm leading-5 text-muted">{hint}</Text> : null}
    </View>
  );
}

export function ChoiceChips<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const selected = (option: T) =>
    props.values ? props.values.includes(option) : props.value === option;

  function press(option: T) {
    if (props.values) {
      const exists = props.values.includes(option);
      props.onChange(exists ? props.values.filter((item) => item !== option) : [...props.values, option]);
      return;
    }
    props.onChange(option);
  }

  return (
    <View className="gap-2">
      <FieldLabel label={props.label} hint={props.hint} />
      <View className="flex-row flex-wrap gap-2">
        {props.options.map((option) => {
          const active = selected(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => press(option.value)}
              className={`min-h-[44px] justify-center rounded-full px-4 ${
                active ? 'bg-brand' : 'border border-line bg-white'
              }`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
