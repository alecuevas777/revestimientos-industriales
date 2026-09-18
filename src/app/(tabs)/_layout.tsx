import { ClipboardList, FolderKanban, LayoutGrid, Users } from 'lucide-react-native';
import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/AppDrawer';
import { Colors } from '@/constants/theme';

export default function AppMenuLayout() {
  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerActiveTintColor: Colors.brand,
        drawerInactiveTintColor: Colors.ink,
        drawerActiveBackgroundColor: Colors.brandLight,
        drawerItemStyle: { borderRadius: 14, marginHorizontal: 8 },
        drawerLabelStyle: { fontSize: 16, fontWeight: '600' },
        overlayColor: 'rgba(18, 18, 18, 0.35)',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Inicio',
          title: 'Inicio',
          drawerIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="clientes"
        options={{
          drawerLabel: 'Clientes',
          title: 'Clientes',
          drawerIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="proyectos"
        options={{
          drawerLabel: 'Proyectos',
          title: 'Proyectos',
          drawerIcon: ({ color, size }) => <FolderKanban color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="levantamientos"
        options={{
          drawerLabel: 'Levantamientos',
          title: 'Levantamientos',
          drawerIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
    </Drawer>
  );
}
