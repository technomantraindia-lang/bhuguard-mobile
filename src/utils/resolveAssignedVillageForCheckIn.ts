import { getVillages } from '../api/addressApi';
import type { AssignedLocationsPayload, AssignedVillage } from '../types/assignedLocations';
import {
  resolveValidatedCaptureLocation,
  type ValidatedCaptureLocation,
} from './livePhotoLocation';

export type AssignedVillageTriad = {
  village_id: number | null;
  taluka_id: number;
  district_id: number;
  village_name: string | null;
  taluka_name: string | null;
  district_name: string | null;
  locality: string | null;
  state_name?: string | null;
  assignedSummary: string;
  matchMethod: 'village_id' | 'village_name' | 'locality_alias' | 'taluka_scope' | 'district_scope';
  working_area_scope?: 'village' | 'city';
};

export type CheckInCurrentLocation = {
  locality: string | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
};

export class WorkingAreaOutOfZoneError extends Error {
  readonly code = 'OUT_OF_ZONE' as const;
  readonly currentLocation: CheckInCurrentLocation;
  readonly assignedSummary: string;

  constructor(currentLocation: CheckInCurrentLocation, assignedSummary: string) {
    super('You appear to be outside your assigned working area.');
    this.name = 'WorkingAreaOutOfZoneError';
    this.currentLocation = currentLocation;
    this.assignedSummary = assignedSummary;
  }
}

export class WorkingAreaAssignmentError extends Error {
  readonly code = 'NO_ASSIGNMENT' as const;

  constructor(message: string) {
    super(message);
    this.name = 'WorkingAreaAssignmentError';
  }
}

function normalizeName(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=_`~()'"[\]\\]/g, ' ')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesEqual(leftRaw: string | null | undefined, rightRaw: string | null | undefined): boolean {
  const left = normalizeName(leftRaw);
  const right = normalizeName(rightRaw);
  return Boolean(left && right && left === right);
}

function namesOverlap(leftRaw: string | null | undefined, rightRaw: string | null | undefined): boolean {
  const left = normalizeName(leftRaw);
  const right = normalizeName(rightRaw);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  // Avoid weak short substring hits (e.g. "ram" inside unrelated names).
  if (left.length < 4 || right.length < 4) {
    return false;
  }
  return left.includes(right) || right.includes(left);
}

function isUnknownLabel(value: string | null | undefined): boolean {
  const normalized = normalizeName(value);
  return (
    !normalized ||
    normalized === 'unknown' ||
    normalized === 'village unavailable' ||
    normalized === '-' ||
    normalized === '—'
  );
}

function assignedSummary(payload: AssignedLocationsPayload, villages: AssignedVillage[]): string {
  const districtNames = (payload.districts ?? []).map((district) => district.name).filter(Boolean);
  const talukaNames = (payload.talukas ?? []).map((taluka) => taluka.name).filter(Boolean);

  const parts: string[] = [];
  if (districtNames.length > 0) {
    parts.push(`District: ${districtNames.slice(0, 3).join(', ')}${districtNames.length > 3 ? '…' : ''}`);
  }
  if (talukaNames.length > 0) {
    parts.push(`Taluka: ${talukaNames.slice(0, 3).join(', ')}${talukaNames.length > 3 ? '…' : ''}`);
  }
  if (villages.length > 0) {
    parts.push(`${villages.length} assigned village${villages.length === 1 ? '' : 's'}`);
  }

  return parts.join(' · ') || 'Assigned area on file';
}

function validAssignedVillages(allocated: AssignedLocationsPayload | null | undefined): AssignedVillage[] {
  return (allocated?.villages ?? []).filter(
    (village): village is AssignedVillage =>
      Number.isFinite(Number(village?.id)) &&
      Number(village.id) > 0 &&
      Number.isFinite(Number(village?.taluka_id)) &&
      Number(village.taluka_id) > 0 &&
      Number.isFinite(Number(village?.district_id)) &&
      Number(village.district_id) > 0,
  );
}

function toTriad(
  village: AssignedVillage,
  locality: string | null,
  summary: string,
  matchMethod: AssignedVillageTriad['matchMethod'],
): AssignedVillageTriad {
  return {
    village_id: Number(village.id),
    taluka_id: Number(village.taluka_id),
    district_id: Number(village.district_id),
    village_name: village.name ?? null,
    taluka_name: village.taluka_name ?? null,
    district_name: village.district_name ?? null,
    locality,
    assignedSummary: summary,
    matchMethod,
    working_area_scope: 'village',
  };
}

function labelCandidates(resolved: ValidatedCaptureLocation, locality: string | null): string[] {
  return [resolved.village, locality]
    .map((value) => String(value ?? '').trim())
    .filter((value) => value && !isUnknownLabel(value));
}

function matchByName(
  villages: AssignedVillage[],
  candidates: string[],
  preferTalukaId?: number | null,
  preferDistrictId?: number | null,
): AssignedVillage | null {
  const scoped =
    preferTalukaId && preferTalukaId > 0
      ? villages.filter((village) => Number(village.taluka_id) === preferTalukaId)
      : preferDistrictId && preferDistrictId > 0
        ? villages.filter((village) => Number(village.district_id) === preferDistrictId)
        : villages;

  const pool = scoped.length > 0 ? scoped : villages;

  const exact = pool.find((village) => candidates.some((candidate) => namesEqual(candidate, village.name)));
  if (exact) {
    return exact;
  }

  const overlap = pool.find((village) => candidates.some((candidate) => namesOverlap(candidate, village.name)));
  return overlap ?? null;
}

function matchByCanonicalId(
  villages: AssignedVillage[],
  resolved: ValidatedCaptureLocation,
): AssignedVillage | null {
  if (resolved.villageId && resolved.villageId > 0) {
    return villages.find((village) => Number(village.id) === Number(resolved.villageId)) ?? null;
  }

  return null;
}

async function matchLocalityViaAddressMaster(
  villages: AssignedVillage[],
  talukaId: number,
  candidates: string[],
): Promise<AssignedVillage | null> {
  for (const candidate of candidates) {
    try {
      const lookup = await getVillages(talukaId, candidate);
      for (const option of lookup.villages) {
        const assigned = villages.find((village) => Number(village.id) === Number(option.id));
        if (assigned) {
          return assigned;
        }
        // Locality may resolve to a master village that is assigned under a different label.
        if (candidates.some((label) => namesOverlap(label, option.name))) {
          const byName = villages.find(
            (village) =>
              Number(village.taluka_id) === talukaId && namesOverlap(village.name, option.name),
          );
          if (byName) {
            return byName;
          }
        }
      }
    } catch {
      // Keep trying other candidates / fallbacks.
    }
  }

  return null;
}

async function hasFullTalukaCoverage(villages: AssignedVillage[], talukaId: number): Promise<boolean> {
  const assignedInTaluka = villages.filter((village) => Number(village.taluka_id) === talukaId);
  if (assignedInTaluka.length === 0) {
    return false;
  }

  try {
    const master = await getVillages(talukaId);
    if (master.villages.length === 0) {
      return false;
    }
    const assignedIds = new Set(assignedInTaluka.map((village) => Number(village.id)));
    return master.villages.every((option) => assignedIds.has(Number(option.id)));
  } catch {
    return false;
  }
}

function assignedFullCityTalukaIds(payload: AssignedLocationsPayload): number[] {
  const explicit = (payload.work_full_city_taluka_ids ?? [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
  const fromSentinels = (payload.work_village_ids ?? [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id < 0)
    .map((id) => Math.abs(id));
  const fromScopes = (payload.taluka_scopes ?? [])
    .map((scope) => Number(scope.id))
    .filter((id) => Number.isFinite(id) && id > 0);

  return [...new Set([...explicit, ...fromSentinels, ...fromScopes])];
}

function matchByFullCityTalukaScope(
  payload: AssignedLocationsPayload,
  resolved: ValidatedCaptureLocation,
  summary: string,
  locality: string | null,
  fullTalukaIds: number[],
): AssignedVillageTriad | null {
  const talukaId =
    resolved.talukaId && resolved.talukaId > 0
      ? resolved.talukaId
      : resolved.villageId && resolved.villageId > 0
        ? null
        : null;

  if (!talukaId || !fullTalukaIds.includes(talukaId)) {
    return null;
  }

  const taluka = (payload.talukas ?? []).find((entry) => Number(entry.id) === talukaId);
  const districtId =
    resolved.districtId && resolved.districtId > 0
      ? resolved.districtId
      : Number(taluka?.district_id ?? 0);

  return {
    village_id: null,
    taluka_id: talukaId,
    district_id: districtId,
    village_name: resolved.resolved && !isUnknownLabel(resolved.village) ? resolved.village : null,
    taluka_name: !isUnknownLabel(resolved.taluka) ? resolved.taluka : (taluka?.name ?? null),
    district_name: !isUnknownLabel(resolved.district) ? resolved.district : null,
    locality,
    assignedSummary: summary,
    matchMethod: 'taluka_scope',
    working_area_scope: 'city',
  };
}

async function matchByTalukaOrDistrictScope(
  allocated: AssignedLocationsPayload,
  villages: AssignedVillage[],
  resolved: ValidatedCaptureLocation,
  candidates: string[],
): Promise<{ village: AssignedVillage; method: AssignedVillageTriad['matchMethod'] } | null> {
  const talukaId = resolved.talukaId && resolved.talukaId > 0 ? resolved.talukaId : null;
  const districtId = resolved.districtId && resolved.districtId > 0 ? resolved.districtId : null;

  if (talukaId) {
    const inTaluka = villages.filter((village) => Number(village.taluka_id) === talukaId);

    if (inTaluka.length > 0 || (allocated.talukas ?? []).some((taluka) => Number(taluka.id) === talukaId)) {
      const named = matchByName(inTaluka.length > 0 ? inTaluka : villages, candidates, talukaId, districtId);
      if (named) {
        return { village: named, method: 'village_name' };
      }

      const viaMaster = await matchLocalityViaAddressMaster(
        inTaluka.length > 0 ? inTaluka : villages,
        talukaId,
        candidates,
      );
      if (viaMaster) {
        return { village: viaMaster, method: 'locality_alias' };
      }

      // Single assigned village in the resolved taluka — locality is inside that working area.
      if (inTaluka.length === 1) {
        return { village: inTaluka[0]!, method: 'taluka_scope' };
      }

      // Officer is assigned every village in the taluka — authorize by taluka scope.
      if (inTaluka.length > 1 && (await hasFullTalukaCoverage(villages, talukaId))) {
        const sorted = [...inTaluka].sort((a, b) => Number(a.id) - Number(b.id));
        return { village: sorted[0]!, method: 'taluka_scope' };
      }
    }
  }

  if (districtId) {
    const inDistrict = villages.filter((village) => Number(village.district_id) === districtId);
    const districtAssigned =
      inDistrict.length > 0 ||
      (allocated.districts ?? []).some((district) => Number(district.id) === districtId);

    if (districtAssigned) {
      const named = matchByName(inDistrict.length > 0 ? inDistrict : villages, candidates, null, districtId);
      if (named) {
        return { village: named, method: 'village_name' };
      }

      if (inDistrict.length === 1) {
        return { village: inDistrict[0]!, method: 'district_scope' };
      }

      // District-level assignment listed in payload (not merely derived): allow district scope
      // only when the districts list contains this id AND villages cover the district grain
      // from backend expansion (very large lists). Prefer taluka resolution above.
      const directDistrict = (allocated.districts ?? []).some(
        (district) => Number(district.id) === districtId,
      );
      if (directDistrict && inDistrict.length > 1 && !talukaId) {
        const sorted = [...inDistrict].sort((a, b) => Number(a.id) - Number(b.id));
        return { village: sorted[0]!, method: 'district_scope' };
      }
    }
  }

  return null;
}

/**
 * Resolve check-in village IDs from Admin-assigned working area + GPS reverse geocode.
 *
 * Priority:
 * 1. Canonical address-master village ID intersected with assignments
 * 2. Normalized village/locality name within assigned taluka/district
 * 3. Address-master locality alias within assigned taluka
 * 4. Assigned taluka/district scope when village cannot be resolved from locality-only geocode
 *
 * Never invents success outside the assigned set.
 */
export async function resolveAssignedVillageForCheckIn(
  latitude: number,
  longitude: number,
  allocated: AssignedLocationsPayload | null | undefined,
): Promise<AssignedVillageTriad> {
  const villages = validAssignedVillages(allocated);
  const payload = allocated ?? { districts: [], talukas: [], villages: [] };
  const fullTalukaIds = assignedFullCityTalukaIds(payload);
  const summary = assignedSummary(payload, villages);

  if (villages.length === 0 && fullTalukaIds.length === 0) {
    const hasArea =
      payload.has_assignment === true ||
      (payload.talukas?.length ?? 0) > 0 ||
      (payload.districts?.length ?? 0) > 0;

    throw new WorkingAreaAssignmentError(
      hasArea
        ? 'Assigned area has no villages yet. Please ask Admin to assign specific villages before check-in.'
        : 'No assigned working area found. Please ask Admin to assign villages before check-in.',
    );
  }

  const resolved = await resolveValidatedCaptureLocation(latitude, longitude);

  // When address-master cannot resolve a canonical village, the capture helper keeps the
  // reverse-geocode locality/neighbourhood (e.g. "Ram Wadi") in `village`.
  const locality =
    !resolved.resolved && !isUnknownLabel(resolved.village) ? resolved.village : null;

  const currentLocation: CheckInCurrentLocation = {
    locality,
    village: resolved.resolved && !isUnknownLabel(resolved.village) ? resolved.village : null,
    taluka: !isUnknownLabel(resolved.taluka) ? resolved.taluka : null,
    district: !isUnknownLabel(resolved.district) ? resolved.district : null,
  };

  const candidates = labelCandidates(resolved, locality);

  const byId = matchByCanonicalId(villages, resolved);
  if (byId) {
    return toTriad(byId, locality, summary, 'village_id');
  }

  const byFullCity = matchByFullCityTalukaScope(payload, resolved, summary, locality, fullTalukaIds);
  if (byFullCity) {
    return byFullCity;
  }

  const byName = matchByName(villages, candidates, resolved.talukaId, resolved.districtId);
  if (byName) {
    return toTriad(byName, locality, summary, 'village_name');
  }

  const byScope = await matchByTalukaOrDistrictScope(payload, villages, resolved, candidates);
  if (byScope) {
    return toTriad(byScope.village, locality, summary, byScope.method);
  }

  throw new WorkingAreaOutOfZoneError(currentLocation, summary);
}
