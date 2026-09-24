import { Redirect } from 'expo-router';
import { ArrowLeft, ArrowRight, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { APP_WEBSITE } from '@/constants/brand';
import { useAuth } from '@/context/AuthProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { href, replace } from '@/lib/nav';
import { emailError } from '@/lib/validate';

export default function RegisterScreen() {
  const { session, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const run = useActionLock();

  if (session) {
    return <Redirect href={href('/(tabs)')} />;
  }

  async function handleRegister() {
    if (!accepted) {
      setError('Debes aceptar los términos y condiciones.');
      return;
    }
    const invalidEmail = emailError(email, true);
    if (invalidEmail) {
      setError(invalidEmail);
      return;
    }
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
        const result = await register({ name, email, password });
        if (!result.ok) {
          setError(result.message);
          return;
        }
        replace('/login?registered=1');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo crear la cuenta.');
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <AuthScreen
      titleLead="Crear"
      titleAccent="cuenta"
      subtitle="Registra tu cuenta para gestionar proyectos, clientes y levantamientos desde cualquier lugar."
    >
      <View className="gap-3">
        <AuthField
          icon={User}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError('');
          }}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          placeholder="Nombre completo"
        />
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
          error={error.toLowerCase().includes('correo') || error.toLowerCase().includes('email') ? error : undefined}
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
          placeholder="Contraseña"
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
          error={error && !error.toLowerCase().includes('correo') && !error.toLowerCase().includes('email') ? error : undefined}
        />

        <View className="flex-row items-center justify-between gap-3 px-1 py-1">
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            onPress={() => {
              setAccepted((value) => !value);
              setError('');
            }}
            className="min-w-0 flex-1 flex-row items-center gap-2"
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded border ${
                accepted ? 'border-brand bg-brand' : 'border-white/40'
              }`}
            >
              {accepted ? <Text className="text-[11px] font-bold text-white">✓</Text> : null}
            </View>
            <Text className="flex-1 text-sm leading-5 text-white/85">
              Acepto los{' '}
              <Text
                className="font-semibold text-brand"
                onPress={() => {
                  void Linking.openURL(APP_WEBSITE);
                }}
              >
                términos y condiciones
              </Text>
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => replace('/login')} className="shrink-0">
            <Text className="text-sm font-semibold text-brand">Ya tengo una cuenta</Text>
          </Pressable>
        </View>

        <AuthButton
          label="Registrarme"
          loading={loading}
          onPress={() => void handleRegister()}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
        />

        <View className="my-2 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-white/20" />
          <View className="h-2 w-2 rounded-full border border-white/35" />
          <View className="h-px flex-1 bg-white/20" />
        </View>

        <AuthButton
          variant="ghost"
          label="Volver al inicio de sesión"
          iconLeft={<ArrowLeft size={18} color="#FFFFFF" />}
          onPress={() => replace('/login')}
        />
      </View>
    </AuthScreen>
  );
}
