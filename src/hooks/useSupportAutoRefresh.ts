import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

interface UseSupportAutoRefreshOptions {
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * Silently refreshes support data while the screen is focused and when the app returns to foreground.
 */
export function useSupportAutoRefresh(
  refresh: (silent: boolean) => Promise<void> | void,
  { intervalMs = 8000, enabled = true }: UseSupportAutoRefreshOptions = {},
) {
  const isFocused = useIsFocused();
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const runSilent = useCallback(() => {
    void refreshRef.current(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      void refreshRef.current(false);

      const timer = setInterval(runSilent, intervalMs);

      return () => clearInterval(timer);
    }, [enabled, intervalMs, runSilent]),
  );

  useEffect(() => {
    if (!enabled || !isFocused) {
      return undefined;
    }

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        runSilent();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => subscription.remove();
  }, [enabled, isFocused, runSilent]);
}
