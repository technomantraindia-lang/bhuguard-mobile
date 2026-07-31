/**
 * Central API environment configuration.
 * Values come from EXPO_PUBLIC_* at build time (.env / EAS profile).
 * Do not hardcode URLs in screens — import from apiDefaults or apiConfigStorage.
 */

/** Live app origin (media, storage, /up health checks). */
export const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL?.trim() || 'https://erp.bhuguard.com';

/** Live HTTPS API for production / TestFlight / App Store builds. */
export const PRODUCTION_API_BASE_URL = 'https://erp.bhuguard.com/api';

/**
 * Demo profile now points at the live ERP so client builds stay on production data.
 * Prefer PRODUCTION_API_BASE_URL / EXPO_PUBLIC_API_URL for new code.
 */
export const DEMO_API_BASE_URL = PRODUCTION_API_BASE_URL;

/**
 * Preset for "Use production server" in Server settings.
 * Override with EXPO_PUBLIC_DEV_LOCAL_API_URL only when intentionally targeting another host.
 */
export const LOCAL_API_BASE_URL =
  process.env.EXPO_PUBLIC_DEV_LOCAL_API_URL?.trim() || PRODUCTION_API_BASE_URL;

export type AppVariant = 'development' | 'demo' | 'production';

export const APP_VARIANT: AppVariant =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'demo'
    ? 'demo'
    : process.env.EXPO_PUBLIC_APP_VARIANT === 'production'
      ? 'production'
      : 'development';

import { isLiveProductionApiUrl, isPlaceholderApiUrl, isTryCloudflareTunnelUrl } from './apiUrlValidation';

/** Baked into release builds via EXPO_PUBLIC_API_URL. Falls back to live ERP when missing or invalid. */
export function resolveBuildApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (
    fromEnv &&
    !isPlaceholderApiUrl(fromEnv) &&
    !isTryCloudflareTunnelUrl(fromEnv) &&
    isLiveProductionApiUrl(fromEnv)
  ) {
    return fromEnv.replace(/\/+$/, '').endsWith('/api')
      ? fromEnv.replace(/\/+$/, '')
      : `${fromEnv.replace(/\/+$/, '')}/api`;
  }

  return PRODUCTION_API_BASE_URL;
}

export const IS_DEMO_BUILD = APP_VARIANT === 'demo';
