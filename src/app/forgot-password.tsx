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

export default function ForgotPasswordScreen() {
  const { session, requestReset, resetWithCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (resetDone) {
    return <Redirect href={href('/login?reset=1')} />;
  }

  if (session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleSendCode() {
    setLoading(true);
    const message = await requestReset(email);
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep('code');
  }

  async function handleSavePassword() {
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const message = await resetWithCode({ email, token, password });
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
          title="Recuperar contraseña"
          subtitle={
            step === 'email'
              ? 'Te enviaremos un código de 6 dígitos al correo.'
              : `Ingresa el código enviado a ${email.trim().toLowerCase()} y elige una contraseña nueva.`
          }
        />

        {step === 'email' ? (
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
              error={error}
              onSubmitEditing={() => {
                void handleSendCode();
              }}
            />
            <Button label="Enviar código" onPress={() => void handleSendCode()} loading={loading} />
          </View>
        ) : (
          <View className="mt-8 gap-4">
            <Input
              label="Código"
              value={token}
              onChangeText={(value) => {
                setToken(value.replace(/[^\d]/g, '').slice(0, 8));
                setError('');
              }}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={8}
            />
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
            <Button label="Guardar contraseña" onPress={() => void handleSavePassword()} loading={loading} />
            <Button
              label="Reenviar código"
              variant="ghost"
              onPress={() => void handleSendCode()}
              loading={loading}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setStep('email');
                setError('');
              }}
              className="items-center py-1"
            >
              <Text className="text-sm text-muted">Usar otro email</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => replace('/login')}
          className="mt-6 items-center py-2"
        >
          <Text className="text-sm font-semibold text-brand">Volver a iniciar sesión</Text>
        </Pressable>

        <Card className="mt-4">
          <Text className="text-sm font-semibold text-ink">Plantilla del correo</Text>
          <Text className="mt-1 text-sm leading-5 text-muted">
            En Authentication → Email Templates → Reset password el correo debe mostrar el código con
            {'{{ .Token }}'}. Si solo hay un enlace, cámbialo para que aparezca el número.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
