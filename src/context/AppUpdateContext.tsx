import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { appUpdateService, type AppUpdateState } from '../services/AppUpdateService';

type CheckReason = 'auto' | 'manual' | 'foreground';

interface AppUpdateContextValue {
  state: AppUpdateState;
  enabled: boolean;
  appReady: boolean;
  markAppReady: () => void;
  checkForUpdates: (reason?: CheckReason) => Promise<AppUpdateState>;
  dismissUpdate: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  applyUpdateNow: () => Promise<void>;
}

const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);
const FOREGROUND_THROTTLE_MS = 6 * 60 * 60 * 1000;

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppUpdateState>(appUpdateService.getState());
  const [appReady, setAppReady] = useState(false);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastForegroundCheckAtRef = useRef(0);

  useEffect(() => {
    void appUpdateService.bootstrap();
    const unsubscribe = appUpdateService.subscribe((next) => setState(next));
    return unsubscribe;
  }, []);

  const checkForUpdates = useCallback(async (reason: CheckReason = 'auto') => {
    return appUpdateService.checkForUpdate({ force: reason === 'manual' });
  }, []);

  const markAppReady = useCallback(() => {
    setAppReady((current) => {
      if (current) {
        return current;
      }
      return true;
    });
  }, []);

  useEffect(() => {
    if (!appReady || !appUpdateService.isEnabled()) {
      return;
    }
    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }
    checkTimerRef.current = setTimeout(() => {
      void checkForUpdates('auto');
    }, 3000);

    return () => {
      if (checkTimerRef.current) {
        clearTimeout(checkTimerRef.current);
        checkTimerRef.current = null;
      }
    };
  }, [appReady, checkForUpdates]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active' || !appReady || !appUpdateService.isEnabled()) {
        return;
      }
      const now = Date.now();
      if (now - lastForegroundCheckAtRef.current < FOREGROUND_THROTTLE_MS) {
        return;
      }
      lastForegroundCheckAtRef.current = now;
      void checkForUpdates('foreground');
    });
    return () => {
      subscription.remove();
    };
  }, [appReady, checkForUpdates]);

  const value = useMemo<AppUpdateContextValue>(
    () => ({
      state,
      enabled: appUpdateService.isEnabled(),
      appReady,
      markAppReady,
      checkForUpdates,
      dismissUpdate: () => appUpdateService.dismissAvailableUpdate(),
      downloadUpdate: async () => {
        await appUpdateService.downloadUpdate();
      },
      applyUpdateNow: async () => {
        await appUpdateService.applyUpdateNow();
      },
    }),
    [appReady, checkForUpdates, markAppReady, state],
  );

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate(): AppUpdateContextValue {
  const ctx = useContext(AppUpdateContext);
  if (!ctx) {
    throw new Error('useAppUpdate must be used within AppUpdateProvider.');
  }
  return ctx;
}
