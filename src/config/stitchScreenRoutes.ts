import type { CompanyStackParamList, FieldOfficerStackParamList, FarmerStackParamList } from '../navigation/types';

type FarmerScreen = keyof FarmerStackParamList;
type OfficerScreen = keyof FieldOfficerStackParamList;
type CompanyScreen = keyof CompanyStackParamList;

export interface StitchNavigateReplacement {
  farmer?: FarmerScreen;
  officer?: OfficerScreen;
  company?: CompanyScreen;
  buildParams?: (itemId?: number, context?: { assignmentId?: number }) => object | undefined;
}

/** Stitch keys that replace navigation to a dedicated stack screen. */
export const STITCH_NAVIGATE_REPLACEMENTS: Record<string, StitchNavigateReplacement> = {
  add_activity_log: {
    farmer: 'FarmerSubmitActivity',
    buildParams: (itemId) => (itemId ? { farmId: itemId } : undefined),
  },
  add_farmer_evidence: {
    farmer: 'FarmerUploadEvidence',
    buildParams: (itemId) => (itemId ? { farmId: itemId } : undefined),
  },
  add_feedstock_collection: {
    farmer: 'FarmerFeedstockCollection',
    buildParams: (itemId) => (itemId ? { farmId: itemId } : undefined),
  },
  feedstock_verification: {
    officer: 'FieldOfficerFeedstockVerification',
    buildParams: (itemId) => (itemId ? { verificationId: itemId } : undefined),
  },
  officer_biochar_production: {
    officer: 'FieldOfficerBiocharProductionList',
    buildParams: (itemId) => (itemId ? { farmerId: itemId } : undefined),
  },
  boundary_evidence: {
    farmer: 'CameraBoundaryStart',
    buildParams: (itemId) => ({ farmId: itemId ?? 0 }),
  },
  gps_verification: {
    officer: 'VisitCheckIn',
    buildParams: (itemId, ctx) => ({ assignmentId: itemId ?? ctx?.assignmentId ?? 0 }),
  },
  photo_verification: {
    officer: 'VisitEvidenceUpload',
    buildParams: (itemId, ctx) => ({ assignmentId: itemId ?? ctx?.assignmentId ?? 0 }),
  },
  offline_evidence_capture: {
    officer: 'VisitEvidenceUpload',
    buildParams: (itemId, ctx) => ({ assignmentId: itemId ?? ctx?.assignmentId ?? 0 }),
  },
  monitoring_evidence_upload: {
    officer: 'VisitEvidenceUpload',
    buildParams: (itemId, ctx) => ({ assignmentId: itemId ?? ctx?.assignmentId ?? 0 }),
  },
  audit_evidence_upload: {
    officer: 'VisitEvidenceUpload',
    buildParams: (itemId, ctx) => ({ assignmentId: itemId ?? ctx?.assignmentId ?? 0 }),
  },
  consent_legal: { officer: 'FarmerConsent' },
  document_uploads: { officer: 'FarmerProofUpload' },
  proof_of_land_ownership_upload: { officer: 'FarmerProofUpload' },
  gps_location_capture: { officer: 'FarmerGpsCapture' },
  land_registration: { officer: 'FarmerLandDetails' },
  onboarding_review_stitch: { officer: 'FarmerOnboardingReview' },
  onboarding_success_stitch: { officer: 'FarmerOnboardingSuccess' },
  officer_inventory_tasks: { officer: 'FieldOfficerInventoryTasks' },
  company_create_site: { company: 'CompanyCreateRecord', buildParams: () => ({ formKey: 'company_create_site' }) },
  company_create_submission: { company: 'CompanyCreateRecord', buildParams: () => ({ formKey: 'company_create_submission' }) },
  company_create_waste: { company: 'CompanyCreateRecord', buildParams: () => ({ formKey: 'company_create_waste' }) },
  company_create_industrial: { company: 'CompanyCreateRecord', buildParams: () => ({ formKey: 'company_create_industrial' }) },
  company_create_biochar: { company: 'CompanyCreateRecord', buildParams: () => ({ formKey: 'company_create_biochar' }) },
  company_create_registry: { company: 'CompanyCreateRecord', buildParams: () => ({ formKey: 'company_create_registry' }) },
  officer_create_activity_log: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_activity_log' }) },
  officer_create_baseline: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_baseline' }) },
  officer_create_soil_sample: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_soil_sample' }) },
  officer_create_monitoring_report: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_monitoring_report' }) },
  officer_create_regenerative_practice: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_regenerative_practice' }) },
  officer_create_feedstock: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_feedstock' }) },
  officer_create_plantation: { officer: 'FieldOfficerCreateRecord', buildParams: () => ({ formKey: 'officer_create_plantation' }) },
};

/** Stitch form keys rendered inline with live camera evidence upload. */
export const STITCH_LIVE_EVIDENCE_FORM_KEYS = new Set([
  'add_farmer_evidence',
  'add_baseline_assessment',
  'add_soil_sample',
  'add_practice_record',
  'farmer_evidence_upload',
]);

export type FarmerEvidenceCategoryKey =
  | 'before_photo'
  | 'during_process_photo'
  | 'after_activity_photo'
  | 'weekly_progress_photo'
  | 'document_photo'
  | 'supporting_document';

export const FARMER_EVIDENCE_CATEGORY_OPTIONS: Array<{ key: FarmerEvidenceCategoryKey; label: string }> = [
  { key: 'weekly_progress_photo', label: 'Weekly Progress' },
  { key: 'after_activity_photo', label: 'After Activity' },
  { key: 'during_process_photo', label: 'During Process' },
  { key: 'before_photo', label: 'Before Photo' },
  { key: 'document_photo', label: 'Document Photo' },
  { key: 'supporting_document', label: 'Supporting' },
];

export function getDefaultFarmerEvidenceCategory(screenKey: string): FarmerEvidenceCategoryKey {
  switch (screenKey) {
    case 'add_baseline_assessment':
      return 'document_photo';
    case 'add_soil_sample':
      return 'supporting_document';
    case 'add_practice_record':
      return 'after_activity_photo';
    case 'monitoring_evidence_upload':
      return 'weekly_progress_photo';
    case 'audit_evidence_upload':
      return 'document_photo';
    default:
      return 'weekly_progress_photo';
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
      return 'Capture Evidence';
  }
}

export const STITCH_LIST_UPLOAD_ACTIONS: Record<
  string,
  { label: string; targetScreenKey: string; role: 'farmer' | 'officer' }
> = {
  feedstock_collection_list: {
    label: 'Add Feedstock Collection',
    targetScreenKey: 'add_feedstock_collection',
    role: 'farmer',
  },
  farmer_evidence_list: { label: 'Capture Live Evidence', targetScreenKey: 'add_farmer_evidence', role: 'farmer' },
  evidence_review: { label: 'Upload Visit Evidence', targetScreenKey: 'photo_verification', role: 'officer' },
  assigned_verification_list: { label: 'Upload Evidence', targetScreenKey: 'photo_verification', role: 'officer' },
};
