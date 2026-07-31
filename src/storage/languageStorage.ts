import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppLanguage } from '../i18n/types';

const LEGACY_LANGUAGE_KEY = '@bhuguard/app_language';
const DEVICE_LANGUAGE_KEY = '@bhuguard/language/device';
const MIGRATION_KEY = '@bhuguard/language/migrated_v1';

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'en' || value === 'hi' || value === 'gu';
}

function scopedKey(role: string, userId: number | string): string {
  return `@bhuguard/language/${role}:${userId}`;
}

async function migrateLegacyOnce(): Promise<void> {
  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);

  if (migrated === '1') {
    return;
  }

  const legacy = await AsyncStorage.getItem(LEGACY_LANGUAGE_KEY);

  if (isAppLanguage(legacy)) {
    const device = await AsyncStorage.getItem(DEVICE_LANGUAGE_KEY);

    if (!isAppLanguage(device)) {
      await AsyncStorage.setItem(DEVICE_LANGUAGE_KEY, legacy);
    }
  }

  await AsyncStorage.setItem(MIGRATION_KEY, '1');
}

export async function getDeviceLanguage(): Promise<AppLanguage | null> {
  await migrateLegacyOnce();
  const value = await AsyncStorage.getItem(DEVICE_LANGUAGE_KEY);

  return isAppLanguage(value) ? value : null;
}

export async function saveDeviceLanguage(language: AppLanguage): Promise<void> {
  await migrateLegacyOnce();
  await AsyncStorage.setItem(DEVICE_LANGUAGE_KEY, language);
  await AsyncStorage.setItem(LEGACY_LANGUAGE_KEY, language);
}

export async function getScopedLanguage(role: string, userId: number | string): Promise<AppLanguage | null> {
  await migrateLegacyOnce();
  const value = await AsyncStorage.getItem(scopedKey(role, userId));

  return isAppLanguage(value) ? value : null;
}

export async function saveScopedLanguage(
  role: string,
  userId: number | string,
  language: AppLanguage,
): Promise<void> {
  await migrateLegacyOnce();
  await AsyncStorage.setItem(scopedKey(role, userId), language);
  await saveDeviceLanguage(language);
}

/** Prefer scoped language for authenticated user; otherwise device default. */
export async function resolvePreferredLanguage(options?: {
  role?: string | null;
  userId?: number | string | null;
}): Promise<AppLanguage | null> {
  await migrateLegacyOnce();

  if (options?.role && options.userId != null) {
    const scoped = await getScopedLanguage(options.role, options.userId);

    if (scoped) {
      return scoped;
    }
  }

  return getDeviceLanguage();
}

/** @deprecated Prefer getDeviceLanguage / resolvePreferredLanguage */
export async function getStoredLanguage(): Promise<AppLanguage | null> {
  return resolvePreferredLanguage();
}

/** @deprecated Prefer saveDeviceLanguage / saveScopedLanguage */
export async function saveStoredLanguage(language: AppLanguage): Promise<void> {
  await saveDeviceLanguage(language);
}
