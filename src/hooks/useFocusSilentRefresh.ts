import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Re-fetch screen data on focus without recreating the callback each render. */
export function useFocusSilentRefresh(refresh: () => void | Promise<void>, enabled = true): void {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void refreshRef.current();
      }
    }, [enabled]),
  );
}
