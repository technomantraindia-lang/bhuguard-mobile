import { APP_VARIANT, API_BASE_URL } from '../config/env';

const LOCAL_HOST_PATTERNS = [
  /^https?:\/\/localhost(?::\d+)?(?:\/|$)/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?(?:\/|$)/i,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(?:\/|$)/i,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?(?:\/|$)/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(?::\d+)?(?:\/|$)/i,
];

export function isDevelopmentBuild(): boolean {
  return APP_VARIANT === 'development';
}

export function isLocalLanApiUrl(apiBaseUrl = API_BASE_URL): boolean {
  const normalized = apiBaseUrl.trim();
  if (!normalized) {
    return false;
  }
  return LOCAL_HOST_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function usesLocalDevelopmentApi(apiBaseUrl = API_BASE_URL): boolean {
  return isDevelopmentBuild() && isLocalLanApiUrl(apiBaseUrl);
}

export function buildOnboardingSubmitRequestUrl(
  apiBaseUrl: string,
  farmerId: number | null,
  preparedDraft: boolean,
): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  if (preparedDraft && farmerId != null) {
    return `${base}/field-officer/farmers/${farmerId}/finalize-onboarding`;
  }
  return `${base}/field-officer/farmers`;
}
