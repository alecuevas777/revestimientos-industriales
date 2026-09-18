import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { MenuButton } from '@/components/ui/MenuButton';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { APP_NAME_FULL, BrandImages } from '@/constants/brand';
import { WORKER_ROLE } from '@/constants/labels';
import { useAuth } from '@/context/AuthProvider';
import { firstName, greetingForNow } from '@/lib/format';

export function TabBrandHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { session } = useAuth();
  const home = !title;

  return (
    <View className="mb-5">
      <View className="flex-row items-center">
        <View className="w-10">
          <MenuButton />
        </View>
        <View className="flex-1 items-center">
          <Image
            accessibilityLabel={APP_NAME_FULL}
            source={BrandImages.logoBlack}
            style={{ width: 148, height: 64 }}
            contentFit="contain"
          />
        </View>
        <View className="w-10 items-end">
          <ProfileButton compact />
        </View>
      </View>

      {home ? (
        <View className="mt-5">
          <Text className="text-[13px] font-semibold uppercase tracking-[1.6px] text-brand">
            {greetingForNow()}
          </Text>
          <Text className="mt-1 text-[28px] font-bold leading-8 text-ink">
            {session ? firstName(session.name) : 'Técnico'}
          </Text>
          <Text className="mt-1 text-[15px] text-muted">{session?.role ?? WORKER_ROLE}</Text>
        </View>
      ) : (
        <View className="mt-5">
          <Text className="text-[26px] font-bold leading-8 text-ink">{title}</Text>
          {subtitle ? <Text className="mt-1 text-[15px] leading-5 text-muted">{subtitle}</Text> : null}
        </View>
      )}
    </View>
  );
}
