/**
 * Live endpoint abstraction for server-authoritative time (Phase 19).
 * Paths are relative to the configured API base URL — never hardcode hosts here.
 * Deployment/base-URL selection stays in apiConfig / apiConfigStorage.
 */

/** Preferred authenticated (or public) server-time JSON endpoint. */
export const SERVER_TIME_ENDPOINT_PATH = '/server-time';

/**
 * Fallback probe used only to read the HTTP Date header when `/server-time`
 * is unavailable. Must be a lightweight, always-reachable API route.
 */
export const SERVER_TIME_HEADER_FALLBACK_PATH = '/health';

export const SERVER_TIME_ENDPOINT_CANDIDATES = [
  SERVER_TIME_ENDPOINT_PATH,
  SERVER_TIME_HEADER_FALLBACK_PATH,
] as const;
