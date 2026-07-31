/**
 * Development-only Consent & Legal OTP helpers.
 * Never enabled when EXPO_PUBLIC_APP_VARIANT is production.
 */
export function isDemoConsentOtpEnabled(): boolean {
  if (process.env.EXPO_PUBLIC_APP_VARIANT === 'production') {
    return false;
  }

  return process.env.EXPO_PUBLIC_ENABLE_DEMO_CONSENT_OTP === 'true';
}

export function getDemoConsentOtpCode(): string {
  const configured = String(process.env.EXPO_PUBLIC_DEMO_CONSENT_OTP ?? '123456').trim();
  return /^\d{6}$/.test(configured) ? configured : '123456';
}

export function isDemoConsentOtpMatch(otp: string): boolean {
  return isDemoConsentOtpEnabled() && hashEquals(getDemoConsentOtpCode(), otp);
}

function hashEquals(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }

  return mismatch === 0;
}
