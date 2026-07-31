import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

export interface HighAccuracyGpsReading {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
}

/**
 * Samples multiple GPS readings and returns the most accurate one.
 */
export async function sampleHighAccuracyGps(samples = 3): Promise<HighAccuracyGpsReading> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Location permission is required for GPS capture.');
  }

  const readings: HighAccuracyGpsReading[] = [];

  for (let index = 0; index < samples; index += 1) {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
    });

    readings.push({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      altitude: position.coords.altitude ?? null,
    });

    if (index < samples - 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }

  readings.sort((left, right) => (left.accuracy ?? 999) - (right.accuracy ?? 999));

  return readings[0];
}

export function useHighAccuracyGps() {
  const [sampling, setSampling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sample = useCallback(async (): Promise<HighAccuracyGpsReading | null> => {
    setSampling(true);
    setError(null);

    try {
      return await sampleHighAccuracyGps();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to capture GPS.');
      return null;
    } finally {
      setSampling(false);
    }
  }, []);

  return { sampling, error, sample };
}
