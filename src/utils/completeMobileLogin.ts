import type { AppLoginRole } from '../config/authRoles';
import type { RootStackParamList } from '../navigation/types';
import type { AuthUser } from '../types/auth';
import { saveAuthSession } from '../storage/authStorage';

import { ADMIN_WEB_ONLY_MESSAGE, COMPANY_WEB_ONLY_MESSAGE, isAdminRole, isCompanyRole, normalizeRole, resolveUserRole } from './authRole';
import { getDashboardRoute, isMobileSupportedRole, type MobileLoginRole } from './authRouting';

export type LoginCompletionErrorCode =
  | 'admin_web_only'
  | 'company_web_only'
  | 'unsupported_account'
  | 'role_mismatch'
  | 'farmer_profile_missing';

export type CompleteMobileLoginResult =
  | {
      ok: true;
      dashboardRoute: keyof RootStackParamList;
      resolvedRole: MobileLoginRole;
    }
  | {
      ok: false;
      code: LoginCompletionErrorCode;
      message: string;
    };

export interface CompleteMobileLoginOptions {
  token: string;
  user: AuthUser;
  expectedRole?: AppLoginRole | MobileLoginRole | string;
}

export async function completeMobileLogin({
  token,
  user,
  expectedRole,
}: CompleteMobileLoginOptions): Promise<CompleteMobileLoginResult> {
  const resolvedRole = normalizeRole(resolveUserRole(user) ?? user.user_type);
  const normalizedExpectedRole = expectedRole ? normalizeRole(expectedRole) : undefined;

  if (isAdminRole(resolvedRole)) {
    return { ok: false, code: 'admin_web_only', message: ADMIN_WEB_ONLY_MESSAGE };
  }

  if (isCompanyRole(resolvedRole)) {
    return { ok: false, code: 'company_web_only', message: COMPANY_WEB_ONLY_MESSAGE };
  }

  if (!isMobileSupportedRole(resolvedRole)) {
    return { ok: false, code: 'unsupported_account', message: 'This account is not supported on mobile.' };
  }

  if (normalizedExpectedRole && resolvedRole !== normalizedExpectedRole) {
    return {
      ok: false,
      code: 'role_mismatch',
      message: 'Account role does not match selected login role.',
    };
  }

  if (resolvedRole === 'farmer' && !user.farmer_profile?.id) {
    return { ok: false, code: 'farmer_profile_missing', message: 'Farmer profile is not linked to this account.' };
  }

  // Both true Artisan and Artisan Pro accounts carry the same `artisan_profile`
  // relation from the backend — require it for either exact role, with a
  // role-correct message.
  if ((resolvedRole === 'artisan' || resolvedRole === 'artisan_pro') && !user.artisan_profile?.id) {
    return {
      ok: false,
      code: 'unsupported_account',
      message:
        resolvedRole === 'artisan_pro'
          ? 'Artisan Pro profile is not linked to this account.'
          : 'Artisan profile is not linked to this account.',
    };
  }

  const dashboardRoute = getDashboardRoute(resolvedRole);

  if (!dashboardRoute) {
    return { ok: false, code: 'unsupported_account', message: 'Unable to open dashboard for this account.' };
  }

  await saveAuthSession(token, user, resolvedRole);

  // Never block or fail login if offline sync / native modules are unavailable.
  if ((resolvedRole === 'artisan' || resolvedRole === 'artisan_pro') && user.artisan_profile?.id) {
    const artisanId = user.artisan_profile.id;
    void import('../services/biocharProductionSyncService')
      .then((sync) => {
        try {
          sync.startBiocharProductionSyncListeners(artisanId);
          void sync.syncPendingBiocharProductions(artisanId);
        } catch {
          // Ignore NetInfo/SQLite bootstrap failures on older native builds.
        }
      })
      .catch(() => {
        // Ignore dynamic import failures.
      });
  }

  return { ok: true, dashboardRoute, resolvedRole };
}
