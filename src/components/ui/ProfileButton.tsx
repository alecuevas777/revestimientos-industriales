import { Pressable, Text } from 'react-native';

import { useApp } from '@/context/AppProvider';
import { initials } from '@/lib/format';
import { push } from '@/lib/nav';

export function ProfileButton() {
  const { session } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      onPress={() => push('/perfil')}
      className="h-11 w-11 items-center justify-center rounded-full bg-brand active:opacity-80"
    >
      <Text className="text-sm font-bold text-white">{initials(session?.name ?? 'TD')}</Text>
    </Pressable>
  );
}
