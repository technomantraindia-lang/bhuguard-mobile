import type { OnboardingDraft, OnboardingResult } from '../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../navigation/types';
import {
  validateAddress,
  validateBasicDetails,
  validateConsent,
  validateDocuments,
  validateLandDetails,
} from '../utils/onboardingValidation';

export const ONBOARDING_STEP_TOTAL = 9;

export type FarmerOnboardingStepKey =
  | 'basic_details'
  | 'address_location_details'
  | 'service_interest'
  | 'existing_agri_bio_waste'
  | 'farm_land_details'
  | 'documents'
  | 'farm_mapping'
  | 'consent_legal'
  | 'final_review_submit';

export type FarmerOnboardingRoute = keyof Pick<
  FieldOfficerStackParamList,
  | 'FarmerBasicDetails'
  | 'FarmerGpsCapture'
  | 'FarmerLandDetails'
  | 'FarmerProofUpload'
  | 'OnboardingBoundaryStart'
  | 'FarmerConsent'
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
  { id: 2, key: 'address_location_details', label: 'Address / Location Details', title: 'Address / Location Details', icon: 'share_location', route: 'FarmerGpsCapture' },
  { id: 3, key: 'service_interest', label: 'Service Interest', title: 'Service Interest', icon: 'landscape', route: 'FarmerLandDetails' },
  { id: 4, key: 'existing_agri_bio_waste', label: 'Existing Agri Bio-Waste', title: 'Existing Agri Bio-Waste', icon: 'landscape', route: 'FarmerLandDetails' },
  { id: 5, key: 'farm_land_details', label: 'Farm / Land Details', title: 'Farm / Land Details', icon: 'landscape', route: 'FarmerLandDetails' },
  { id: 6, key: 'documents', label: 'Documents and Evidence', title: 'Documents and Evidence', icon: 'folder', route: 'FarmerProofUpload' },
  { id: 7, key: 'farm_mapping', label: 'Farm Mapping', title: 'Farm Mapping', icon: 'share_location', route: 'OnboardingBoundaryStart' },
  { id: 8, key: 'consent_legal', label: 'Consent & Legal', title: 'Consent & Legal', icon: 'consent', route: 'FarmerConsent' },
  {
    id: 9,
    key: 'final_review_submit',
    label: 'Final Review & Submit',
    title: 'Final Review & Submit',
    icon: 'assignment_turned_in',
    route: 'FarmerOnboardingReview',
  },
];

export const ONBOARDING_NEXT_LABELS: Record<number, string> = {
  1: 'Continue to Location Data',
  2: 'Continue to Service Interest',
  3: 'Continue to Existing Agri Bio-Waste',
  4: 'Continue to Farm / Land Details',
  5: 'Continue to Documents and Evidence',
  6: 'Continue to Farm Mapping',
  7: 'Continue to Consent & Legal',
  8: 'Continue to Final Review & Submit',
  9: 'Submit Registration',
};

function isMappingStatusAllowedForLand(draft: OnboardingDraft): boolean {
  const status = draft.boundary_mapping_status;
  return status === 'mapped' || status === 'pending_review' || status === 'pending';
}

function isLandRegistrationComplete(draft: OnboardingDraft): boolean {
  return validateLandDetails(draft) === null && isMappingStatusAllowedForLand(draft);
}

/**
 * Documents are complete when required evidence is present
 * (ownership when owned, at least one farm photo, farmer-with-farm photo).
 */
function isDocumentsStepCompleted(draft: OnboardingDraft): boolean {
  return validateDocuments(draft) === null;
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
    case 'address_location_details':
      return validateAddress(draft) === null;
    case 'service_interest':
      return draft.service_interests.includes('Biochar');
    case 'existing_agri_bio_waste':
      return draft.existing_farming_practice.trim().length > 0;
    case 'farm_land_details':
      return isLandRegistrationComplete(draft);
    case 'documents':
      return isDocumentsStepCompleted(draft);
    case 'farm_mapping':
      return draft.boundary_mapping_status === 'mapped'
        || draft.boundary_mapping_status === 'pending_review'
        || draft.boundary_mapping_status === 'pending';
    case 'consent_legal':
      return validateConsent(draft) === null;
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
  if (key === 'farm_mapping' && draft.boundary_mapping_status === 'pending') {
    return key === currentKey ? 'current' : 'pending';
  }

  if (key === 'farm_land_details' && getLandRegistrationStatusLabel(draft) === 'Mapping Pending') {
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
  if (key === 'farm_land_details') {
    const landLabel = getLandRegistrationStatusLabel(draft);
    if (landLabel === 'Mapping Pending') {
      return 'Mapping Pending';
    }
  }
  if (key === 'farm_mapping' && draft.boundary_mapping_status === 'pending') {
    return 'Mapping Pending';
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
