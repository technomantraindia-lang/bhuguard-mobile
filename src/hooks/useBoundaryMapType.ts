import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type BoundaryMapType = 'satellite' | 'standard';

const STORAGE_KEY = 'bhuguard_boundary_map_type';

function parseStoredMapType(value: string | null): BoundaryMapType {
  return value === 'standard' ? 'standard' : 'satellite';
}

export function useBoundaryMapType() {
  const [mapType, setMapType] = useState<BoundaryMapType>('satellite');
  const [hydrated, setHydrated] = useState(false);

  const restoreMapType = useCallback(async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    setMapType(parseStoredMapType(saved));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (!cancelled) {
        setMapType(parseStoredMapType(saved));
        setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMapType = useCallback(async () => {
    setMapType((current) => {
      const next: BoundaryMapType = current === 'satellite' ? 'standard' : 'satellite';
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const setMapTypePreference = useCallback(async (next: BoundaryMapType) => {
    setMapType(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  return {
    mapType,
    isSatellite: mapType === 'satellite',
    hydrated,
    toggleMapType,
    restoreMapType,
    setMapTypePreference,
  };
}
