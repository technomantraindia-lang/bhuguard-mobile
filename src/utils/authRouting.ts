import type { RootStackParamList } from '../navigation/types';

export type MobileLoginRole = 'farmer' | 'field_officer';

export function isMobileSupportedRole(userType: string): userType is MobileLoginRole {
  return userType === 'farmer' || userType === 'field_officer';
}

export function getDashboardRoute(userType: string): keyof RootStackParamList | null {
  switch (userType) {
    case 'farmer':
      return 'FarmerApp';
    case 'field_officer':
      return 'FieldOfficerApp';
    default:
      return null;
  }
}
