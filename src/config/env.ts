/**
 * Central API environment configuration.
 * Values come from EXPO_PUBLIC_* at build time (.env / EAS profile).
 * Do not hardcode URLs in screens — import from apiDefaults or apiConfigStorage.
 */

/** Public demo server (client APK / internet testing). */
export const DEMO_API_BASE_URL = 'https://demo.bhuguard.com/api';

/** Typical local dev server (same Wi‑Fi only). */
export const LOCAL_API_BASE_URL = 'http://192.168.1.18:8000/api';

export type AppVariant = 'development' | 'demo' | 'production';

export const APP_VARIANT: AppVariant =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'demo'
    ? 'demo'
    : process.env.EXPO_PUBLIC_APP_VARIANT === 'production'
      ? 'production'
      : 'development';

/** Baked into release builds via EXPO_PUBLIC_API_URL. Falls back to demo URL for demo variant. */
export function resolveBuildApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (fromEnv) {
    return fromEnv;
  }

  if (APP_VARIANT === 'demo' || APP_VARIANT === 'production') {
    return DEMO_API_BASE_URL;
  }

  return LOCAL_API_BASE_URL;
}

export const IS_DEMO_BUILD = APP_VARIANT === 'demo' || APP_VARIANT === 'production';
