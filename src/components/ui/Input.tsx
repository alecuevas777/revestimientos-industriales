import { Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: Props) {
  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-semibold text-ink">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={`min-h-[52px] rounded-2xl border bg-white px-4 text-base leading-6 text-ink ${error ? 'border-danger' : 'border-line'} ${className ?? ''}`}
        {...props}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      {hint && !error ? <Text className="text-sm text-muted">{hint}</Text> : null}
    </View>
  );
}
