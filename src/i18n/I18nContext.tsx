import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  getDeviceLanguage,
  resolvePreferredLanguage,
  saveDeviceLanguage,
  saveScopedLanguage,
} from '../storage/languageStorage';
import { getAuthUser } from '../utils/authStorage';
import { resolveUserRole } from '../utils/authRole';
import { normalizeAppLanguage } from '../utils/preferredLanguage';

import { registerLanguageApplyHandler } from './languageSyncBridge';
import type { AppLanguage } from './types';

type TranslationTree = Record<string, unknown>;

const TRANSLATIONS: Record<AppLanguage, TranslationTree> = {
  en: require('./locales/en.json'),
  hi: require('./locales/hi.json'),
  gu: require('./locales/gu.json'),
};

function resolveTranslation(tree: TranslationTree, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in (current as TranslationTree)) {
      return (current as TranslationTree)[part];
    }

    return undefined;
  }, tree);

  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: Record<string, string>): string {
  if (!params) {
    return template;
  }

  let result = template;

  for (const [name, value] of Object.entries(params)) {
    result = result.split(`{{${name}}}`).join(value);
  }

  return result;
}

interface I18nContextValue {
  language: AppLanguage;
  ready: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  applyScopedLanguageForCurrentUser: () => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      const stored = (await resolvePreferredLanguage()) ?? (await getDeviceLanguage());

      if (active && stored) {
        setLanguageState(stored);
      }

      if (active) {
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const applyScopedLanguageForCurrentUser = useCallback(async () => {
    const user = await getAuthUser();

    if (!user) {
      const device = await getDeviceLanguage();

      if (device) {
        setLanguageState(device);
      }

      return;
    }

    const role = resolveUserRole(user) ?? user.user_type;
    const stored = await resolvePreferredLanguage({
      role: role ? String(role) : undefined,
      userId: user.id,
    });
    const fromBackend = normalizeAppLanguage(user.farmer_profile?.preferred_language);
    // Backend preference wins after login when present; otherwise keep local scoped language.
    const nextLanguage = fromBackend ?? stored;

    if (nextLanguage) {
      setLanguageState(nextLanguage);

      if (role) {
        await saveScopedLanguage(String(role), user.id, nextLanguage);
      }
    }
  }, []);

  useEffect(() => {
    registerLanguageApplyHandler(applyScopedLanguageForCurrentUser);

    return () => {
      registerLanguageApplyHandler(null);
    };
  }, [applyScopedLanguageForCurrentUser]);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);

    const user = await getAuthUser();
    const role = user ? resolveUserRole(user) ?? user.user_type : null;

    if (user && role) {
      await saveScopedLanguage(String(role), user.id, nextLanguage);
      return;
    }

    await saveDeviceLanguage(nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>) => {
      const localized =
        resolveTranslation(TRANSLATIONS[language], key) ??
        resolveTranslation(TRANSLATIONS.en, key) ??
        key;

      return interpolate(localized, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      ready,
      setLanguage,
      applyScopedLanguageForCurrentUser,
      t,
    }),
    [language, ready, setLanguage, applyScopedLanguageForCurrentUser, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }

  return context;
}
