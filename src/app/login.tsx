import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { DEMO_PASSWORD, DEMO_USER } from '@/constants/labels';
import { useApp } from '@/context/AppProvider';
import { href, replace } from '@/lib/nav';

export default function LoginScreen() {
  const { ready, session, login } = useApp();
  const [email, setEmail] = useState<string>(DEMO_USER.email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (ready && session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleLogin() {
    setLoading(true);
    const message = await login(email, password);
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    replace('/(tabs)');
  }

  return (
    <Screen>
      <View className="flex-1 justify-center py-8">
        <Text className="text-sm font-semibold uppercase tracking-[2px] text-brand">Levantamientos</Text>
        <Text className="mt-2 text-3xl font-bold text-ink">Revestimientos Industriales</Text>
        <Text className="mt-2 text-base leading-6 text-muted">
          Ingreso técnico para inspecciones de superficie en terreno.
        </Text>

        <View className="mt-8 gap-4">
          <Input
            label="Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tecnico@demo.cl"
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            secureTextEntry
            placeholder="••••••••"
            error={error}
          />
          <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} />
        </View>

        <Card className="mt-6">
          <Text className="text-sm font-semibold text-ink">Usuario de demostración</Text>
          <Text className="mt-1 text-sm text-muted">{DEMO_USER.name}</Text>
          <Text className="text-sm text-muted">{DEMO_USER.email}</Text>
          <Text className="mt-2 text-sm text-muted">Contraseña: {DEMO_PASSWORD}</Text>
        </Card>
      </View>
    </Screen>
  );
}
