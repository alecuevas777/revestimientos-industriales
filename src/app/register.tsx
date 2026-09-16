import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthProvider';
import { href, replace } from '@/lib/nav';

export default function RegisterScreen() {
  const { session, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  function clearMessages() {
    setError('');
    setNotice('');
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

    if (result.needsEmailConfirmation) {
      setNotice('Cuenta creada. Revisa tu email para confirmar y después inicia sesión.');
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center py-8">
        <Text className="text-sm font-semibold uppercase tracking-[2px] text-brand">Registro</Text>
        <Text className="mt-2 text-3xl font-bold text-ink">Crear cuenta técnica</Text>
        <Text className="mt-2 text-base leading-6 text-muted">
          El perfil se crea al registrarte. Quedas como técnico de terreno.
        </Text>

        <View className="mt-8 gap-4">
          <Input
            label="Nombre"
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearMessages();
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
              clearMessages();
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
              clearMessages();
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
              clearMessages();
            }}
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            placeholder="Repite la contraseña"
            error={error}
          />
          {notice ? <Text className="text-sm leading-5 text-brand">{notice}</Text> : null}
          <Button
            label={notice ? 'Ir a iniciar sesión' : 'Crear cuenta'}
            onPress={() => {
              if (notice) {
                replace('/login');
                return;
              }
              void handleRegister();
            }}
            loading={loading}
          />
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
          <Text className="text-sm font-semibold text-ink">Confirmación de email</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            Si Auth pide confirmar el correo, no entrarás hasta abrirlo. En Authentication → Providers
            → Email debe estar activo “Allow new users to sign up”.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
