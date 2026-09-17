import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBrandHeader } from '@/components/AuthBrandHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthProvider';
import { href, replace } from '@/lib/nav';

export default function ResetPasswordScreen() {
  const { session, recoveryPending, completeReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (resetDone) {
    return <Redirect href={href('/login?reset=1')} />;
  }

  if (session && !recoveryPending) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleSave() {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const message = await completeReset(password);
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }

    setResetDone(true);
  }

  return (
    <Screen>
      <View className="flex-1 justify-center py-8">
        <AuthBrandHeader
          title="Nueva contraseña"
          subtitle={
            recoveryPending
              ? 'Elige una contraseña nueva. Después vuelve a iniciar sesión.'
              : 'Abre el enlace del correo en este dispositivo para continuar.'
          }
        />

        {recoveryPending ? (
          <View className="mt-8 gap-4">
            <Input
              label="Nueva contraseña"
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
            <Button label="Guardar contraseña" onPress={() => void handleSave()} loading={loading} />
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Card>
              <Text className="text-sm font-semibold text-ink">Esperando el enlace</Text>
              <Text className="mt-1 text-sm leading-5 text-muted">
                Si todavía no pediste el correo, hazlo desde recuperar contraseña. El enlace caduca;
                si ya expiró, solicita uno nuevo.
              </Text>
            </Card>
            <Button label="Ir a recuperar contraseña" onPress={() => replace('/forgot-password')} />
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => replace('/login')}
          className="mt-6 items-center py-2"
        >
          <Text className="text-sm font-semibold text-brand">Volver a iniciar sesión</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
