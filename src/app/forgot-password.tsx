import { Redirect } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AuthAltLinks } from '@/components/auth/AuthAltLinks';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { useAuth } from '@/context/AuthProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { href, replace } from '@/lib/nav';

export default function ForgotPasswordScreen() {
  const { session, requestReset, resetWithCode } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const run = useActionLock();

  if (resetDone) {
    return <Redirect href={href('/login?reset=1')} />;
  }

  if (session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleSendCode() {
    await run(async () => {
      setSending(true);
      try {
        const message = await requestReset(email);
        if (message) {
          setError(message);
          return;
        }
        setError('');
        setStep('code');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo enviar el código.');
      } finally {
        setSending(false);
      }
    });
  }

  async function handleSavePassword() {
    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    await run(async () => {
      setSaving(true);
      try {
        const message = await resetWithCode({ email, token, password });
        if (message) {
          setError(message);
          return;
        }
        setResetDone(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo guardar la contraseña.');
      } finally {
        setSaving(false);
      }
    });
  }

  function goToEmailStep() {
    setStep('email');
    setToken('');
    setPassword('');
    setConfirm('');
    setError('');
  }

  if (step === 'code') {
    return (
      <AuthScreen
        stackedTitle
        titleLead="Nueva"
        titleAccent="contraseña"
        subtitle={`Ingresa el código enviado a ${email.trim().toLowerCase()} y elige una nueva contraseña.`}
      >
        <View className="gap-3.5">
          <AuthField
            icon={Mail}
            value={token}
            onChangeText={(value) => {
              setToken(value.replace(/[^\d]/g, '').slice(0, 6));
              setError('');
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            placeholder="Código"
            maxLength={6}
          />
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
            loading={saving}
            onPress={() => void handleSavePassword()}
            icon={<ArrowRight size={18} color="#FFFFFF" />}
          />
          <AuthButton
            variant="ghost"
            label="Reenviar código"
            loading={sending}
            onPress={() => void handleSendCode()}
          />

          <AuthAltLinks onOtherEmail={goToEmailStep} onLogin={() => replace('/login')} />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      stackedTitle
      titleLead="Recuperar"
      titleAccent="contraseña"
      subtitle="Te enviaremos un código de 6 dígitos a tu correo para restablecer tu contraseña."
    >
      <View className="gap-3.5">
        <AuthField
          icon={Mail}
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
          placeholder="Correo electrónico"
          error={error}
          onSubmitEditing={() => {
            void handleSendCode();
          }}
        />

        <AuthButton
          label="Enviar código"
          loading={sending}
          onPress={() => void handleSendCode()}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
        />

        <AuthAltLinks
          onOtherEmail={() => {
            setEmail('');
            setError('');
          }}
          onLogin={() => replace('/login')}
        />
      </View>
    </AuthScreen>
  );
}
