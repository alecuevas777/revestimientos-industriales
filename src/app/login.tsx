import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/AuthButton';
import { AuthField } from '@/components/auth/AuthField';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { useAuth } from '@/context/AuthProvider';
import { href, push } from '@/lib/nav';

export default function LoginScreen() {
  const { session, login } = useAuth();
  const params = useLocalSearchParams<{ registered?: string; reset?: string }>();
  const justRegistered = params.registered === '1';
  const justReset = params.reset === '1';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEYS.rememberEmail).then((value) => {
      if (value) {
        setEmail(value);
        setRemember(true);
      }
    });
  }, []);

  if (session) {
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

    const trimmed = email.trim().toLowerCase();
    if (remember) {
      await AsyncStorage.setItem(STORAGE_KEYS.rememberEmail, trimmed);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.rememberEmail);
    }
  }

  return (
    <AuthScreen
      titleLead="Iniciar"
      titleAccent="sesión"
      subtitle="Accede de forma segura a tu cuenta y lleva tus proyectos más lejos."
      notice={
        justReset
          ? 'Contraseña actualizada. Entra con tu email y la clave nueva.'
          : justRegistered
            ? 'Cuenta creada. Ahora inicia sesión con tu email y contraseña.'
            : undefined
      }
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
        />
        <AuthField
          icon={Lock}
          password
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
          }}
          autoComplete="password"
          textContentType="password"
          placeholder="Contraseña"
          error={error}
          onSubmitEditing={() => {
            void handleLogin();
          }}
        />

        <View className="flex-row items-center justify-between px-1 py-1">
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: remember }}
            onPress={() => setRemember((value) => !value)}
            className="flex-row items-center gap-2"
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded border ${
                remember ? 'border-brand bg-brand' : 'border-white/40'
              }`}
            >
              {remember ? <Text className="text-[11px] font-bold text-white">✓</Text> : null}
            </View>
            <Text className="text-sm text-white/85">Recordarme</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => push('/forgot-password')}>
            <Text className="text-sm font-semibold text-brand">¿Olvidaste tu contraseña?</Text>
          </Pressable>
        </View>

        <AuthButton
          label="Ingresar"
          loading={loading}
          onPress={() => void handleLogin()}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
        />

        <Pressable accessibilityRole="button" onPress={() => push('/register')} className="items-center py-1">
          <Text className="text-sm text-white/70">
            ¿No tienes cuenta? <Text className="font-semibold text-brand">Crear cuenta</Text>
          </Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
