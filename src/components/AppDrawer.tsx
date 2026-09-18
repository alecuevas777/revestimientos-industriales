import { Image } from 'expo-image';
import {
  ChevronRight,
  FolderKanban,
  Home,
  LogOut,
  MapPin,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { DrawerContentScrollView, type DrawerContentComponentProps } from 'expo-router/drawer';
import { usePathname } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { QuietPressable } from '@/components/ui/QuietPressable';
import { APP_NAME_FULL, BrandImages } from '@/constants/brand';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthProvider';
import { initials } from '@/lib/format';

const items: { label: string; route: string; screen?: string; prefixes: string[]; icon: LucideIcon }[] = [
  { label: 'Inicio', route: '(tabs)', screen: 'index', prefixes: ['/'], icon: Home },
  { label: 'Clientes', route: 'clientes', screen: 'index', prefixes: ['/clientes'], icon: Users },
  { label: 'Proyectos', route: 'proyectos', screen: 'index', prefixes: ['/proyectos'], icon: FolderKanban },
  { label: 'Levantamientos', route: 'levantamientos', screen: 'index', prefixes: ['/levantamientos'], icon: MapPin },
  { label: 'Perfil', route: 'perfil', prefixes: ['/perfil'], icon: UserRound },
];

function isActive(pathname: string, prefixes: string[], route: string) {
  if (route === '(tabs)') {
    return pathname === '/' || pathname === '/index';
  }
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function NavRow({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <QuietPressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        position: 'relative',
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 16,
        paddingHorizontal: 16,
        backgroundColor: active ? '#FFF1E6' : '#FFFFFF',
        borderWidth: active ? 0 : 1,
        borderColor: '#EEEEEE',
      }}
    >
      {active ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 8,
            bottom: 8,
            left: 0,
            width: 3,
            borderRadius: 999,
            backgroundColor: Colors.brand,
          }}
        />
      ) : null}
      <Icon size={22} color={active ? Colors.brand : Colors.ink} strokeWidth={1.8} />
      <Text style={{ marginLeft: 14, flex: 1, fontSize: 16, fontWeight: '500', color: Colors.ink }}>
        {label}
      </Text>
      <ChevronRight size={18} color="#C9C9C9" />
    </QuietPressable>
  );
}

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const name = session?.name ?? 'Usuario';

  function go(route: string, screen?: string) {
    props.navigation.closeDrawer();
    const navigate = () => {
      if (screen) {
        props.navigation.navigate(route, { screen });
      } else {
        props.navigation.navigate(route);
      }
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(navigate);
    } else {
      requestAnimationFrame(navigate);
    }
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 8, paddingHorizontal: 20 }}
      >
        <View className="mb-7 items-center pt-3">
          <Image
            accessibilityLabel={APP_NAME_FULL}
            source={BrandImages.logoBlack}
            style={{ width: 196, height: 88 }}
            contentFit="contain"
          />
        </View>

        <QuietPressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          onPress={() => go('perfil')}
          style={{ marginBottom: 28, flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'flex-start' }}
        >
          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#E8E8E8]">
            <Text className="text-[13px] font-semibold text-[#6B7280]">{initials(name)}</Text>
          </View>
          <Text numberOfLines={1} className="text-[15px] text-muted">
            {name}
          </Text>
        </QuietPressable>

        <View className="gap-3">
          {items.map((item) => (
            <NavRow
              key={item.route}
              icon={item.icon}
              label={item.label}
              active={isActive(pathname, item.prefixes, item.route)}
              onPress={() => go(item.route, item.screen)}
            />
          ))}
        </View>

        <QuietPressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          onPress={() => setLogoutOpen(true)}
          style={{ marginTop: 40, minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}
        >
          <LogOut size={20} color={Colors.ink} strokeWidth={1.8} />
          <Text style={{ marginLeft: 14, flex: 1, fontSize: 16, fontWeight: '500', color: Colors.ink }}>
            Cerrar sesión
          </Text>
          <ChevronRight size={18} color="#C9C9C9" />
        </QuietPressable>
      </DrawerContentScrollView>

      <ConfirmModal
        visible={logoutOpen}
        title="¿Cerrar sesión?"
        message="Se cierra la sesión en este dispositivo. Los datos sincronizados quedan en tu cuenta y la copia local se mantiene."
        confirmLabel="Cerrar sesión"
        destructive
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          props.navigation.closeDrawer();
          await logout();
        }}
      />
    </View>
  );
}
