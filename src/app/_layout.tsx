import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { AppProvider } from '@/context/AppProvider';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { Colors } from '@/constants/theme';
import '@/global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AppProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { ready, session } = useAuth();

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <BrandMark variant="mark" height={72} />
        <ActivityIndicator className="mt-6" size="large" color={Colors.brand} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="perfil" />
        <Stack.Screen name="clientes" />
        <Stack.Screen name="proyectos" />
        <Stack.Screen name="levantamientos" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}
