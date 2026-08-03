import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import { getFieldOfficerFarmerFarms } from '../api/fieldOfficerApi';
import type { OnboardingDraft } from '../context/OnboardingContext';
import { defaultFarmName } from './displayIds';
import { toPositiveEntityId } from './entityId';

type UpdateDraft = (patch: Partial<OnboardingDraft>) => void;

/**
 * Phase 10.11 — start "Add New Farm with Mapping" for an existing Farmer.
 * Clears farm-specific draft fields, seeds the next Farm Name sequence, and
 * opens Land Details without repeating Farmer identity onboarding.
 */
export async function beginAddNewFarmWithMapping(options: {
  draft: OnboardingDraft;
  updateDraft: UpdateDraft;
  navigation: NavigationProp<ParamListBase>;
  farmerId?: number | null;
  farmerName?: string;
  farmCountHint?: number;
}): Promise<void> {
  const farmerId =
    toPositiveEntityId(options.farmerId)
    ?? toPositiveEntityId(options.draft.farmer_id);

  if (farmerId == null) {
    throw new Error('Farmer ID is required before adding a new farm.');
  }

  let farmIndex = Math.max(1, (options.farmCountHint ?? 0) + 1);
  try {
    const farms = await getFieldOfficerFarmerFarms(farmerId);
    if (Array.isArray(farms) && farms.length > 0) {
      farmIndex = farms.length + 1;
    }
  } catch {
    // Use hint / default index when the list call fails — creation still works.
  }

  const farmerName =
    (options.farmerName ?? options.draft.farmer_name ?? '').trim() || 'Farmer';

  options.updateDraft({
    farmer_id: farmerId,
    farm_id: null,
    farm_code: '',
    farm_name: defaultFarmName(farmerName, farmIndex),
    land_survey_number: '',
    land_area: '',
    land_area_unit: 'acre',
    ownership_type: '',
    ownership_other_detail: '',
    crop_type: '',
    irrigation_type: '',
    soil_type: '',
    existing_farming_practice: '',
    gps_latitude: '',
    gps_longitude: '',
    gps_accuracy: '',
    gps_captured_at: '',
    proof_of_land_ownership: null,
    farmer_with_farm_photo: null,
    documents_step_completed: false,
    boundary_mapping_status: 'not_mapped',
    boundary_points: [],
    boundary_pending_reason: '',
    boundary_verification_status: 'pending_review',
  });

  options.navigation.navigate('FarmerLandDetails');
}
