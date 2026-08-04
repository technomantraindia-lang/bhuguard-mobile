import { createFarmerOnboarding, createFieldOfficerFarmerFarm } from '../api/fieldOfficerApi';
import type { OnboardingDraft } from '../context/OnboardingContext';
import { getApiErrorMessage } from '../api/authApi';
import { pickString, type ApiRecord } from './apiHelpers';
import { sanitizeMappingApiError, sanitizeOnboardingApiError } from './assignmentErrorMessage';
import { isValidEntityId, toPositiveEntityId } from './entityId';
import {
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

function readEnsuredFromAdditionalFarm(
  farm: ApiRecord,
  draft: OnboardingDraft,
  farmerId: number,
): EnsuredOnboardingIds {
  const farmId = toPositiveEntityId(farm.id ?? farm.farm_id);
  if (farmId == null) {
    throw new Error('Farm creation succeeded but farm ID was missing from the API response.');
  }

  return {
    farmerId,
    farmId,
    farmerCode: draft.farmer_code?.trim() || null,
    farmCode: pickString(farm, 'farm_code') !== '-' ? pickString(farm, 'farm_code') : null,
    farmerName: draft.farmer_name.trim() || 'Farmer',
    farmName:
      pickString(farm, 'farm_name') !== '-'
        ? pickString(farm, 'farm_name')
        : draft.farm_name?.trim() || null,
  };
}

function buildAdditionalFarmPayload(draft: OnboardingDraft): ApiRecord {
  return {
    farm_name: draft.farm_name.trim(),
    land_survey_number: draft.land_survey_number.trim() || undefined,
    land_area: draft.land_area.trim() ? Number(draft.land_area) : undefined,
    land_area_unit: draft.land_area_unit.trim() || undefined,
    ownership_type: draft.ownership_type.trim() || undefined,
    ownership_other_detail:
      draft.ownership_type.trim() === 'other'
        ? draft.ownership_other_detail.trim() || undefined
        : undefined,
    irrigation_type: draft.irrigation_type.trim() || undefined,
    soil_type: draft.soil_type.trim() || undefined,
    crop_type: draft.crop_type.trim() || undefined,
    existing_farming_practice: draft.existing_farming_practice.trim() || undefined,
    gps_latitude: draft.gps_latitude.trim() ? Number(draft.gps_latitude) : undefined,
    gps_longitude: draft.gps_longitude.trim() ? Number(draft.gps_longitude) : undefined,
    gps_accuracy: draft.gps_accuracy.trim() ? Number(draft.gps_accuracy) : undefined,
    district_id: draft.district_id.trim() ? Number(draft.district_id) : undefined,
    taluka_id: draft.taluka_id.trim() ? Number(draft.taluka_id) : undefined,
    village_id: draft.village_id.trim() ? Number(draft.village_id) : undefined,
    state: draft.state.trim() || undefined,
    pincode: draft.pincode.trim() || undefined,
  };
}

/**
 * Ensures Farmer + Farm records exist before FO boundary mapping.
 * Idempotent when draft already holds valid IDs.
 * When farmer_id exists but farm_id is cleared (Add New Farm), creates only a new Farm.
 */
export async function ensureOnboardingFarmerFarm(
  draft: OnboardingDraft,
  toFormData: () => FormData,
): Promise<EnsureOnboardingFarmerFarmResult> {
  const existing = readEnsuredFromDraft(draft);
  if (existing) {
    return { status: 'ready', ids: existing };
  }

  const existingFarmerId = toPositiveEntityId(draft.farmer_id);
  const landError = validateLandDetails(draft);
  if (landError) {
    return {
      status: 'missing_farm',
      message: 'Please complete and save the Farm Details step before mapping.',
    };
  }

  // Phase 10.11 — additional farm for an already-persisted Farmer.
  if (existingFarmerId != null) {
    try {
      const farm = await createFieldOfficerFarmerFarm(
        existingFarmerId,
        buildAdditionalFarmPayload(draft),
      );
      return { status: 'ready', ids: readEnsuredFromAdditionalFarm(farm, draft, existingFarmerId) };
    } catch (error) {
      const raw = getApiErrorMessage(
        error,
        'Unable to create the new farm. Please check your connection and retry.',
      );
      return {
        status: 'network_error',
        message: sanitizeOnboardingApiError(raw) ?? sanitizeMappingApiError(raw),
      };
    }
  }

  const profileError = validateFarmerProfileStep1(draft);
  if (profileError) {
    return { status: 'missing_profile', message: profileError };
  }

  try {
    const farmer = await createFarmerOnboarding(toFormData());
    return { status: 'ready', ids: readEnsuredFromApi(farmer, draft) };
  } catch (error) {
    const raw = getApiErrorMessage(
      error,
      'Unable to load mapping details. Please check your connection and retry.',
    );
    return {
      status: 'network_error',
      message: sanitizeOnboardingApiError(raw) ?? sanitizeMappingApiError(raw),
    };
  }
}

export function draftAlreadyHasFarmerFarm(draft: OnboardingDraft): boolean {
  return isValidEntityId(draft.farmer_id) && isValidEntityId(draft.farm_id);
}
