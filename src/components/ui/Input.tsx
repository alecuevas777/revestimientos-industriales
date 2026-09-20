import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { FieldLabel } from '@/components/ui/FieldLabel';

type Props = TextInputProps & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

export function Input({ label, hint, error, required, className, ...props }: Props) {
  return (
    <View className="gap-2">
      <FieldLabel label={label} required={required} hint={error ? undefined : hint} />
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={`min-h-[52px] rounded-2xl border bg-white px-4 text-base leading-6 text-ink ${error ? 'border-danger' : 'border-line'} ${className ?? ''}`}
        {...props}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
