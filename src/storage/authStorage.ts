import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthUser, UserType } from '../types/auth';

export const AUTH_TOKEN_KEY = 'bhuguard_token';
export const AUTH_USER_KEY = 'bhuguard_user';
export const AUTH_USER_TYPE_KEY = 'bhuguard_user_type';
export const AUTH_MPIN_PROFILE_KEY = 'bhuguard_mpin_profile';

export interface MpinProfile {
  mobile: string;
  name: string;
}

export async function saveAuthSession(
  token: string,
  user: AuthUser,
  userType: UserType,
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
    AsyncStorage.setItem(AUTH_USER_TYPE_KEY, userType),
    saveMpinProfile({ mobile: user.mobile, name: user.name }),
  ]);
}

export async function saveMpinProfile(profile: MpinProfile): Promise<void> {
  await AsyncStorage.setItem(AUTH_MPIN_PROFILE_KEY, JSON.stringify(profile));
}

export async function getMpinProfile(): Promise<MpinProfile | null> {
  const raw = await AsyncStorage.getItem(AUTH_MPIN_PROFILE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as MpinProfile;
  } catch {
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
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

export async function getAuthUserType(): Promise<UserType | null> {
  return AsyncStorage.getItem(AUTH_USER_TYPE_KEY);
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(AUTH_USER_KEY),
    AsyncStorage.removeItem(AUTH_USER_TYPE_KEY),
  ]);
}
