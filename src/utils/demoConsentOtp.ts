/**
 * Client-side fixed Consent OTP helpers are intentionally removed.
 * Development Consent OTP must be created by the live backend and returned as `dev_otp`.
 * Display the Developer OTP card only when the Send OTP API response includes `dev_otp`.
 */

export function isDemoConsentOtpEnabled(): boolean {
  return false;
}

export function getDemoConsentOtpCode(): string {
  return '';
}

export function isDemoConsentOtpMatch(_otp: string): boolean {
  return false;
}
