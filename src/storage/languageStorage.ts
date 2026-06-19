import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppLanguage } from '../i18n/types';

const LANGUAGE_KEY = '@bhuguard/app_language';

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (value === 'en' || value === 'hi' || value === 'gu') {
    return value;
  }

  return null;
}

export async function saveStoredLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
