export type EvidenceRole = 'farmer' | 'company_user' | 'field_officer';

export type EvidenceCategoryValue =
  | 'feedstock_photo'
  | 'production_photo'
  | 'application_photo'
  | 'before_photo'
  | 'during_photo'
  | 'after_photo'
  | 'during_process_photo'
  | 'after_activity_photo'
  | 'weekly_progress_photo'
  | 'gps_record'
  | 'weight_slip'
  | 'document'
  | 'document_photo'
  | 'verification_photo'
  | 'storage_photo'
  | 'delivery_proof'
  | 'waste_evidence'
  | 'industrial_bill'
  | 'supporting_document'
  | 'farmer_signature'
  | 'officer_signature'
  | 'receiver_signature';

export interface EvidenceCategoryDefinition {
  value: EvidenceCategoryValue;
  label: string;
  allowedRoles: EvidenceRole[];
  acceptedFileTypes: string[];
  requiresGps: boolean;
  requiresRelatedRecord: boolean;
}

export const EVIDENCE_CATEGORIES: EvidenceCategoryDefinition[] = [
  {
    value: 'feedstock_photo',
    label: 'Feedstock Photo',
    allowedRoles: ['company_user'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'production_photo',
    label: 'Production Photo',
    allowedRoles: ['company_user'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'application_photo',
    label: 'Application Photo',
    allowedRoles: ['company_user'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'before_photo',
    label: 'Before Photo',
    allowedRoles: ['farmer', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'during_photo',
    label: 'During Photo',
    allowedRoles: ['farmer', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'after_photo',
    label: 'After Photo',
    allowedRoles: ['farmer', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'weekly_progress_photo',
    label: 'Weekly Progress',
    allowedRoles: ['company_user', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'gps_record',
    label: 'GPS Record',
    allowedRoles: ['company_user', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    requiresGps: true,
    requiresRelatedRecord: false,
  },
  {
    value: 'weight_slip',
    label: 'Weight Slip',
    allowedRoles: ['company_user', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'document',
    label: 'Document',
    allowedRoles: ['company_user', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'verification_photo',
    label: 'Verification Photo',
    allowedRoles: ['field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: true,
    requiresRelatedRecord: true,
  },
  {
    value: 'storage_photo',
    label: 'Storage Photo',
    allowedRoles: ['field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'delivery_proof',
    label: 'Delivery Proof',
    allowedRoles: ['field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'waste_evidence',
    label: 'Waste Evidence',
    allowedRoles: ['company_user'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'industrial_bill',
    label: 'Industrial Bill',
    allowedRoles: ['company_user'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    requiresGps: false,
    requiresRelatedRecord: true,
  },
  {
    value: 'supporting_document',
    label: 'Supporting Document',
    allowedRoles: ['company_user', 'field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'farmer_signature',
    label: 'Farmer Signature',
    allowedRoles: ['field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'officer_signature',
    label: 'Officer Signature',
    allowedRoles: ['field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
  {
    value: 'receiver_signature',
    label: 'Receiver Signature',
    allowedRoles: ['field_officer'],
    acceptedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
    requiresGps: false,
    requiresRelatedRecord: false,
  },
];

const CATEGORY_ALIASES: Partial<Record<EvidenceCategoryValue, EvidenceCategoryValue>> = {
  during_photo: 'during_process_photo',
  after_photo: 'after_activity_photo',
  application_photo: 'weekly_progress_photo',
  document: 'document_photo',
};

export function normalizeEvidenceCategory(value: string): EvidenceCategoryValue {
  const normalized = value.trim().toLowerCase() as EvidenceCategoryValue;

  return (CATEGORY_ALIASES[normalized] ?? normalized) as EvidenceCategoryValue;
}

export function getEvidenceCategoriesForRole(role: EvidenceRole): EvidenceCategoryDefinition[] {
  return EVIDENCE_CATEGORIES.filter((category) => category.allowedRoles.includes(role));
}

export function getEvidenceCategoryDefinition(
  value: string,
  role?: EvidenceRole,
): EvidenceCategoryDefinition | undefined {
  const normalized = normalizeEvidenceCategory(value);

  return EVIDENCE_CATEGORIES.find(
    (category) =>
      category.value === normalized ||
      category.value === value ||
      (role ? category.allowedRoles.includes(role) && category.value === normalized : false),
  );
}

export function categoryRequiresGps(value: string, role?: EvidenceRole): boolean {
  return getEvidenceCategoryDefinition(value, role)?.requiresGps ?? false;
}

export function getCategoryLabel(value: string): string {
  const definition = EVIDENCE_CATEGORIES.find(
    (category) => category.value === value || category.value === normalizeEvidenceCategory(value),
  );

  return definition?.label ?? value.replace(/_/g, ' ');
}

export const FARMER_UPLOAD_EVIDENCE_OPTIONS = [
  { key: 'before_photo' as const, label: 'Before Photo' },
  { key: 'during_photo' as const, label: 'During Photo' },
  { key: 'after_photo' as const, label: 'After Photo' },
];

export const FARMER_EVIDENCE_CATEGORY_OPTIONS = FARMER_UPLOAD_EVIDENCE_OPTIONS.map((item) => ({
  key: item.key,
  label: item.label,
}));

export const COMPANY_EVIDENCE_CATEGORY_OPTIONS = getEvidenceCategoriesForRole('company_user').map((item) => ({
  key: item.value,
  label: item.label,
}));

export const OFFICER_UPLOAD_EVIDENCE_OPTIONS = [
  { key: 'before_photo' as const, label: 'Before Photo' },
  { key: 'during_photo' as const, label: 'During Photo' },
  { key: 'after_photo' as const, label: 'After Photo' },
];

export const OFFICER_EVIDENCE_CATEGORY_OPTIONS = OFFICER_UPLOAD_EVIDENCE_OPTIONS.map((item) => ({
  key: item.key,
  label: item.label,
}));

export type FarmerEvidenceCategoryKey = (typeof FARMER_EVIDENCE_CATEGORY_OPTIONS)[number]['key'];
export type CompanyEvidenceCategoryKey = (typeof COMPANY_EVIDENCE_CATEGORY_OPTIONS)[number]['key'];
export type OfficerEvidenceCategoryKey = (typeof OFFICER_EVIDENCE_CATEGORY_OPTIONS)[number]['key'];

export function getDefaultFarmerEvidenceCategory(screenKey: string): FarmerEvidenceCategoryKey {
  switch (screenKey) {
    case 'add_practice_record':
      return 'after_photo';
    default:
      return 'before_photo';
  }
}

export function getFarmerEvidenceFormTitle(screenKey: string): string {
  switch (screenKey) {
    case 'add_baseline_assessment':
      return 'Baseline Assessment Evidence';
    case 'add_soil_sample':
      return 'Soil Sample Evidence';
    case 'add_practice_record':
      return 'Practice Evidence';
    case 'monitoring_evidence_upload':
      return 'Monitoring Evidence';
    case 'audit_evidence_upload':
      return 'Audit Evidence';
    default:
      return 'Upload Evidence';
  }
}
