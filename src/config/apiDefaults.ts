import { DEMO_API_BASE_URL, resolveBuildApiBaseUrl } from './env';

/** @deprecated Use DEMO_API_BASE_URL from ./env for documentation defaults. */
export const PUBLIC_API_BASE_URL = '';

export { DEMO_API_BASE_URL, LOCAL_API_BASE_URL, PRODUCTION_API_BASE_URL } from './env';

/** Baked in at EAS / Gradle build time via EXPO_PUBLIC_API_URL. */
export const BUILD_API_BASE_URL = resolveBuildApiBaseUrl();
