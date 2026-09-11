import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProvider } from '@/context/AppProvider';
import '@/global.css';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F3F5F7' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="clientes" />
        <Stack.Screen name="proyectos" />
        <Stack.Screen name="levantamientos" />
      </Stack>
    </AppProvider>
  );
}
