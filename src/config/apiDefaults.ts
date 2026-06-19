/** No default tunnel URL — set via Server settings or EXPO_PUBLIC_API_URL. */
export const PUBLIC_API_BASE_URL = '';

/** Baked in at EAS build time via EXPO_PUBLIC_API_URL. */
export const BUILD_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || PUBLIC_API_BASE_URL;