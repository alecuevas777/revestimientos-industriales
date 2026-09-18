import { Pressable, Text, View } from 'react-native';

type Props = {
  onOtherEmail?: () => void;
  onLogin: () => void;
};

export function AuthAltLinks({ onOtherEmail, onLogin }: Props) {
  return (
    <View className="mt-2 items-center">
      {onOtherEmail ? (
        <Pressable accessibilityRole="button" onPress={onOtherEmail} className="py-2">
          <Text className="text-sm font-semibold text-brand">Usar otro email</Text>
        </Pressable>
      ) : null}

      <View className="my-3 w-full flex-row items-center gap-3">
        <View className="h-px flex-1 bg-white/20" />
        <View className="h-2 w-2 rounded-full border border-white/35" />
        <View className="h-px flex-1 bg-white/20" />
      </View>

      <Pressable accessibilityRole="button" onPress={onLogin} className="py-1">
        <Text className="text-sm font-semibold text-brand">Volver a iniciar sesión</Text>
      </Pressable>
    </View>
  );
}
