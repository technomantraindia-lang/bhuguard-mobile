import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearColdStartSessionGate } from '../auth/startup/coldStartGate';
import {
  clearSecureAuthToken,
  getSecureAuthToken,
  setSecureAuthToken,
} from '../storage/secureAuthStorage';
import type { AuthUser } from '../types/auth';

export const AUTH_TOKEN_KEY = 'bhuguard_token';
export const AUTH_USER_KEY = 'bhuguard_user';
export const AUTH_USER_TYPE_KEY = 'bhuguard_user_type';

export async function saveAuthToken(token: string): Promise<void> {
  await setSecureAuthToken(token);
}

export async function getAuthToken(): Promise<string | null> {
  return getSecureAuthToken();
}

export async function removeAuthToken(): Promise<void> {
  await clearSecureAuthToken();
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));

  if (user.user_type) {
    await AsyncStorage.setItem(AUTH_USER_TYPE_KEY, String(user.user_type));
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function removeAuthUser(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_USER_KEY),
    AsyncStorage.removeItem(AUTH_USER_TYPE_KEY),
  ]);
}

export async function clearAuthStorage(): Promise<void> {
  clearColdStartSessionGate();

  await Promise.all([
    clearSecureAuthToken(),
    AsyncStorage.removeItem(AUTH_USER_KEY),
    AsyncStorage.removeItem(AUTH_USER_TYPE_KEY),
  ]);
}

export async function getAuthUserType(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_USER_TYPE_KEY);
}
