import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import {
  consumeAuthCallback,
  persistProfile,
  requestPasswordReset,
  resetPasswordWithCode,
  restoreAuthSession,
  signInWithPassword,
  signOutAuth,
  signUpWithPassword,
  updatePassword,
  updateOwnProfile,
  type RegisterResult,
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { clearSession } from '@/storage/sessionStorage';
import type { User } from '@/types';

type AuthContextValue = {
  ready: boolean;
  session: User | null;
  recoveryPending: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (input: { name: string; email: string; password: string }) => Promise<RegisterResult>;
  requestReset: (email: string) => Promise<string | null>;
  resetWithCode: (input: { email: string; token: string; password: string }) => Promise<string | null>;
  completeReset: (password: string) => Promise<string | null>;
  updateProfile: (input: {
    name: string;
    phone?: string;
    photoUri?: string;
    removePhoto?: boolean;
  }) => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<User | null>(null);
  const [recoveryPending, setRecoveryPending] = useState(false);
  const registeringRef = useRef(false);
  const recoveryRef = useRef(false);
  const codeResetRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function boot() {
      const initialUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.href
          : await Linking.getInitialURL();

      if (initialUrl) {
        const consumed = await consumeAuthCallback(initialUrl);
        if (!active) return;
        if (typeof consumed === 'object') {
          // enlace inválido: seguir al login
        } else if (consumed === 'recovery') {
          recoveryRef.current = true;
          setRecoveryPending(true);
          setSession(null);
          setReady(true);
          return;
        }
      }

      const user = await restoreAuthSession();
      if (!active) return;
      setSession(user);
      setReady(true);
    }

    void boot();

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setTimeout(() => {
        void (async () => {
          if (!active) return;
          if (event === 'INITIAL_SESSION') return;

          if (event === 'PASSWORD_RECOVERY') {
            if (codeResetRef.current) return;
            recoveryRef.current = true;
            setRecoveryPending(true);
            setSession(null);
            return;
          }

          if (codeResetRef.current) {
            if (nextSession?.user) return;
            await clearSession();
            if (active) {
              setSession(null);
              setRecoveryPending(false);
            }
            codeResetRef.current = false;
            return;
          }

          if (recoveryRef.current && nextSession?.user) {
            setRecoveryPending(true);
            setSession(null);
            return;
          }

          if (registeringRef.current) {
            if (nextSession?.user) return;
            await clearSession();
            if (active) setSession(null);
            return;
          }

          if (!nextSession?.user) {
            await clearSession();
            if (active) {
              setSession(null);
              if (!recoveryRef.current) setRecoveryPending(false);
            }
            return;
          }

          const result = await persistProfile(nextSession.user);
          if (!active) return;
          setSession(typeof result === 'string' ? null : result);
        })();
      }, 0);
    });

    async function handleUrl(url: string | null) {
      if (!url || !active) return;
      const result = await consumeAuthCallback(url);
      if (!active) return;
      if (typeof result === 'object') return;
      if (result === 'recovery') {
        recoveryRef.current = true;
        setRecoveryPending(true);
        setSession(null);
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      void handleUrl(window.location.href);
    }
    void Linking.getInitialURL().then(handleUrl);
    const linking = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      linking.remove();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      recoveryPending,
      login: async (email, password) => {
        const result = await signInWithPassword(email, password);
        if (typeof result === 'string') return result;
        setRecoveryPending(false);
        setSession(result);
        return null;
      },
      register: async (input) => {
        registeringRef.current = true;
        try {
          const result = await signUpWithPassword(input);
          setSession(null);
          return result;
        } finally {
          setTimeout(() => {
            registeringRef.current = false;
          }, 0);
        }
      },
      requestReset: async (email) => requestPasswordReset(email),
      resetWithCode: async (input) => {
        codeResetRef.current = true;
        const error = await resetPasswordWithCode(input);
        if (error) {
          codeResetRef.current = false;
          return error;
        }
        recoveryRef.current = false;
        setRecoveryPending(false);
        setSession(null);
        return null;
      },
      completeReset: async (password) => {
        codeResetRef.current = true;
        const error = await updatePassword(password);
        if (error) {
          codeResetRef.current = false;
          return error;
        }
        recoveryRef.current = false;
        setRecoveryPending(false);
        setSession(null);
        return null;
      },
      updateProfile: async (input) => {
        const result = await updateOwnProfile(input);
        if (typeof result === 'string') return result;
        setSession(result);
        return null;
      },
      logout: async () => {
        await signOutAuth();
        setRecoveryPending(false);
        setSession(null);
      },
    }),
    [ready, recoveryPending, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
