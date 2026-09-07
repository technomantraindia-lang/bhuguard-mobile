import AsyncStorage from '@react-native-async-storage/async-storage';

const STALE_WORKING_AREA_KEY_PREFIXES = [
  '@bhuguard/location-master',
  '@bhuguard/working-area',
  '@bhuguard/allocated-locations',
  'bhuguard:location-master',
  'bhuguard:working-area',
];

/** Remove legacy location-master cache keys without touching auth, drafts, or session. */
export async function clearStaleWorkingAreaCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const stale = keys.filter((key) =>
      STALE_WORKING_AREA_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)),
    );

    if (stale.length > 0) {
      await AsyncStorage.multiRemove(stale);
    }
  } catch {
    // Ignore storage failures.
  }
}
