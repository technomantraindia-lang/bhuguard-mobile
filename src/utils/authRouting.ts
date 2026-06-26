import type { RootStackParamList } from '../navigation/types';
import { isMobileAppRole } from './authRole';

export type MobileLoginRole = 'farmer' | 'field_officer' | 'artisan';

export function isMobileSupportedRole(userType: string): userType is MobileLoginRole {
  return isMobileAppRole(userType);
}

export function getDashboardRoute(userType: string): keyof RootStackParamList | null {
  switch (userType) {
    case 'farmer':
      return 'FarmerApp';
    case 'field_officer':
      return 'FieldOfficerApp';
    case 'artisan':
      return 'ArtisanApp';
    default:
      return null;
  }
}
