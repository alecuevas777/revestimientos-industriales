import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBrandHeader } from '@/components/AuthBrandHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { APP_EMAIL_PLACEHOLDER, APP_NAME_FULL } from '@/constants/brand';
import { useAuth } from '@/context/AuthProvider';
import { href, push } from '@/lib/nav';

export default function LoginScreen() {
  const { session, login } = useAuth();
  const params = useLocalSearchParams<{ registered?: string; reset?: string }>();
  const justRegistered = params.registered === '1';
  const justReset = params.reset === '1';
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
        <AuthBrandHeader
          title={APP_NAME_FULL}
          subtitle="Ingreso técnico para inspecciones de superficie en terreno."
        />

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
            placeholder={APP_EMAIL_PLACEHOLDER}
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
          <Pressable
            accessibilityRole="button"
            onPress={() => push('/forgot-password')}
            className="items-end"
          >
            <Text className="text-sm font-semibold text-brand">¿Olvidaste tu contraseña?</Text>
          </Pressable>
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

        {justReset || justRegistered ? (
          <Card className="mt-4">
            <Text className="text-sm font-semibold text-ink">
              {justReset ? 'Contraseña actualizada' : 'Cuenta creada'}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-muted">
              {justReset
                ? 'Ya puedes entrar con tu email y la contraseña nueva.'
                : 'Ahora inicia sesión con el email y la contraseña que acabas de registrar.'}
            </Text>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
