/**
 * Central API environment configuration.
 * Values come from EXPO_PUBLIC_* at build time (.env / EAS profile).
 * Do not hardcode URLs in screens — import from apiDefaults or apiConfigStorage.
 */

import { isPlaceholderApiUrl, isTryCloudflareTunnelUrl } from './apiUrlValidation';

/** Live app origin (media, storage, /up health checks). */
export const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL?.trim() || 'https://erp.bhuguard.com';

/** Live HTTPS API for production / TestFlight / App Store builds. */
export const PRODUCTION_API_BASE_URL = 'https://erp.bhuguard.com/api';

/**
 * Demo profile points at the live ERP so client builds stay on production data.
 * Prefer PRODUCTION_API_BASE_URL / EXPO_PUBLIC_API_URL for new code.
 */
export const DEMO_API_BASE_URL = PRODUCTION_API_BASE_URL;

/** Default LAN Laravel API used during local Expo development. */
export const DEFAULT_DEV_LOCAL_API_BASE_URL = 'http://192.168.1.11:8000/api';

export type AppVariant = 'development' | 'demo' | 'production';

export const APP_VARIANT: AppVariant =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'demo'
    ? 'demo'
    : process.env.EXPO_PUBLIC_APP_VARIANT === 'production'
      ? 'production'
      : 'development';

export function isDevelopmentApiVariant(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }

  return APP_VARIANT === 'development';
}

function normalizeApiUrl(raw: string): string {
  const clean = raw.replace(/\/+$/, '');

  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

/**
 * Preset for "Use local server" in Server settings.
 * Development never falls back to production.
 */
export const LOCAL_API_BASE_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_DEV_LOCAL_API_URL?.trim() ||
    (isDevelopmentApiVariant()
      ? process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_DEV_LOCAL_API_BASE_URL
      : PRODUCTION_API_BASE_URL),
);

/**
 * Resolve API URL from .env / EAS.
 * Development uses EXPO_PUBLIC_API_URL (or LAN default) — never silent production fallback.
 * Production builds fall back to live ERP when EXPO_PUBLIC_API_URL is missing/invalid.
 */
export function resolveBuildApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (
    fromEnv &&
    !isPlaceholderApiUrl(fromEnv) &&
    !isTryCloudflareTunnelUrl(fromEnv)
  ) {
    return normalizeApiUrl(fromEnv);
  }

  if (isDevelopmentApiVariant()) {
    const local =
      process.env.EXPO_PUBLIC_DEV_LOCAL_API_URL?.trim() || DEFAULT_DEV_LOCAL_API_BASE_URL;

    return normalizeApiUrl(local);
  }

  return PRODUCTION_API_BASE_URL;
}

export const IS_DEMO_BUILD = APP_VARIANT === 'demo';
