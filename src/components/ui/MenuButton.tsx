import { useNavigation } from 'expo-router';
import { Menu } from 'lucide-react-native';

import { QuietPressable } from '@/components/ui/QuietPressable';
import { Colors } from '@/constants/theme';

export function MenuButton() {
  const navigation = useNavigation();

  return (
    <QuietPressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      onPress={() => {
        let current: { openDrawer?: () => void; getParent?: () => unknown } | undefined = navigation;
        while (current) {
          if (typeof current.openDrawer === 'function') {
            current.openDrawer();
            return;
          }
          current = current.getParent?.() as typeof current;
        }
      }}
      style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999 }}
    >
      <Menu size={22} color={Colors.ink} />
    </QuietPressable>
  );
}
