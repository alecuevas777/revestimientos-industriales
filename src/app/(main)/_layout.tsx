import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/AppDrawer';

const hidden = { drawerItemStyle: { display: 'none' as const, height: 0 } };

export default function MainLayout() {
  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(18, 18, 18, 0.28)',
        drawerStyle: {
          width: 320,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Drawer.Screen name="(tabs)" options={hidden} />
      <Drawer.Screen name="perfil" options={hidden} />
      <Drawer.Screen name="perfil-editar" options={hidden} />
      <Drawer.Screen name="clientes" options={hidden} />
      <Drawer.Screen name="proyectos" options={hidden} />
      <Drawer.Screen name="levantamientos" options={hidden} />
    </Drawer>
  );
}
