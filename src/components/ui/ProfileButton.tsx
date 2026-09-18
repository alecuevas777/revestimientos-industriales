import { Text, View } from 'react-native';

import { QuietPressable } from '@/components/ui/QuietPressable';
import { useAuth } from '@/context/AuthProvider';
import { initials } from '@/lib/format';
import { push } from '@/lib/nav';

export function ProfileButton({ compact, onPress }: { compact?: boolean; onPress?: () => void }) {
  const { session } = useAuth();
  const name = session?.name ?? 'Usuario';

  return (
    <QuietPressable
      accessibilityRole="button"
      accessibilityLabel="Abrir perfil"
      onPress={() => {
        onPress?.();
        push('/perfil');
      }}
      style={{ minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} items-center justify-center rounded-full bg-brand`}>
        <Text className={`${compact ? 'text-sm' : 'text-base'} font-bold text-white`}>{initials(name)}</Text>
      </View>
      {compact ? null : (
        <View className="min-w-0">
          <Text numberOfLines={1} className="text-[17px] font-semibold text-ink">
            {name}
          </Text>
          <Text className="text-sm text-muted">Usuario</Text>
        </View>
      )}
    </QuietPressable>
  );
}
