import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const variants: Record<Variant, string> = {
  primary: 'bg-brand',
  secondary: 'bg-brand-light',
  ghost: 'bg-transparent border border-line',
  danger: 'bg-danger',
};

const labels: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-dark',
  ghost: 'text-ink',
  danger: 'text-white',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  className,
}: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl px-4 ${variants[variant]} ${isDisabled ? 'opacity-50' : 'active:opacity-80'} ${className ?? ''}`}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#1D4ED8'} /> : icon}
      <Text className={`text-base font-semibold ${labels[variant]}`}>{label}</Text>
    </Pressable>
  );
}
