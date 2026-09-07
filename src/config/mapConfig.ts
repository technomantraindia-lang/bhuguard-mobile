import Constants from 'expo-constants';

/**
 * Central MapTiler key resolver for MapLibre maps.
 * Prefer inlined EXPO_PUBLIC_* at bundle time, then Expo config `extra` (OTA/production).
 */

const PLACEHOLDER_PATTERN = /your_|paste_|placeholder|maptiler_key|undefined|null/i;

type MapExtra = {
  mapTilerApiKey?: unknown;
  mapTilerApiKeyConfigured?: unknown;
  mapTilerHybridStyleId?: unknown;
  mapTilerStreetStyleId?: unknown;
};

function readExtra(): MapExtra {
  return (Constants.expoConfig?.extra ?? {}) as MapExtra;
}

function normalizeKey(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isConfiguredKey(key: string): boolean {
  if (key.length < 16) {
    return false;
  }
  return !PLACEHOLDER_PATTERN.test(key);
}

const envKey = normalizeKey(process.env.EXPO_PUBLIC_MAPTILER_API_KEY);
const extraKey = normalizeKey(readExtra().mapTilerApiKey);

export const MAPTILER_API_KEY = envKey || extraKey;

export const MAPTILER_CONFIGURED = isConfiguredKey(MAPTILER_API_KEY);

export const MAPTILER_HYBRID_STYLE_ID =
  normalizeKey(process.env.EXPO_PUBLIC_MAPTILER_HYBRID_STYLE_ID)
  || normalizeKey(process.env.EXPO_PUBLIC_MAPTILER_STYLE_ID)
  || normalizeKey(readExtra().mapTilerHybridStyleId)
  || 'hybrid-v4';

export const MAPTILER_STREET_STYLE_ID =
  normalizeKey(process.env.EXPO_PUBLIC_MAPTILER_STREET_STYLE_ID)
  || normalizeKey(readExtra().mapTilerStreetStyleId)
  || 'streets-v4';

export function getMapTilerApiKey(): string {
  return MAPTILER_CONFIGURED ? MAPTILER_API_KEY : '';
}
