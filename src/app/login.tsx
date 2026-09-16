import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthProvider';
import { href, push } from '@/lib/nav';

export default function LoginScreen() {
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleLogin() {
    setLoading(true);
    const message = await login(email, password);
    setLoading(false);
    if (message) {
      setError(message);
    }
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
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="tu-email@landes.cl"
          />
          <Input
            label="Contraseña"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError('');
            }}
            autoComplete="password"
            textContentType="password"
            secureTextEntry
            placeholder="••••••••"
            error={error}
            onSubmitEditing={() => {
              void handleLogin();
            }}
          />
          <Button label="Iniciar sesión" onPress={() => void handleLogin()} loading={loading} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => push('/register')}
          className="mt-6 items-center py-2"
        >
          <Text className="text-sm text-muted">
            ¿No tienes cuenta? <Text className="font-semibold text-brand">Crear cuenta</Text>
          </Text>
        </Pressable>

        <Card className="mt-4">
          <Text className="text-sm font-semibold text-ink">Acceso con Supabase Auth</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            Si el proyecto pide confirmar email, revisa tu correo antes del primer ingreso. Un usuario
            inactivo no podrá entrar.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
