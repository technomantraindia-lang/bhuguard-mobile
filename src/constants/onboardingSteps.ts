import type { OnboardingDraft, OnboardingResult } from '../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../navigation/types';
import {
  validateAddress,
  validateBasicDetails,
  validateConsent,
  validateDocuments,
  validateLandDetails,
} from '../utils/onboardingValidation';

export const ONBOARDING_STEP_TOTAL = 6;

export type FarmerOnboardingStepKey =
  | 'basic_details'
  | 'location_data'
  | 'consent_legal'
  | 'land_registration'
  | 'documents'
  | 'final_review_submit';

export type FarmerOnboardingRoute = keyof Pick<
  FieldOfficerStackParamList,
  | 'FarmerBasicDetails'
  | 'FarmerGpsCapture'
  | 'FarmerConsent'
  | 'FarmerLandDetails'
  | 'FarmerProofUpload'
  | 'FarmerOnboardingReview'
>;

export type FarmerOnboardingStep = {
  id: number;
  key: FarmerOnboardingStepKey;
  label: string;
  title: string;
  icon: 'person' | 'share_location' | 'consent' | 'landscape' | 'folder' | 'assignment_turned_in';
  route: FarmerOnboardingRoute;
};

export type LandRegistrationStatusLabel = 'Completed' | 'Mapping Pending' | 'Pending';

export type OnboardingStepDisplayTone = 'completed' | 'current' | 'pending';

/** Single source of truth for overview + resume navigation. */
export const ONBOARDING_STEPS: FarmerOnboardingStep[] = [
  { id: 1, key: 'basic_details', label: 'Basic Details', title: 'Basic Details', icon: 'person', route: 'FarmerBasicDetails' },
  { id: 2, key: 'location_data', label: 'Location Data', title: 'Location Data', icon: 'share_location', route: 'FarmerGpsCapture' },
  { id: 3, key: 'consent_legal', label: 'Consent & Legal', title: 'Consent & Legal', icon: 'consent', route: 'FarmerConsent' },
  { id: 4, key: 'land_registration', label: 'Land Registration', title: 'Land Registration', icon: 'landscape', route: 'FarmerLandDetails' },
  { id: 5, key: 'documents', label: 'Documents', title: 'Documents', icon: 'folder', route: 'FarmerProofUpload' },
  {
    id: 6,
    key: 'final_review_submit',
    label: 'Final Review & Submit',
    title: 'Final Review & Submit',
    icon: 'assignment_turned_in',
    route: 'FarmerOnboardingReview',
  },
];

export const ONBOARDING_NEXT_LABELS: Record<number, string> = {
  1: 'Continue to Location Data',
  2: 'Continue to Consent & Legal',
  3: 'Continue to Land Registration',
  4: 'Continue to Documents',
  5: 'Continue to Final Review & Submit',
  6: 'Submit Registration',
};

function isMappingStatusAllowedForLand(draft: OnboardingDraft): boolean {
  const status = draft.boundary_mapping_status;
  return status === 'mapped' || status === 'pending_review' || status === 'pending';
}

function isLandRegistrationComplete(draft: OnboardingDraft): boolean {
  return validateLandDetails(draft) === null && isMappingStatusAllowedForLand(draft);
}

/**
 * Documents are complete only when ownership is known and:
 * - owned → at least one proof/document is saved
 * - other ownership → user explicitly continued past the Documents step
 */
function isDocumentsStepCompleted(draft: OnboardingDraft): boolean {
  if (validateDocuments(draft) !== null) {
    return false;
  }

  if (draft.ownership_type === 'owned') {
    return Boolean(draft.proof_of_land_ownership) || draft.farmer_documents.length >= 1;
  }

  return draft.documents_step_completed === true;
}

/** Overview label for the Land Registration row (Mapping Pending when skipped). */
export function getLandRegistrationStatusLabel(draft: OnboardingDraft): LandRegistrationStatusLabel {
  if (validateLandDetails(draft) !== null) {
    return 'Pending';
  }

  if (draft.boundary_mapping_status === 'pending') {
    return 'Mapping Pending';
  }

  if (draft.boundary_mapping_status === 'mapped' || draft.boundary_mapping_status === 'pending_review') {
    return 'Completed';
  }

  return 'Pending';
}

export function isFarmerOnboardingStepCompleted(
  key: FarmerOnboardingStepKey,
  draft: OnboardingDraft,
  result: OnboardingResult | null,
): boolean {
  switch (key) {
    case 'basic_details':
      return validateBasicDetails(draft) === null;
    case 'location_data':
      return validateAddress(draft) === null;
    case 'consent_legal':
      return validateConsent(draft) === null;
    case 'land_registration':
      return isLandRegistrationComplete(draft);
    case 'documents':
      return isDocumentsStepCompleted(draft);
    case 'final_review_submit':
      return result != null;
    default:
      return false;
  }
}

/**
 * Display tone for the overview stepper.
 * Green "completed" is reserved for truly finished steps.
 * Mapping Pending uses pending (not green), even if land fields allow continue.
 */
export function getFarmerOnboardingStepDisplayTone(
  key: FarmerOnboardingStepKey,
  draft: OnboardingDraft,
  result: OnboardingResult | null,
  currentKey: FarmerOnboardingStepKey | null,
): OnboardingStepDisplayTone {
  if (key === 'land_registration' && getLandRegistrationStatusLabel(draft) === 'Mapping Pending') {
    return key === currentKey ? 'current' : 'pending';
  }

  if (isFarmerOnboardingStepCompleted(key, draft, result)) {
    return 'completed';
  }

  if (key === currentKey) {
    return 'current';
  }

  return 'pending';
}

export function getFarmerOnboardingStepStatusLabel(
  key: FarmerOnboardingStepKey,
  draft: OnboardingDraft,
  tone: OnboardingStepDisplayTone,
): string {
  if (key === 'land_registration') {
    const landLabel = getLandRegistrationStatusLabel(draft);
    if (landLabel === 'Mapping Pending') {
      return 'Mapping Pending';
    }
  }

  if (tone === 'completed') {
    return 'Completed';
  }

  if (tone === 'current') {
    return 'Current';
  }

  return 'Pending';
}

export function getNextIncompleteFarmerOnboardingStep(
  draft: OnboardingDraft,
  result: OnboardingResult | null = null,
): FarmerOnboardingStep | null {
  return (
    ONBOARDING_STEPS.find((step) => !isFarmerOnboardingStepCompleted(step.key, draft, result))
    ?? null
  );
}

/** Ordered step immediately after a known key (stable key, not array index persistence). */
export function getFarmerOnboardingStepAfter(
  key: FarmerOnboardingStepKey,
): FarmerOnboardingStep | null {
  const index = ONBOARDING_STEPS.findIndex((step) => step.key === key);
  if (index < 0 || index >= ONBOARDING_STEPS.length - 1) {
    return null;
  }

  return ONBOARDING_STEPS[index + 1] ?? null;
}

export function hasFarmerOnboardingProgress(draft: OnboardingDraft): boolean {
  return Boolean(
    draft.farmer_name.trim()
    || draft.mobile.trim()
    || draft.farmer_id
    || draft.farm_id
    || draft.boundary_mapping_status !== 'not_mapped'
    || draft.land_survey_number.trim()
    || draft.agreement_otp_verified
    || draft.district_id
    || draft.documents_step_completed
  );
}
