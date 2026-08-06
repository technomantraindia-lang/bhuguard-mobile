import { API_BASE_URL, APP_URL } from './env';

/** Canonical app origin for media/files and web links. */
export const PUBLIC_APP_URL = APP_URL;

export { API_BASE_URL, APP_URL, DEMO_API_BASE_URL, LOCAL_API_BASE_URL, PRODUCTION_API_BASE_URL } from './env';

/** Baked canonical API base URL for all clients. */
export const BUILD_API_BASE_URL = API_BASE_URL;
