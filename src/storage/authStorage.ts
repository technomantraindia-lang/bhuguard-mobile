import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AuthUser, UserType } from '../types/auth';
import {
  clearAuthStorage,
  getAuthToken,
  getAuthUser,
  getAuthUserType,
  saveAuthToken,
  saveAuthUser,
} from '../utils/authStorage';

export {
  clearAuthStorage,
  getAuthToken,
  getAuthUser,
  getAuthUserType,
  saveAuthToken,
  saveAuthUser,
} from '../utils/authStorage';

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
    saveAuthToken(token),
    saveAuthUser({ ...user, user_type: userType }),
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

/** @deprecated Use clearAuthStorage */
export const clearAuthSession = clearAuthStorage;
