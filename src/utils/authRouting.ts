import type { RootStackParamList } from '../navigation/types';
import { isMobileAppRole } from './authRole';

export type MobileLoginRole = 'farmer' | 'field_officer' | 'artisan' | 'artisan_pro';

export function isMobileSupportedRole(userType: string): userType is MobileLoginRole {
  return isMobileAppRole(userType);
}

/**
 * Exact-match role → dashboard route. Never use `.includes('artisan')` here —
 * `artisan` (true Artisan) and `artisan_pro` (existing Artisan Pro accounts)
 * must route to their own separate apps.
 */
export function getDashboardRoute(userType: string): keyof RootStackParamList | null {
  switch (userType) {
    case 'farmer':
      return 'FarmerApp';
    case 'field_officer':
      return 'FieldOfficerApp';
    case 'artisan_pro':
      return 'ArtisanProApp';
    default:
      return null;
  }
}
