/**
 * Central API environment configuration.
 * Values come from EXPO_PUBLIC_* at build time (.env / EAS profile).
 * Do not hardcode URLs in screens — import from apiDefaults or apiConfigStorage.
 */

/** Live HTTPS API for production / TestFlight / App Store builds. Replace yourdomain.com before release. */
export const PRODUCTION_API_BASE_URL = 'https://yourdomain.com/api';

/** Public demo server — used when production URL is still a placeholder. */
export const DEMO_API_BASE_URL = 'https://demo.bhuguard.com/api';

/**
 * Dev-only preset for "Use local PC" in Server settings.
 * Override with EXPO_PUBLIC_DEV_LOCAL_API_URL in .env.development or EAS development profile.
 */
export const LOCAL_API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_LOCAL_API_URL?.trim() || 'http://192.168.0.100:8000/api';

export type AppVariant = 'development' | 'demo' | 'production';

export const APP_VARIANT: AppVariant =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'demo'
    ? 'demo'
    : process.env.EXPO_PUBLIC_APP_VARIANT === 'production'
      ? 'production'
      : 'development';

import { isPlaceholderApiUrl } from './apiUrlValidation';

/** Baked into release builds via EXPO_PUBLIC_API_URL. Falls back to demo when URL is missing or placeholder. */
export function resolveBuildApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (fromEnv && !isPlaceholderApiUrl(fromEnv)) {
    return fromEnv;
  }

  if (APP_VARIANT === 'demo') {
    return DEMO_API_BASE_URL;
  }

  if (isPlaceholderApiUrl(PRODUCTION_API_BASE_URL)) {
    return DEMO_API_BASE_URL;
  }

  return PRODUCTION_API_BASE_URL;
}

export const IS_DEMO_BUILD = APP_VARIANT === 'demo' || APP_VARIANT === 'production';
