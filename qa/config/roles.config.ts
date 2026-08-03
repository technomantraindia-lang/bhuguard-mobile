export type QaRole = 'farmer' | 'field_officer' | 'artisan' | 'artisan_pro' | 'public' | 'any';

export interface RoleConfig {
  id: QaRole;
  label: string;
  mobileEnvKey: string;
  requiresAuth: boolean;
}

export const QA_ROLES: RoleConfig[] = [
  { id: 'public', label: 'Public / unauthenticated', mobileEnvKey: '', requiresAuth: false },
  { id: 'farmer', label: 'Farmer', mobileEnvKey: 'QA_FARMER_MOBILE', requiresAuth: true },
  {
    id: 'field_officer',
    label: 'Field Officer',
    mobileEnvKey: 'QA_FIELD_OFFICER_MOBILE',
    requiresAuth: true,
  },
  { id: 'artisan', label: 'Artisan', mobileEnvKey: 'QA_ARTISAN_MOBILE', requiresAuth: true },
  {
    id: 'artisan_pro',
    label: 'Artisan Pro',
    mobileEnvKey: 'QA_ARTISAN_PRO_MOBILE',
    requiresAuth: true,
  },
];
