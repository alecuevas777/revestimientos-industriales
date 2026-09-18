import { Image } from 'expo-image';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
  type DrawerContentComponentProps,
} from 'expo-router/drawer';
import { UserRound } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_NAME, APP_NAME_FULL, BrandImages } from '@/constants/brand';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { push } from '@/lib/nav';

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="border-b border-line px-5 pb-5 pt-4">
        <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-ink">
          <Image
            accessibilityLabel={APP_NAME}
            source={BrandImages.mark}
            style={{ width: 28, height: 26 }}
            contentFit="contain"
          />
        </View>
        <Text className="mt-3 text-xl font-extrabold text-brand">{APP_NAME}</Text>
        <Text className="mt-0.5 text-sm text-muted">{session?.name ?? APP_NAME_FULL}</Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View className="border-t border-line px-2" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <DrawerItem
          label="Perfil"
          focused={false}
          activeTintColor={Colors.brand}
          inactiveTintColor={Colors.ink}
          icon={({ size }) => <UserRound size={size} color={Colors.ink} />}
          onPress={() => {
            props.navigation.closeDrawer();
            push('/perfil');
          }}
        />
      </View>
    </View>
  );
}
