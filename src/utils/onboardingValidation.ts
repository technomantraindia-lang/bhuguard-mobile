import type { OnboardingDraft } from '../context/OnboardingContext';

export function validateBasicDetails(draft: OnboardingDraft): string | null {
  const name = draft.farmer_name.trim();

  if (!name) {
    return 'Name as per Government ID is required.';
  }

  if (name.length > 100) {
    return 'Name as per Government ID must be 100 characters or fewer.';
  }

  if (!/^(?=.*[\p{L}])[\p{L}\p{M}\s.'-]{2,100}$/u.test(name)) {
    return 'Enter a valid Name as per Government ID. Numbers or symbols alone are not allowed.';
  }

  if (!/^[6-9]\d{9}$/.test(draft.mobile.trim())) {
    return 'Mobile number must be 10 digits and start with 6-9.';
  }

  // Farmer MPIN setup removed from onboarding — Pattern auth is set at first login.

  if (draft.alternate_mobile.trim() && !/^[6-9]\d{9}$/.test(draft.alternate_mobile.trim())) {
    return 'Alternate mobile must be 10 digits and start with 6-9.';
  }

  if (draft.age.trim() && (!/^\d+$/.test(draft.age.trim()) || Number(draft.age) < 1 || Number(draft.age) > 120)) {
    return 'Age must be a valid number between 1 and 120.';
  }

  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    return 'Enter a valid email address.';
  }

  if (draft.aadhaar_number.trim() && !/^\d{12}$/.test(draft.aadhaar_number.trim())) {
    return 'Aadhaar number must be 12 digits when provided.';
  }

  return null;
}

export function validateFarmerProfileStep1(draft: OnboardingDraft): string | null {
  const basicError = validateBasicDetails(draft);

  if (basicError) {
    return basicError;
  }

  return validateAddress(draft);
}

export function validateConsent(draft: OnboardingDraft): string | null {
  if (!draft.data_usage_consent) {
    return 'Data usage consent is required.';
  }

  if (!draft.carbon_rights_consent) {
    return 'Carbon rights consent is required.';
  }

  if (!draft.project_participation_consent) {
    return 'Project participation consent is required.';
  }

  if (!draft.farmer_signature_confirmed) {
    return 'Confirm that the farmer has read the legal agreements.';
  }

  if (!draft.agreement_otp_verified || !draft.agreement_verification_token.trim()) {
    return 'Verify the Farmer Agreement using the OTP sent to the registered mobile number.';
  }

  return null;
}

export function validateAddress(draft: OnboardingDraft): string | null {
  if (!draft.district_id) {
    return 'District is required.';
  }

  if (!draft.taluka_id) {
    return 'Taluka is required.';
  }

  if (!draft.village_id) {
    return 'Village is required.';
  }

  if (draft.taluka_id && !/^\d{6}$/.test(draft.pincode.trim())) {
    return 'Pincode is filled automatically when you select taluka.';
  }

  return null;
}

export function validateLandDetails(draft: OnboardingDraft): string | null {
  if (!draft.land_survey_number.trim()) {
    return 'Land survey number is required.';
  }

  if (!draft.farm_name.trim()) {
    return 'Farm name is required.';
  }

  if (!draft.land_area.trim() || Number.isNaN(Number(draft.land_area)) || Number(draft.land_area) <= 0) {
    return 'Land area is required and must be a positive number.';
  }

  if (!draft.land_area_unit) {
    return 'Area unit is required.';
  }

  if (!draft.ownership_type) {
    return 'Ownership is required.';
  }

  if (draft.ownership_type === 'other' && !draft.ownership_other_detail.trim()) {
    return 'Describe the ownership type when "Other" is selected.';
  }

  if (!draft.soil_type) {
    return 'Soil type is required.';
  }

  if (!draft.irrigation_type) {
    return 'Irrigation type is required.';
  }

  if (!draft.service_interests.includes('Biochar')) {
    return 'Service Interest must be Biochar.';
  }

  return null;
}

export function validateGps(draft: OnboardingDraft): string | null {
  return validateBoundaryMapping(draft);
}

export function validateBoundaryMapping(draft: OnboardingDraft): string | null {
  if (draft.boundary_mapping_status === 'pending') {
    return null;
  }

  if (draft.boundary_mapping_status === 'not_mapped' || draft.boundary_mapping_status === 'draft') {
    return null;
  }

  if (draft.boundary_mapping_status !== 'mapped' && draft.boundary_mapping_status !== 'pending_review') {
    return null;
  }

  if (draft.boundary_points.length < 3) {
    return 'At least 3 GPS boundary points are required to complete land mapping.';
  }

  const hasExplicitCenter = Boolean(draft.gps_latitude.trim() && draft.gps_longitude.trim());
  const hasBoundaryCenter = draft.boundary_points.some(
    (point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );

  // Saved boundary points are the source of truth for mapped land center GPS.
  if (!hasExplicitCenter && !hasBoundaryCenter) {
    return 'Mapped land center GPS is required. Confirm land area after boundary mapping.';
  }

  return null;
}

/** Land Registration requires map or Skip for Now before continuing / submit. */
export function validateLandMappingChoice(draft: OnboardingDraft): string | null {
  const status = draft.boundary_mapping_status;

  if (status === 'mapped' || status === 'pending_review' || status === 'pending') {
    return validateBoundaryMapping(draft);
  }

  return 'Start Mobile Mapping or tap Skip for Now to continue.';
}

export function validateDocuments(draft: OnboardingDraft): string | null {
  if (!String(draft.ownership_type ?? '').trim()) {
    return 'Complete Land Registration (ownership type) before Documents.';
  }

  if (draft.ownership_type === 'owned' && !draft.proof_of_land_ownership) {
    return 'Add the Ownership Document before continuing.';
  }

  if (draft.farmer_documents.length < 1) {
    return 'Add at least one Farm Photo before continuing.';
  }

  if (!draft.farmer_with_farm_photo) {
    return 'Capture the Farmer with Farm Photo before continuing.';
  }

  return null;
}

export function validateSubmit(draft: OnboardingDraft): string | null {
  return (
    validateBasicDetails(draft)
    ?? validateAddress(draft)
    ?? validateConsent(draft)
    ?? validateLandDetails(draft)
    ?? validateLandMappingChoice(draft)
    ?? validateDocuments(draft)
  );
}

/**
 * Phase 12.12 — structured eligibility for review/consent submit button.
 * Used to disable Submit immediately and surface __DEV__ diagnostics.
 */
export function getSubmitEligibility(draft: OnboardingDraft): {
  canSubmit: boolean;
  completed: string[];
  missing: string[];
} {
  const completed: string[] = [];
  const missing: string[] = [];

  const mark = (ok: boolean, label: string) => {
    if (ok) {
      completed.push(label);
    } else {
      missing.push(label);
    }
  };

  mark(Boolean(draft.farmer_name.trim()), 'Farmer name');
  mark(/^[6-9]\d{9}$/.test(draft.mobile.trim()), 'Mobile');
  mark(Boolean(draft.district_id && draft.taluka_id && draft.village_id), 'Address (district/taluka/village)');
  mark(Boolean(draft.data_usage_consent), 'Data usage consent');
  mark(Boolean(draft.carbon_rights_consent), 'Carbon rights consent');
  mark(Boolean(draft.project_participation_consent), 'Participation consent');
  mark(Boolean(draft.farmer_signature_confirmed), 'Agreement read confirmed');
  mark(
    Boolean(draft.agreement_otp_verified && draft.agreement_verification_token.trim()),
    'Agreement OTP verified',
  );
  mark(Boolean(draft.land_survey_number.trim() && draft.land_area.trim()), 'Land survey + area');
  mark(Boolean(draft.farm_name?.trim()), 'Farm name');

  const mappingStatus = draft.boundary_mapping_status;
  const mappingOk =
    mappingStatus === 'mapped'
    || mappingStatus === 'pending_review'
    || mappingStatus === 'pending';
  mark(mappingOk, 'Land mapping choice (mapped or skip)');

  const hasEvidence =
    Boolean(draft.farmer_photo)
    || Boolean(draft.consent_form)
    || Boolean(draft.proof_of_land_ownership)
    || (Array.isArray(draft.boundary_points) && draft.boundary_points.length >= 3);
  mark(hasEvidence || mappingStatus === 'pending', 'Required evidence / mapping');

  const farmerFarmIdsOk =
    !draftAlreadyNeedsIds(draft)
    || (Boolean(draft.farmer_id) && Boolean(draft.farm_id));
  mark(farmerFarmIdsOk, 'Farmer ID / Farm ID available when required');

  // No obsolete MPIN/password requirement.
  completed.push('MPIN/password not required');

  return {
    canSubmit: missing.length === 0 && validateSubmit(draft) === null,
    completed,
    missing,
  };
}

function draftAlreadyNeedsIds(draft: OnboardingDraft): boolean {
  return draft.boundary_mapping_status === 'mapped' || draft.boundary_mapping_status === 'pending_review';
}
