import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { dashboardTheme, dashboardThemeDark } from '../theme/bhuguardDashboardTheme';

const STORAGE_KEY = 'bhuguard.dark_mode';

export type DashboardThemeTokens = typeof dashboardTheme | typeof dashboardThemeDark;

type ThemeContextValue = {
  isDarkMode: boolean;
  theme: DashboardThemeTokens;
  setDarkMode: (enabled: boolean) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      setIsDarkMode(value === '1');
      setReady(true);
    });
  }, []);

  const setDarkMode = useCallback(async (enabled: boolean) => {
    setIsDarkMode(enabled);
    await AsyncStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
  }, []);

  const toggleDarkMode = useCallback(async () => {
    await setDarkMode(!isDarkMode);
  }, [isDarkMode, setDarkMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDarkMode,
      theme: isDarkMode ? dashboardThemeDark : dashboardTheme,
      setDarkMode,
      toggleDarkMode,
    }),
    [isDarkMode, setDarkMode, toggleDarkMode],
  );

  if (!ready) {
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    return {
      isDarkMode: false,
      theme: dashboardTheme,
      setDarkMode: async () => undefined,
      toggleDarkMode: async () => undefined,
    };
  }

  return context;
}
