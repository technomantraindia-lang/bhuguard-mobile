/**
 * Locked production server configuration (runtime immutable).
 * Do not add local/tunnel/runtime-switch alternatives in this build.
 */
export const APP_URL = 'https://erp.bhuguard.com';
export const API_BASE_URL = 'https://erp.bhuguard.com/api';

export type AppVariant = 'development' | 'demo' | 'production';

export const APP_VARIANT: AppVariant =
  process.env.EXPO_PUBLIC_APP_VARIANT === 'development'
    ? 'development'
    : process.env.EXPO_PUBLIC_APP_VARIANT === 'demo'
      ? 'demo'
      : 'production';

export const PRODUCTION_API_BASE_URL = API_BASE_URL;
export const DEMO_API_BASE_URL = API_BASE_URL;
export const LOCAL_API_BASE_URL = API_BASE_URL;
export const DEFAULT_DEV_LOCAL_API_BASE_URL = API_BASE_URL;
export const IS_DEMO_BUILD = APP_VARIANT === 'demo';

export function resolveBuildApiBaseUrl(): string {
  return API_BASE_URL;
}

export function isDevelopmentApiVariant(): boolean {
  return APP_VARIANT === 'development';
}
