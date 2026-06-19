import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getStoredLanguage, saveStoredLanguage } from '../storage/languageStorage';

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
  t: (key: string, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await getStoredLanguage();

      if (stored) {
        setLanguageState(stored);
      }

      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    await saveStoredLanguage(nextLanguage);
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
      t,
    }),
    [language, ready, setLanguage, t],
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
