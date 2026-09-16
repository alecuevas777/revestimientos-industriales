import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  persistProfile,
  restoreAuthSession,
  signInWithPassword,
  signOutAuth,
  signUpWithPassword,
  type RegisterResult,
} from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { clearSession } from '@/storage/sessionStorage';
import type { User } from '@/types';

type AuthContextValue = {
  ready: boolean;
  session: User | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (input: { name: string; email: string; password: string }) => Promise<RegisterResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    restoreAuthSession()
      .then((user) => {
        if (!active) return;
        setSession(user);
      })
      .finally(() => {
        if (active) setReady(true);
      });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setTimeout(() => {
        void (async () => {
          if (!active) return;
          if (event === 'INITIAL_SESSION') return;

          if (!nextSession?.user) {
            await clearSession();
            if (active) setSession(null);
            return;
          }

          const result = await persistProfile(nextSession.user);
          if (!active) return;
          setSession(typeof result === 'string' ? null : result);
        })();
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      login: async (email, password) => {
        const result = await signInWithPassword(email, password);
        if (typeof result === 'string') return result;
        setSession(result);
        return null;
      },
      register: async (input) => {
        const result = await signUpWithPassword(input);
        if (result.ok && !result.needsEmailConfirmation) {
          const restored = await restoreAuthSession();
          setSession(restored);
        }
        return result;
      },
      logout: async () => {
        await signOutAuth();
        setSession(null);
      },
    }),
    [ready, session],
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
