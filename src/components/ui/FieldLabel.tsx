import { Text, View } from 'react-native';

type Props = {
  label?: string;
  hint?: string;
  required?: boolean;
};

export function FieldLabel({ label, hint, required }: Props) {
  if (!label && !hint) return null;
  return (
    <View className="gap-1">
      {label ? (
        <Text className="text-sm font-semibold text-ink">
          {label}
          {required ? <Text className="text-brand"> *</Text> : null}
        </Text>
      ) : null}
      {hint ? <Text className="text-sm leading-5 text-muted">{hint}</Text> : null}
    </View>
  );
}
