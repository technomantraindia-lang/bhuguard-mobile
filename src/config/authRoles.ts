export type AppLoginRole = 'farmer' | 'field_officer' | 'company_user';

export type SelectableRoleId = AppLoginRole | 'biochar_operator' | 'artisan' | 'auditor';

export interface RoleDefinition {
  id: SelectableRoleId;
  title: string;
  description: string;
  loginSupported: boolean;
  loginRole?: AppLoginRole;
  demoLogin?: string;
}

/** Grid order: Farmer, Field Officer | Project Mgr, Operator | Artisan, Auditor */
export const SELECTABLE_ROLES: RoleDefinition[] = [
  {
    id: 'farmer',
    title: 'Farmer',
    description: 'Primary land manager & biochar applier.',
    loginSupported: true,
    loginRole: 'farmer',
    demoLogin: '9876543210',
  },
  {
    id: 'field_officer',
    title: 'Field Officer',
    description: 'On-site verification and data collection.',
    loginSupported: true,
    loginRole: 'field_officer',
    demoLogin: '9876543211',
  },
  {
    id: 'company_user',
    title: 'Project Mgr.',
    description: 'Global oversight and credit issuance.',
    loginSupported: true,
    loginRole: 'company_user',
    demoLogin: '9876543212',
  },
  {
    id: 'biochar_operator',
    title: 'Operator',
    description: 'Facility management & production logs.',
    loginSupported: false,
  },
  {
    id: 'artisan',
    title: 'Artisan',
    description: 'Kiln construction and maintenance QA.',
    loginSupported: false,
  },
  {
    id: 'auditor',
    title: 'Auditor',
    description: 'Independent compliance validation.',
    loginSupported: false,
  },
];

export function getRoleDefinition(id: SelectableRoleId): RoleDefinition | undefined {
  return SELECTABLE_ROLES.find((role) => role.id === id);
}

export function getDemoLoginForRole(role: AppLoginRole): string {
  const match = SELECTABLE_ROLES.find((item) => item.loginRole === role);

  return match?.demoLogin ?? 'name@bhuguard.tech';
}

export function getRoleTitle(role: AppLoginRole): string {
  const match = SELECTABLE_ROLES.find((item) => item.loginRole === role);

  return match?.title ?? 'User';
}
