import { useNavigation } from 'expo-router';
import { Menu } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Colors } from '@/constants/theme';

export function MenuButton() {
  const navigation = useNavigation();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      onPress={() => {
        const nav = navigation as typeof navigation & {
          openDrawer?: () => void;
          getParent?: () => { openDrawer?: () => void };
        };
        nav.openDrawer?.() ?? nav.getParent?.()?.openDrawer?.();
      }}
      className="h-10 w-10 items-center justify-center rounded-full active:bg-line"
    >
      <Menu size={22} color={Colors.ink} />
    </Pressable>
  );
}
