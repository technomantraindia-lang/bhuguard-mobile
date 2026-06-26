import type { AuthUser } from '../types/auth';

export type MobileAppRole = 'farmer' | 'field_officer' | 'artisan' | 'admin';

export const ADMIN_WEB_ONLY_MESSAGE = 'Admin access is available from web panel.';
export const COMPANY_WEB_ONLY_MESSAGE = 'Company access is available from the web panel.';

export function isCompanyRole(role: string | null | undefined): boolean {
  return role === 'company_user';
}

function readRoleValue(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  return value.trim().toLowerCase();
}

/**
 * Resolve role from flexible backend user shapes.
 */
export function resolveUserRole(user: Record<string, unknown> | AuthUser | null | undefined): string | null {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const direct =
    readRoleValue(user.user_type) ??
    readRoleValue(user.role) ??
    readRoleValue(user.role_name) ??
    readRoleValue(user.type);

  if (direct) {
    return direct;
  }

  const roles = user.roles;

  if (Array.isArray(roles) && roles.length > 0) {
    const first = roles[0];

    if (typeof first === 'string') {
      return readRoleValue(first);
    }

    if (first && typeof first === 'object') {
      const roleObj = first as Record<string, unknown>;
      return readRoleValue(roleObj.name) ?? readRoleValue(roleObj.role);
    }
  }

  return null;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function isMobileAppRole(role: string | null | undefined): role is MobileAppRole {
  return role === 'farmer' || role === 'field_officer' || role === 'artisan';
}
