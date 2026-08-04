import * as Location from 'expo-location';

import type { AssignedLocationsPayload, AssignedVillage } from '../types/assignedLocations';

export type AssignedVillageTriad = {
  village_id: number;
  taluka_id: number;
  district_id: number;
  village_name: string | null;
  taluka_name: string | null;
  district_name: string | null;
  state_name?: string | null;
  assignedSummary: string;
};

function normalizeName(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function namesOverlap(leftRaw: string, rightRaw: string): boolean {
  const left = normalizeName(leftRaw);
  const right = normalizeName(rightRaw);
  if (!left || !right) {
    return false;
  }
  return left.includes(right) || right.includes(left);
}

function collectGeoCandidates(place: Location.LocationGeocodedAddress | undefined): string[] {
  if (!place) {
    return [];
  }
  return [
    place.district,
    place.subregion,
    place.city,
    place.name,
    place.street,
    place.region,
  ]
    .map((value) => String(value ?? '').trim())
    .filter(Boolean);
}

function matchAssignedVillages(
  villages: AssignedVillage[],
  geoCandidates: string[],
  geoTaluka: string,
  geoDistrict: string,
): AssignedVillage[] {
  return villages.filter((village) => {
    const villageName = village.name ?? '';
    const nameHit = geoCandidates.some((candidate) => namesOverlap(candidate, villageName));
    if (!nameHit) {
      return false;
    }
    const talukaOk =
      !geoTaluka ||
      !village.taluka_name ||
      namesOverlap(geoTaluka, village.taluka_name);
    const districtOk =
      !geoDistrict ||
      !village.district_name ||
      namesOverlap(geoDistrict, village.district_name);
    return talukaOk && districtOk;
  });
}

function assignedSummary(payload: AssignedLocationsPayload, villages: AssignedVillage[]): string {
  const villageNames = villages.map((village) => village.name).filter(Boolean);
  if (villageNames.length > 0) {
    return villageNames.slice(0, 4).join(', ') + (villageNames.length > 4 ? '…' : '');
  }
  const talukaNames = (payload.talukas ?? []).map((taluka) => taluka.name).filter(Boolean);
  if (talukaNames.length > 0) {
    return `Taluka: ${talukaNames.slice(0, 3).join(', ')}`;
  }
  const districtNames = (payload.districts ?? []).map((district) => district.name).filter(Boolean);
  if (districtNames.length > 0) {
    return `District: ${districtNames.slice(0, 3).join(', ')}`;
  }
  return 'Assigned area on file';
}

/**
 * Resolve check-in village IDs from Admin-assigned working area + GPS reverse geocode.
 * Never invents success outside the assigned set.
 */
export async function resolveAssignedVillageForCheckIn(
  latitude: number,
  longitude: number,
  allocated: AssignedLocationsPayload | null | undefined,
): Promise<AssignedVillageTriad> {
  const villages = (allocated?.villages ?? []).filter(
    (village): village is AssignedVillage =>
      Number.isFinite(Number(village?.id)) &&
      Number(village.id) > 0 &&
      Number.isFinite(Number(village?.taluka_id)) &&
      Number(village.taluka_id) > 0 &&
      Number.isFinite(Number(village?.district_id)) &&
      Number(village.district_id) > 0,
  );

  const summary = assignedSummary(allocated ?? { districts: [], talukas: [], villages: [] }, villages);

  if (villages.length === 0) {
    const hasArea =
      allocated?.has_assignment === true ||
      (allocated?.talukas?.length ?? 0) > 0 ||
      (allocated?.districts?.length ?? 0) > 0;

    throw new Error(
      hasArea
        ? 'Assigned area has no villages yet. Please ask Admin to assign specific villages before check-in.'
        : 'No assigned working area found. Please ask Admin to assign villages before check-in.',
    );
  }

  let placemarks: Location.LocationGeocodedAddress[] = [];
  try {
    placemarks = await Location.reverseGeocodeAsync({ latitude, longitude });
  } catch {
    placemarks = [];
  }

  const place = placemarks[0];
  const geoCandidates = collectGeoCandidates(place);
  const geoTaluka = String(place?.subregion || place?.city || '');
  const geoDistrict = String(place?.region || place?.subregion || '');
  const geoVillage =
    place?.district || place?.subregion || place?.city || place?.name || geoCandidates[0] || '';

  const matched = matchAssignedVillages(villages, geoCandidates, geoTaluka, geoDistrict);

  let chosen: AssignedVillage | null = matched.length === 1 ? (matched[0] ?? null) : null;

  if (!chosen && villages.length === 1) {
    chosen = villages[0] ?? null;
  }

  if (!chosen && matched.length > 1) {
    // Prefer exact village-name overlap when multiple assigned villages match the same area.
    const exact = matched.find((village) =>
      geoCandidates.some((candidate) => normalizeName(candidate) === normalizeName(village.name)),
    );
    chosen = exact ?? matched[0] ?? null;
  }

  if (!chosen) {
    const current = String(geoVillage || '').trim() || '—';
    const assigned = villages.map((village) => village.name).filter(Boolean).join(', ') || '—';
    throw new Error(
      `You are outside your assigned working area. Current location village: ${current}. Assigned villages: ${assigned}.`,
    );
  }

  return {
    village_id: Number(chosen.id),
    taluka_id: Number(chosen.taluka_id),
    district_id: Number(chosen.district_id),
    village_name: chosen.name ?? null,
    taluka_name: chosen.taluka_name ?? null,
    district_name: chosen.district_name ?? null,
    assignedSummary: summary,
  };
}
