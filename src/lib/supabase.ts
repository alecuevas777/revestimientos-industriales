import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim() ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_KEY en .env');
}

const memory = new Map<string, string>();

const memoryStorage: SupportedStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
  removeItem: (key) => {
    memory.delete(key);
  },
};

const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: isServerRender ? memoryStorage : AsyncStorage,
    autoRefreshToken: !isServerRender,
    persistSession: !isServerRender,
    detectSessionInUrl: false,
  },
});

if (!isServerRender) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
