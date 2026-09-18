import { Redirect } from 'expo-router';
import { ArrowRight, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthAltLinks } from '@/components/auth/AuthAltLinks';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/context/AuthProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { href, replace } from '@/lib/nav';

export default function ResetPasswordScreen() {
  const { session, recoveryPending, completeReset } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const run = useActionLock();

  if (resetDone) {
    return <Redirect href={href('/login?reset=1')} />;
  }

  if (session && !recoveryPending) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleSave() {
    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    await run(async () => {
      setLoading(true);
      try {
        const message = await completeReset(password);
        if (message) {
          setError(message);
          return;
        }
        setResetDone(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo guardar la contraseña.');
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <AuthScreen
      stackedTitle
      titleLead="Nueva"
      titleAccent="contraseña"
      subtitle={
        recoveryPending
          ? 'Elige una contraseña nueva. Después vuelve a iniciar sesión.'
          : 'Abre el enlace del correo en este dispositivo para continuar, o recupera el acceso con un código.'
      }
    >
      <View className="gap-3.5">
        {recoveryPending ? (
          <>
            <AuthField
              icon={Lock}
              password
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setError('');
              }}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Nueva contraseña"
              hint="La contraseña debe tener mínimo 6 caracteres."
            />
            <AuthField
              icon={Lock}
              password
              value={confirm}
              onChangeText={(value) => {
                setConfirm(value);
                setError('');
              }}
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Confirmar contraseña"
              error={error}
            />
            <AuthButton
              label="Guardar contraseña"
              loading={loading}
              onPress={() => void handleSave()}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
            />
          </>
        ) : (
          <>
            <Text className="text-center text-sm leading-5 text-white/80">
              Si todavía no pediste el correo, hazlo desde recuperar contraseña. El enlace caduca; si ya
              expiró, solicita uno nuevo.
            </Text>
            <AuthButton
              label="Ir a recuperar contraseña"
              onPress={() => replace('/forgot-password')}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
            />
          </>
        )}

        <AuthAltLinks onLogin={() => replace('/login')} />
      </View>
    </AuthScreen>
  );
}
