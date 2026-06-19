import type { OnboardingDraft } from '../context/OnboardingContext';

export function validateBasicDetails(draft: OnboardingDraft): string | null {
  if (!draft.farmer_name.trim()) {
    return 'Farmer name is required.';
  }

  if (!/^[6-9]\d{9}$/.test(draft.mobile.trim())) {
    return 'Mobile number must be 10 digits and start with 6-9.';
  }

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
    return 'Confirm that the farmer has read and signed the legal agreements.';
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

  if (!draft.land_area.trim() || Number.isNaN(Number(draft.land_area)) || Number(draft.land_area) <= 0) {
    return 'Land area is required and must be a positive number.';
  }

  if (!draft.land_area_unit) {
    return 'Area unit is required.';
  }

  return null;
}

export function validateGps(draft: OnboardingDraft): string | null {
  return validateBoundaryMapping(draft);
}

export function validateBoundaryMapping(draft: OnboardingDraft): string | null {
  if (draft.boundary_mapping_status === 'draft' && draft.boundary_pending_reason.trim()) {
    return null;
  }

  if (draft.boundary_mapping_status !== 'mapped' && draft.boundary_mapping_status !== 'pending_review') {
    return 'Land boundary mapping is required. Start Mobile Mapping and confirm the mapped land area.';
  }

  if (draft.boundary_points.length < 3) {
    return 'At least 3 GPS boundary points are required to complete land mapping.';
  }

  if (!draft.gps_latitude.trim() || !draft.gps_longitude.trim()) {
    return 'Mapped land center GPS is required. Confirm land area after boundary mapping.';
  }

  return null;
}

export function validateDocuments(_draft: OnboardingDraft): string | null {
  return null;
}

export function validateSubmit(draft: OnboardingDraft): string | null {
  return (
    validateFarmerProfileStep1(draft)
    ?? validateConsent(draft)
    ?? validateLandDetails(draft)
    ?? validateBoundaryMapping(draft)
    ?? validateDocuments(draft)
  );
}
