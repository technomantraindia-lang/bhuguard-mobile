import { getCurrentUser } from '../../api/authApi';
import type { RootStackParamList } from '../../navigation/types';
import { getMpinProfile } from '../../storage/authStorage';
import { resolvePreferredLanguage } from '../../storage/languageStorage';
import type { AuthUser } from '../../types/auth';
import { isAdminRole, isCompanyRole, resolveUserRole } from '../../utils/authRole';
import { getDashboardRoute, isMobileSupportedRole } from '../../utils/authRouting';
import { clearAuthStorage, getAuthToken, saveAuthUser } from '../../utils/authStorage';

import {
  clearColdStartSessionGate,
  getValidatedColdStartUser,
  markColdStartLanguageShown,
  markUnlockCompleted,
  setValidatedColdStartUser,
  wasColdStartLanguageShown,
  wasUnlockCompleted,
} from './coldStartGate';

export type AuthStartupPhase =
  | 'loading'
  | 'language_selection'
  | 'mobile_login'
  | 'otp_verification'
  | 'otp_login'
  | 'mpin_setup'
  | 'biometric_setup'
  | 'locked'
  | 'authenticated';

export type StartupRoute =
  | { name: 'LanguageSelection' }
  | { name: 'MobileLogin' }
  | { name: 'MpinLogin'; params: RootStackParamList['MpinLogin'] }
  | { name: 'CreateMpin'; params: RootStackParamList['CreateMpin'] }
  | { name: 'BiometricSetup'; params?: RootStackParamList['BiometricSetup'] }
  | { name: keyof RootStackParamList; params?: object };

export {
  clearColdStartSessionGate,
  getValidatedColdStartUser,
  markColdStartLanguageShown,
  markUnlockCompleted,
  wasColdStartLanguageShown,
  wasUnlockCompleted,
};

let authStartupPhase: AuthStartupPhase = 'loading';

export function getAuthStartupPhase(): AuthStartupPhase {
  return authStartupPhase;
}

export function setAuthStartupPhase(phase: AuthStartupPhase): void {
  authStartupPhase = phase;
}

function normalizeMobile(value: unknown): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(-10);
}

async function userHasMpin(user: AuthUser): Promise<boolean> {
  if (typeof (user as AuthUser & { has_mpin?: boolean }).has_mpin === 'boolean') {
    return Boolean((user as AuthUser & { has_mpin?: boolean }).has_mpin);
  }

  const profile = await getMpinProfile();
  const userMobile = normalizeMobile(user.mobile);

  return Boolean(profile?.mobile && normalizeMobile(profile.mobile) === userMobile);
}

function unlockRouteForUser(user: AuthUser): StartupRoute {
  const role = (resolveUserRole(user) ?? user.user_type) as string;
  const mobile = normalizeMobile(user.mobile);

  return {
    name: 'MpinLogin',
    params: {
      mobile,
      name: user.name,
      role: role as RootStackParamList['MpinLogin']['role'],
      mode: 'unlock',
    },
  };
}

function setupMpinRouteForUser(user: AuthUser): StartupRoute {
  return {
    name: 'CreateMpin',
    params: {
      mobile: normalizeMobile(user.mobile),
      mode: 'setup',
      flowOrigin: 'auth',
    },
  };
}

/**
 * Trusted session = stored bearer token that still validates via GET /auth/me.
 * (No refresh-token API exists in this app.)
 */
export async function validateTrustedSession(): Promise<AuthUser | null> {
  const token = await getAuthToken();

  if (!token) {
    setValidatedColdStartUser(null);
    return null;
  }

  try {
    const user = await getCurrentUser();
    const role = resolveUserRole(user) ?? user.user_type;

    if (isAdminRole(role) || isCompanyRole(role) || !isMobileSupportedRole(role)) {
      await clearAuthStorage();
      setValidatedColdStartUser(null);
      return null;
    }

    await saveAuthUser(user);
    setValidatedColdStartUser(user);
    return user;
  } catch {
    await clearAuthStorage();
    setValidatedColdStartUser(null);
    return null;
  }
}

/** Always LanguageSelection after preloader on cold start. Never open dashboard here. */
export async function routeAfterPreloader(): Promise<StartupRoute> {
  setAuthStartupPhase('language_selection');
  // Warm session validation in parallel; Language screen does not wait on it.
  void validateTrustedSession();
  return { name: 'LanguageSelection' };
}

export async function resolveLanguageForContinue(): Promise<{
  languageRole?: string;
  languageUserId?: number;
}> {
  const user = getValidatedColdStartUser() ?? (await getAuthUserSafe());

  if (!user) {
    return {};
  }

  const role = resolveUserRole(user) ?? user.user_type;

  return {
    languageRole: role ? String(role) : undefined,
    languageUserId: user.id,
  };
}

async function getAuthUserSafe(): Promise<AuthUser | null> {
  try {
    const { getAuthUser } = await import('../../utils/authStorage');
    return getAuthUser();
  } catch {
    return null;
  }
}

/**
 * After language selection:
 * - trusted session valid + MPIN → unlock screen
 * - trusted session valid, no MPIN → MPIN setup
 * - otherwise → Mobile Number login
 *
 * Never navigates directly to a role dashboard.
 */
export async function routeAfterLanguageContinue(): Promise<StartupRoute> {
  markColdStartLanguageShown();

  const user = getValidatedColdStartUser() ?? (await validateTrustedSession());

  if (!user) {
    setAuthStartupPhase('mobile_login');
    return { name: 'MobileLogin' };
  }

  const hasMpin = await userHasMpin(user);

  if (hasMpin) {
    setAuthStartupPhase('locked');
    return unlockRouteForUser(user);
  }

  setAuthStartupPhase('mpin_setup');
  return setupMpinRouteForUser(user);
}

/**
 * After the user enters a mobile number (first login / another mobile):
 * - matching trusted session + MPIN → unlock
 * - matching trusted session, no MPIN → setup
 * - otherwise → null (caller should request OTP)
 */
export async function resolveRouteAfterMobileContinue(mobile: string): Promise<StartupRoute | null> {
  const normalized = normalizeMobile(mobile);

  if (!/^\d{10}$/.test(normalized)) {
    return null;
  }

  const user = getValidatedColdStartUser() ?? (await validateTrustedSession());

  if (!user) {
    return null;
  }

  const trustedMobile = normalizeMobile(user.mobile);

  if (trustedMobile !== normalized) {
    return null;
  }

  const hasMpin = await userHasMpin(user);

  if (!hasMpin) {
    setAuthStartupPhase('mpin_setup');
    return setupMpinRouteForUser(user);
  }

  setAuthStartupPhase('locked');
  return unlockRouteForUser(user);
}

/**
 * Clear only the trusted login selection (token + user + cold-start gate).
 * Does not clear drafts, evidence, language, MPIN profile, or biometric preference.
 */
export async function clearTrustedLoginSelection(): Promise<void> {
  await clearAuthStorage();
  setAuthStartupPhase('mobile_login');
}

export async function routeAfterAuthenticatedUnlock(user: AuthUser): Promise<StartupRoute> {
  markUnlockCompleted();
  setAuthStartupPhase('authenticated');
  const role = resolveUserRole(user) ?? user.user_type;
  const dashboard = getDashboardRoute(role);

  if (!dashboard) {
    setAuthStartupPhase('mobile_login');
    return { name: 'MobileLogin' };
  }

  return { name: dashboard };
}

export async function loadLanguagePreferenceForUser(user?: AuthUser | null) {
  if (!user) {
    return resolvePreferredLanguage();
  }

  const role = resolveUserRole(user) ?? user.user_type;

  return resolvePreferredLanguage({
    role: role ? String(role) : undefined,
    userId: user.id,
  });
}

export function maskMobileNumber(mobile: string): string {
  const digits = normalizeMobile(mobile);

  if (digits.length !== 10) {
    return mobile || '—';
  }

  return `${digits.slice(0, 2)}******${digits.slice(-2)}`;
}

/** OTP subtitle mask: +91 XXXXX 4321 */
export function maskMobileForOtpSubtitle(mobile: string): string {
  const digits = normalizeMobile(mobile);

  if (digits.length !== 10) {
    return mobile ? `+91 ${mobile}` : '—';
  }

  return `+91 XXXXX ${digits.slice(-4)}`;
}
