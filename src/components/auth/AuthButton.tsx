import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  iconLeft?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
};

export function AuthButton({
  label,
  onPress,
  icon,
  iconLeft,
  loading,
  disabled,
  variant = 'primary',
}: Props) {
  const isDisabled = disabled || loading;
  const ghost = variant === 'ghost';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      className={`min-h-[54px] flex-row items-center justify-center gap-2 rounded-full px-5 ${
        ghost ? 'border border-white/20 bg-black/35' : 'bg-brand'
      } ${isDisabled ? 'opacity-50' : 'active:opacity-85'}`}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <>
          {iconLeft}
          <Text className="text-base font-semibold text-white">{label}</Text>
          {icon}
        </>
      )}
    </Pressable>
  );
}
