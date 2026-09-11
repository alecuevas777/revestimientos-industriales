import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '@/constants/storageKeys';
import type { User } from '@/types';

import { readJson, writeJson } from './json';

export async function getSession() {
  return readJson<User | null>(STORAGE_KEYS.session, null);
}

export async function saveSession(user: User) {
  await writeJson(STORAGE_KEYS.session, user);
}

export async function clearSession() {
  await AsyncStorage.removeItem(STORAGE_KEYS.session);
}
