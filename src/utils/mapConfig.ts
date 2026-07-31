import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PLACEHOLDER_API_KEYS = new Set([
  '',
  'USER_REAL_GOOGLE_MAPS_ANDROID_API_KEY',
  'your_google_maps_api_key',
  'YOUR_GOOGLE_MAPS_API_KEY',
  'PASTE_YOUR_REAL_KEY_HERE',
  'PASTE_REAL_GOOGLE_MAPS_API_KEY_HERE',
]);

const extra = (Constants.expoConfig?.extra ?? {}) as {
  appVariant?: string;
  googleMapsApiKeyConfigured?: boolean;
  useNativeMaps?: boolean;
};

const envUseNativeMaps = process.env.EXPO_PUBLIC_USE_NATIVE_MAPS;
const explicitNativeMapsDisabled = envUseNativeMaps === 'false';
const isDevelopmentBuild = extra.appVariant === 'development';

export const USE_NATIVE_MAPS =
  envUseNativeMaps === 'true'
  || extra.useNativeMaps === true
  || (isDevelopmentBuild && !explicitNativeMapsDisabled);

export const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';

export function isRealGoogleMapsApiKey(value: string): boolean {
  return value.length >= 20 && !PLACEHOLDER_API_KEYS.has(value) && value.startsWith('AIza');
}

export const HAS_GOOGLE_MAPS_API_KEY =
  isRealGoogleMapsApiKey(GOOGLE_MAPS_API_KEY) || extra.googleMapsApiKeyConfigured === true;

export const MAPS_SUPPORTED_PLATFORM = Platform.OS === 'android' || Platform.OS === 'ios';

export const MAP_CONFIGURATION_READY =
  USE_NATIVE_MAPS && HAS_GOOGLE_MAPS_API_KEY && MAPS_SUPPORTED_PLATFORM;

export function canUseNativeGoogleMap(): boolean {
  return MAP_CONFIGURATION_READY;
}

export function getMapConfigurationIssue(): string | null {
  if (!MAPS_SUPPORTED_PLATFORM) {
    return 'Satellite map is only supported on Android and iOS devices.';
  }

  if (!USE_NATIVE_MAPS) {
    return 'Native maps are disabled. Set EXPO_PUBLIC_USE_NATIVE_MAPS=true in .env, then restart Metro with --clear.';
  }

  if (!HAS_GOOGLE_MAPS_API_KEY) {
    return 'Google Satellite Map configuration is incomplete. Add the real Google Maps Android API key to C:\\Users\\Admin\\Desktop\\bhuguard-mobile\\.env';
  }

  return null;
}

export function maskGoogleMapsApiKey(value: string): string {
  if (!value || value.length < 8) {
    return '(missing)';
  }

  return `${value.slice(0, 6)}****${value.slice(-4)}`;
}
