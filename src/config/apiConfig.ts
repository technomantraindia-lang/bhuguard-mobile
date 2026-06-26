import { LOCAL_API_BASE_URL } from './env';

/**
 * Single source of truth for API base URL configuration.
 * Screens and services must import from here — never hardcode URLs.
 */
export const API_BASE_URL = LOCAL_API_BASE_URL;
export {
  APP_VARIANT,
  DEMO_API_BASE_URL,
  IS_DEMO_BUILD,
  LOCAL_API_BASE_URL,
  resolveBuildApiBaseUrl,
  type AppVariant,
} from './env';

export { BUILD_API_BASE_URL } from './apiDefaults';

export {
  bootstrapApiBaseUrl,
  getApiBaseUrl,
  getCachedApiBaseUrl,
  getDefaultApiBaseUrl,
  normalizeApiBaseUrl,
  saveApiBaseUrl,
  testApiConnection,
} from '../storage/apiConfigStorage';
