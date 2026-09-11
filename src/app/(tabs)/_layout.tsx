import { Redirect, Tabs } from 'expo-router';
import { ClipboardList, FolderKanban, LayoutDashboard, Users } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppProvider';
import { href } from '@/lib/nav';

export default function TabsLayout() {
  const { ready, session } = useApp();
  const insets = useSafeAreaInsets();

  if (ready && !session) {
    return <Redirect href={href('/login')} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand,
        tabBarInactiveTintColor: Colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: Colors.line,
          height: 56 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="proyectos"
        options={{
          title: 'Proyectos',
          tabBarIcon: ({ color, size }) => <FolderKanban color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="levantamientos"
        options={{
          title: 'Levantamientos',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
