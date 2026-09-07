import type { AssignedVillageTriad } from './resolveAssignedVillageForCheckIn';

export type ArtisanCheckInWorkingAreaScope = 'village' | 'city';

export interface ArtisanCheckInLocationPayload {
  district_id: number;
  taluka_id: number;
  village_id?: number;
  district_name: string | null;
  taluka_name: string | null;
  village_name: string | null;
  state_name?: string | null;
  working_area_scope: ArtisanCheckInWorkingAreaScope;
}

/** Build scope-aware location fields for POST /artisan/check-in. */
export function buildArtisanCheckInLocationPayload(
  triad: AssignedVillageTriad,
): ArtisanCheckInLocationPayload {
  const workingAreaScope = triad.working_area_scope ?? (triad.village_id != null ? 'village' : 'city');

  const payload: ArtisanCheckInLocationPayload = {
    district_id: triad.district_id,
    taluka_id: triad.taluka_id,
    district_name: triad.district_name ?? null,
    taluka_name: triad.taluka_name ?? null,
    village_name: triad.village_name ?? null,
    state_name: triad.state_name ?? null,
    working_area_scope: workingAreaScope,
  };

  if (workingAreaScope === 'village' && triad.village_id != null && triad.village_id > 0) {
    payload.village_id = triad.village_id;
  }

  return payload;
}
