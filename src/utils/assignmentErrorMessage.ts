const NO_ASSIGNMENT_MESSAGE =
  'No active working area is assigned to your account. Please contact Admin.';

const OUTSIDE_AREA_MESSAGE =
  'This village is outside your assigned working area. Please select a village assigned by Admin.';

const MAPPING_LOAD_ERROR = 'Unable to load mapping details. Please check your connection and retry.';

function isFieldOfficerOnlyNoise(message: string): boolean {
  return /field officer-only|not required for artisan|use artisan pro farmer onboarding|this action is not available for artisan pro|requires a field officer login/i.test(
    message,
  );
}

export function sanitizeAssignmentError(message: string | null | undefined): string {
  const raw = String(message ?? '').trim();
  if (!raw) {
    return NO_ASSIGNMENT_MESSAGE;
  }

  // Never surface FO-only / FO-link noise as a missing assignment.
  if (isFieldOfficerOnlyNoise(raw)) {
    return MAPPING_LOAD_ERROR;
  }

  if (/must be linked to a field officer|link a field officer|linked to a field officer/i.test(raw)) {
    return MAPPING_LOAD_ERROR;
  }

  if (/outside your assigned working area|outside assigned|select a village assigned/i.test(raw)) {
    return OUTSIDE_AREA_MESSAGE;
  }

  if (/no active working area|no assigned working area|no assigned area found/i.test(raw)) {
    return NO_ASSIGNMENT_MESSAGE;
  }

  return raw;
}

/** Consent / onboarding / mapping API errors — FO-only noise must not block the flow. */
export function sanitizeOnboardingApiError(message: string | null | undefined): string | null {
  const raw = String(message ?? '').trim();
  if (!raw) {
    return null;
  }

  if (isFieldOfficerOnlyNoise(raw)) {
    return null;
  }

  if (/must be linked to a field officer|link a field officer|linked to a field officer/i.test(raw)) {
    return null;
  }

  if (/outside your assigned working area|outside assigned|select a village assigned/i.test(raw)) {
    return OUTSIDE_AREA_MESSAGE;
  }

  if (/no active working area|no assigned working area|no assigned area found/i.test(raw)) {
    return NO_ASSIGNMENT_MESSAGE;
  }

  return raw;
}

export function sanitizeMappingApiError(message: string | null | undefined): string {
  return sanitizeOnboardingApiError(message) ?? MAPPING_LOAD_ERROR;
}

export { NO_ASSIGNMENT_MESSAGE, OUTSIDE_AREA_MESSAGE, MAPPING_LOAD_ERROR };
