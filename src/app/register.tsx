import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBrandHeader } from '@/components/AuthBrandHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { APP_EMAIL_PLACEHOLDER } from '@/constants/brand';
import { useAuth } from '@/context/AuthProvider';
import { href, replace } from '@/lib/nav';

export default function RegisterScreen() {
  const { session, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleRegister() {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const result = await register({ name, email, password });
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    replace('/login?registered=1');
  }

  return (
    <Screen>
      <View className="flex-1 justify-center py-8">
        <AuthBrandHeader
          title="Crear cuenta técnica"
          subtitle="El perfil se crea al registrarte. Quedas como técnico de terreno."
        />

        <View className="mt-8 gap-4">
          <Input
            label="Nombre"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError('');
            }}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            placeholder="Nombre y apellido"
          />
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
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar contraseña"
            value={confirm}
            onChangeText={(value) => {
              setConfirm(value);
              setError('');
            }}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            placeholder="Repite la contraseña"
            error={error}
          />
          <Button label="Crear cuenta" onPress={() => void handleRegister()} loading={loading} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => replace('/login')}
          className="mt-6 items-center py-2"
        >
          <Text className="text-sm text-muted">
            ¿Ya tienes cuenta? <Text className="font-semibold text-brand">Iniciar sesión</Text>
          </Text>
        </Pressable>

        <Card className="mt-4">
          <Text className="text-sm font-semibold text-ink">Después del registro</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            Al crear la cuenta volverás a iniciar sesión con tu email y contraseña.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
