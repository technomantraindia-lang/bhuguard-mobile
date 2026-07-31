import { createFarmerOnboarding } from '../api/fieldOfficerApi';
import type { OnboardingDraft } from '../context/OnboardingContext';
import { getApiErrorMessage } from '../api/authApi';
import { pickString, type ApiRecord } from './apiHelpers';
import { sanitizeMappingApiError, sanitizeOnboardingApiError } from './assignmentErrorMessage';
import { isValidEntityId, toPositiveEntityId } from './entityId';
import {
  validateConsent,
  validateFarmerProfileStep1,
  validateLandDetails,
} from './onboardingValidation';

export type EnsuredOnboardingIds = {
  farmerId: number;
  farmId: number;
  farmerCode: string | null;
  farmCode: string | null;
  farmerName: string;
  farmName: string | null;
};

export type EnsureOnboardingFarmerFarmResult =
  | { status: 'ready'; ids: EnsuredOnboardingIds }
  | { status: 'missing_profile'; message: string }
  | { status: 'missing_farm'; message: string }
  | { status: 'missing_consent'; message: string }
  | { status: 'network_error'; message: string };

function readEnsuredFromDraft(draft: OnboardingDraft): EnsuredOnboardingIds | null {
  const farmerId = toPositiveEntityId(draft.farmer_id);
  const farmId = toPositiveEntityId(draft.farm_id);

  if (farmerId == null || farmId == null) {
    return null;
  }

  return {
    farmerId,
    farmId,
    farmerCode: draft.farmer_code?.trim() || null,
    farmCode: draft.farm_code?.trim() || null,
    farmerName: draft.farmer_name.trim() || 'Farmer',
    farmName: draft.farm_name?.trim() || null,
  };
}

function readEnsuredFromApi(farmer: ApiRecord, draft: OnboardingDraft): EnsuredOnboardingIds {
  const farmerId = toPositiveEntityId(farmer.farmer_id ?? farmer.id);
  const farmId = toPositiveEntityId(farmer.farm_id);

  if (farmerId == null || farmId == null) {
    throw new Error('Onboarding succeeded but farmer or farm ID was missing from the API response.');
  }

  return {
    farmerId,
    farmId,
    farmerCode: pickString(farmer, 'farmer_code') !== '-' ? pickString(farmer, 'farmer_code') : null,
    farmCode: pickString(farmer, 'farm_code') !== '-' ? pickString(farmer, 'farm_code') : null,
    farmerName: String(farmer.farmer_name ?? draft.farmer_name).trim() || 'Farmer',
    farmName:
      pickString(farmer, 'farm_name') !== '-'
        ? pickString(farmer, 'farm_name')
        : draft.village_name
          ? `${draft.village_name} - ${draft.land_survey_number}`
          : null,
  };
}

/**
 * Ensures Farmer + Farm records exist before FO boundary mapping.
 * Idempotent when draft already holds valid IDs.
 * Returns typed status so UI can show Farm vs Consent errors separately.
 */
export async function ensureOnboardingFarmerFarm(
  draft: OnboardingDraft,
  toFormData: () => FormData,
): Promise<EnsureOnboardingFarmerFarmResult> {
  const existing = readEnsuredFromDraft(draft);
  if (existing) {
    return { status: 'ready', ids: existing };
  }

  const profileError = validateFarmerProfileStep1(draft);
  if (profileError) {
    return { status: 'missing_profile', message: profileError };
  }

  const landError = validateLandDetails(draft);
  if (landError) {
    return {
      status: 'missing_farm',
      message: 'Please complete and save the Farm Details step before mapping.',
    };
  }

  const consentError = validateConsent(draft);
  if (consentError) {
    return {
      status: 'missing_consent',
      message: 'Project Participation Consent must be completed before Farm Mapping.',
    };
  }

  try {
    const farmer = await createFarmerOnboarding(toFormData());
    return { status: 'ready', ids: readEnsuredFromApi(farmer, draft) };
  } catch (error) {
    const raw = getApiErrorMessage(error, 'Unable to load mapping details. Please check your connection and retry.');
    return {
      status: 'network_error',
      message: sanitizeOnboardingApiError(raw) ?? sanitizeMappingApiError(raw),
    };
  }
}

export function draftAlreadyHasFarmerFarm(draft: OnboardingDraft): boolean {
  return isValidEntityId(draft.farmer_id) && isValidEntityId(draft.farm_id);
}
