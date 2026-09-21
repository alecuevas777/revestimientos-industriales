import * as Linking from 'expo-linking';
import type { User as AuthUser } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { emailError, phoneError } from '@/lib/validate';
import { deleteStoredPhoto, uploadProfilePhoto } from '@/remote/photos';
import { compressSurveyPhoto } from '@/services/photoStorage';
import { clearSession, saveSession } from '@/storage/sessionStorage';
import { WORKER_ROLE } from '@/constants/labels';
import type { User } from '@/types';

export type RegisterResult = { ok: true } | { ok: false; message: string };
export type AuthCallbackKind = 'recovery' | 'session' | 'none';

type ProfileRow = {
  nombre: string | null;
  email: string | null;
  rol: string | null;
  activo?: boolean | null;
  telefono?: string | null;
  foto_path?: string | null;
};

function mapAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (text.includes('invalid api key') || text.includes('invalid apikey')) {
    return 'Clave de API inválida. Reinicia Expo con npx expo start --clear.';
  }
  if (text.includes('email not confirmed')) {
    return 'Confirma tu email antes de entrar. Revisa tu correo o Authentication → Users.';
  }
  if (text.includes('user already registered') || text.includes('already registered')) {
    return 'Ya existe una cuenta con ese email. Inicia sesión.';
  }
  if (text.includes('password should be at least') || text.includes('password is known to be weak')) {
    return 'La contraseña es demasiado corta o insegura. Usa al menos 6 caracteres.';
  }
  if (text.includes('signup is disabled') || text.includes('signups not allowed')) {
    return 'El registro está desactivado en Authentication → Providers → Email.';
  }
  if (text.includes('same password') || text.includes('should be different')) {
    return 'La nueva contraseña debe ser distinta a la anterior.';
  }
  if (text.includes('otp') || text.includes('token has expired') || text.includes('invalid token')) {
    return 'El código es inválido o expiró. Solicita uno nuevo.';
  }
  if (text.includes('rate limit') || text.includes('too many requests')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  }
  if (text.includes('column') && (text.includes('telefono') || text.includes('foto_path'))) {
    return 'Falta aplicar en Supabase la migración de teléfono y foto de perfil.';
  }
  if (text.includes('network') || text.includes('fetch')) {
    return 'No se pudo conectar con Supabase. Revisa la red y las claves del .env.';
  }
  return message;
}

function toUser(authUser: AuthUser, data: ProfileRow | null): User {
  const rol = data?.rol;
  return {
    id: authUser.id,
    name: data?.nombre?.trim() || authUser.email?.split('@')[0] || 'Técnico',
    email: data?.email || authUser.email || '',
    role: rol === 'tecnico' || !rol ? WORKER_ROLE : rol,
    phone: data?.telefono?.trim() || undefined,
    photoPath: data?.foto_path?.trim() || undefined,
  };
}

export async function persistProfile(authUser: AuthUser): Promise<string | User> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('nombre, email, rol, activo, telefono, foto_path')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    const fallback = await supabase
      .from('perfiles')
      .select('nombre, email, rol')
      .eq('id', authUser.id)
      .maybeSingle();

    if (fallback.error) return mapAuthError(fallback.error.message);
    const user = toUser(authUser, fallback.data);
    await saveSession(user);
    return user;
  }

  if (data?.activo === false) {
    await supabase.auth.signOut();
    await clearSession();
    return 'Tu usuario está desactivado. Contacta a un supervisor.';
  }

  const user = toUser(authUser, data);
  await saveSession(user);
  return user;
}

export async function signInWithPassword(email: string, password: string): Promise<string | User> {
  const trimmed = email.trim().toLowerCase();
  const invalidEmail = emailError(trimmed, true);
  if (invalidEmail) return invalidEmail;
  if (!password) return 'Ingresa email y contraseña.';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (error) return mapAuthError(error.message);
  if (!data.user) return 'No se pudo iniciar sesión.';

  return persistProfile(data.user);
}

export async function signUpWithPassword(input: {
  name: string;
  email: string;
  password: string;
}): Promise<RegisterResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, message: 'Ingresa tu nombre.' };
  const invalidEmail = emailError(email, true);
  if (invalidEmail) return { ok: false, message: invalidEmail };
  if (password.length < 6) return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres.' };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) return { ok: false, message: mapAuthError(error.message) };

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, message: 'Ya existe una cuenta con ese email. Inicia sesión.' };
  }

  if (!data.user) return { ok: false, message: 'No se pudo crear la cuenta.' };

  if (data.session) {
    await supabase.auth.signOut();
  }
  await clearSession();
  return { ok: true };
}

export async function signOutAuth() {
  await supabase.auth.signOut();
  await clearSession();
}

export async function restoreAuthSession(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) {
    await clearSession();
    return null;
  }

  const result = await persistProfile(data.session.user);
  return typeof result === 'string' ? null : result;
}

export function passwordResetRedirectUrl() {
  return Linking.createURL('reset-password');
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function paramsFromAuthUrl(url: string) {
  const parsed = Linking.parse(url);
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const hashParams = new URLSearchParams(hash);
  const query = parsed.queryParams ?? {};

  const read = (key: string) => hashParams.get(key) || firstParam(query[key] as string | string[] | undefined) || '';

  return {
    type: read('type'),
    access_token: read('access_token'),
    refresh_token: read('refresh_token'),
    token_hash: read('token_hash'),
    code: read('code'),
    error: read('error_description') || read('error'),
  };
}

export async function consumeAuthCallback(url: string): Promise<AuthCallbackKind | { error: string }> {
  const params = paramsFromAuthUrl(url);
  if (params.error) return { error: mapAuthError(params.error) };

  if (params.token_hash) {
    const type = params.type === 'recovery' ? 'recovery' : 'email';
    const { error } = await supabase.auth.verifyOtp({ token_hash: params.token_hash, type });
    if (error) return { error: mapAuthError(error.message) };
    return params.type === 'recovery' ? 'recovery' : 'session';
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { error: mapAuthError(error.message) };
    return params.type === 'recovery' ? 'recovery' : 'session';
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) return { error: mapAuthError(error.message) };
    return params.type === 'recovery' ? 'recovery' : 'session';
  }

  return 'none';
}

export async function requestPasswordReset(email: string): Promise<string | null> {
  const trimmed = email.trim().toLowerCase();
  const invalidEmail = emailError(trimmed, true);
  if (invalidEmail) return invalidEmail;

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
  if (error) return mapAuthError(error.message);
  return null;
}

export async function resetPasswordWithCode(input: {
  email: string;
  token: string;
  password: string;
}): Promise<string | null> {
  const email = input.email.trim().toLowerCase();
  const token = input.token.replace(/\s/g, '');
  const password = input.password;

  const invalidEmail = emailError(email, true);
  if (invalidEmail) return invalidEmail;
  if (token.length !== 8) return 'Ingresa el código de 8 dígitos del correo.';
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  if (error) return mapAuthError(error.message);

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) return mapAuthError(updateError.message);

  await signOutAuth();
  return null;
}

export async function updatePassword(password: string): Promise<string | null> {
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return mapAuthError(error.message);

  await signOutAuth();
  return null;
}

export async function updateOwnProfile(input: {
  name: string;
  phone?: string;
  photoUri?: string;
  removePhoto?: boolean;
}): Promise<string | User> {
  const name = input.name.trim();
  if (!name) return 'Ingresa tu nombre.';
  const invalidPhone = phoneError(input.phone);
  if (invalidPhone) return invalidPhone;

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return 'No hay una sesión activa.';

  const { data: current } = await supabase
    .from('perfiles')
    .select('foto_path')
    .eq('id', auth.user.id)
    .maybeSingle();

  let fotoPath: string | null = current?.foto_path ?? null;

  try {
    if (input.removePhoto) {
      await deleteStoredPhoto(fotoPath ?? undefined);
      fotoPath = null;
    } else if (input.photoUri && !input.photoUri.startsWith('http')) {
      const compressed = await compressSurveyPhoto(input.photoUri);
      fotoPath = await uploadProfilePhoto(auth.user.id, compressed);
    }
  } catch (caught) {
    return caught instanceof Error ? caught.message : 'No se pudo guardar la foto de perfil.';
  }

  const { error } = await supabase
    .from('perfiles')
    .update({
      nombre: name,
      telefono: input.phone?.trim() || null,
      foto_path: fotoPath,
    })
    .eq('id', auth.user.id);

  if (error) return mapAuthError(error.message);

  await supabase.auth.updateUser({ data: { name } });
  return persistProfile(auth.user);
}
