export type AppLoginRole = 'farmer' | 'field_officer';

export interface RoleDefinition {
  id: AppLoginRole;
  titleKey: string;
  descriptionKey: string;
  buttonKey: string;
  demoLogin: string;
}

export const MOBILE_ROLES: RoleDefinition[] = [
  {
    id: 'farmer',
    titleKey: 'role.farmerTitle',
    descriptionKey: 'role.farmerDescription',
    buttonKey: 'role.farmerButton',
    demoLogin: '9876543210',
  },
  {
    id: 'field_officer',
    titleKey: 'role.fieldOfficerTitle',
    descriptionKey: 'role.fieldOfficerDescription',
    buttonKey: 'role.fieldOfficerButton',
    demoLogin: '9876543211',
  },
];

export function getDemoLoginForRole(role: AppLoginRole): string {
  return MOBILE_ROLES.find((item) => item.id === role)?.demoLogin ?? '';
}

export function getRoleTitleKey(role: AppLoginRole): string {
  return MOBILE_ROLES.find((item) => item.id === role)?.titleKey ?? 'role.farmerTitle';
}
