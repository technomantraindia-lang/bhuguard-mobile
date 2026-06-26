import type { AppLoginRole } from '../config/authRoles';
import type { RootStackParamList } from '../navigation/types';
import type { AuthUser } from '../types/auth';
import { saveAuthSession } from '../storage/authStorage';

import { ADMIN_WEB_ONLY_MESSAGE, COMPANY_WEB_ONLY_MESSAGE, isAdminRole, isCompanyRole, resolveUserRole } from './authRole';
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
  const resolvedRole = resolveUserRole(user) ?? user.user_type;

  if (isAdminRole(resolvedRole)) {
    return { ok: false, code: 'admin_web_only', message: ADMIN_WEB_ONLY_MESSAGE };
  }

  if (isCompanyRole(resolvedRole)) {
    return { ok: false, code: 'company_web_only', message: COMPANY_WEB_ONLY_MESSAGE };
  }

  if (!isMobileSupportedRole(resolvedRole)) {
    return { ok: false, code: 'unsupported_account', message: 'This account is not supported on mobile.' };
  }

  if (expectedRole && resolvedRole !== expectedRole) {
    return { ok: false, code: 'role_mismatch', message: 'Account role does not match selected login role.' };
  }

  if (resolvedRole === 'farmer' && !user.farmer_profile?.id) {
    return { ok: false, code: 'farmer_profile_missing', message: 'Farmer profile is not linked to this account.' };
  }

  if (resolvedRole === 'artisan' && !user.artisan_profile?.id) {
    return { ok: false, code: 'unsupported_account', message: 'Artisan profile is not linked to this account.' };
  }

  const dashboardRoute = getDashboardRoute(resolvedRole);

  if (!dashboardRoute) {
    return { ok: false, code: 'unsupported_account', message: 'Unable to open dashboard for this account.' };
  }

  await saveAuthSession(token, user, resolvedRole);

  return { ok: true, dashboardRoute, resolvedRole };
}
