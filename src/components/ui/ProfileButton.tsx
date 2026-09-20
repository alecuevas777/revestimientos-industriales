import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { QuietPressable } from '@/components/ui/QuietPressable';
import { useAuth } from '@/context/AuthProvider';
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
      <ProfileAvatar name={name} photoPath={session?.photoPath} size={compact ? 40 : 48} />
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
