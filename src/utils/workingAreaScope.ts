import type { WorkingAreaEntry } from '../components/officer/WorkingAreaSelector';

/** Mirrors backend `WorkingAreaScope::STORED_VILLAGE_NAME`. */
export const ENTIRE_CITY_STORED_LABEL = 'Entire City';

/** Mirrors backend `WorkingAreaScope::ENTIRE_CITY_LABEL`. */
export const ENTIRE_CITY_OPTION_LABEL = 'Entire City / All Locations';

/**
 * Approved city taluka names from backend `database/data/gujarat_urban_villages.php`.
 * Used only when API metadata is unavailable.
 */
const APPROVED_CITY_TALUKA_NAMES = new Set([
  'Vadodara City East',
  'Vadodara City West',
  'Vadodara City North',
  'Vadodara City South',
]);

export interface EntireCityOption {
  id: number;
  taluka_id: number;
  name: string;
  scope: 'taluka';
}

export interface LocationSelectOption {
  id: number;
  name: string;
  pincode?: string | null;
  scope?: 'taluka' | 'village';
  talukaId?: number;
}

/** Negative taluka id sentinel used by backend for full-city scope. */
export function entireCityOptionValue(talukaId: number): number {
  return -Math.abs(talukaId);
}

export function isEntireCityOptionValue(value: number): boolean {
  return value < 0;
}

export function talukaIdFromEntireCityOption(value: number): number {
  return Math.abs(value);
}

export function entireCityDisplayLabel(talukaName: string): string {
  return `${talukaName} — ${ENTIRE_CITY_STORED_LABEL}`;
}

export function isCityTalukaName(talukaName?: string | null): boolean {
  const normalized = talukaName?.trim();
  return normalized ? APPROVED_CITY_TALUKA_NAMES.has(normalized) : false;
}

export function isCityTalukaMetadata(input?: {
  is_city?: boolean;
  scope_type?: string;
  location_type?: string;
  allow_entire_taluka?: boolean;
  city_scope_enabled?: boolean;
} | null): boolean {
  if (!input) {
    return false;
  }

  if (input.is_city === true || input.allow_entire_taluka === true || input.city_scope_enabled === true) {
    return true;
  }

  const scopeType = String(input.scope_type ?? input.location_type ?? '').trim().toLowerCase();
  return scopeType === 'city' || scopeType === 'urban';
}

export function splitWorkingAreaSelection(values: number[]): {
  villageIds: number[];
  fullCityTalukaIds: number[];
  entireCityOptionIds: number[];
} {
  const villageIds: number[] = [];
  const fullCityTalukaIds: number[] = [];
  const entireCityOptionIds: number[] = [];

  values.forEach((value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric === 0) {
      return;
    }

    if (isEntireCityOptionValue(numeric)) {
      entireCityOptionIds.push(numeric);
      fullCityTalukaIds.push(talukaIdFromEntireCityOption(numeric));
      return;
    }

    if (numeric > 0) {
      villageIds.push(numeric);
    }
  });

  return {
    villageIds: Array.from(new Set(villageIds)),
    fullCityTalukaIds: Array.from(new Set(fullCityTalukaIds)),
    entireCityOptionIds: Array.from(new Set(entireCityOptionIds)),
  };
}

export function mergeVillageSelectOptions(
  entireCityOptions: EntireCityOption[],
  villages: Array<{ id: number; name: string; pincode?: string | null }>,
): LocationSelectOption[] {
  const cityOptions: LocationSelectOption[] = entireCityOptions.map((option) => ({
    id: option.id,
    name: option.name,
    scope: 'taluka',
    talukaId: option.taluka_id,
  }));

  const villageOptions: LocationSelectOption[] = villages.map((village) => ({
    id: village.id,
    name: village.name,
    pincode: village.pincode,
    scope: 'village',
  }));

  return [...cityOptions, ...villageOptions];
}

/** Entire City first, then villages, repeated per selected taluka (working-area picker). */
export function buildGroupedVillageSelectOptions(
  orderedTalukaIds: number[],
  talukaNames: Record<number, string>,
  entireCityOptions: EntireCityOption[],
  villagesByTaluka: Record<number, Array<{ id: number; name: string; pincode?: string | null; taluka_id?: number }>>,
): LocationSelectOption[] {
  const seen = new Set<number>();
  const options: LocationSelectOption[] = [];

  orderedTalukaIds.forEach((talukaId) => {
    const normalizedTalukaId = Number(talukaId);
    if (!Number.isFinite(normalizedTalukaId) || normalizedTalukaId <= 0 || seen.has(normalizedTalukaId)) {
      return;
    }

    seen.add(normalizedTalukaId);

    const cityOptions = resolveEntireCityOptions(
      normalizedTalukaId,
      talukaNames[normalizedTalukaId],
      entireCityOptions,
    );
    const villages = (villagesByTaluka[normalizedTalukaId] ?? []).filter((village) => village.id > 0);

    const talukaOptions = mergeVillageSelectOptions(cityOptions, villages).map((option) => ({
      ...option,
      talukaId: option.talukaId ?? normalizedTalukaId,
    }));

    options.push(...talukaOptions);
  });

  return options;
}

/**
 * Per taluka: Entire City and specific villages are mutually exclusive.
 * Entire City wins when both would be selected for the same taluka.
 */
export function reconcileWorkingVillageSelection(
  selectedIds: number[],
  options: LocationSelectOption[],
): number[] {
  const optionById = new Map(options.map((option) => [option.id, option]));
  const byTaluka = new Map<number, number[]>();

  selectedIds.forEach((id) => {
    const option = optionById.get(id);
    if (!option) {
      return;
    }

    const talukaId = talukaIdForLocationOption(option);
    if (talukaId <= 0) {
      return;
    }

    const bucket = byTaluka.get(talukaId) ?? [];
    bucket.push(id);
    byTaluka.set(talukaId, bucket);
  });

  const reconciled: number[] = [];
  byTaluka.forEach((ids) => {
    const entireCityId = ids.find((id) => isEntireCityOptionValue(id));
    if (entireCityId != null) {
      reconciled.push(entireCityId);
      return;
    }

    reconciled.push(...ids.filter((id) => !isEntireCityOptionValue(id)));
  });

  return reconciled;
}

export function talukaIdForLocationOption(option: LocationSelectOption): number {
  if (option.talukaId && option.talukaId > 0) {
    return option.talukaId;
  }

  if (isEntireCityOptionValue(option.id)) {
    return talukaIdFromEntireCityOption(option.id);
  }

  return 0;
}

/** Prefer API `entire_city_options`; fall back to approved city taluka names. */
export function resolveEntireCityOptions(
  talukaId: number,
  talukaName?: string | null,
  apiOptions: EntireCityOption[] = [],
): EntireCityOption[] {
  const forTaluka = apiOptions.filter((option) => Number(option.taluka_id) === talukaId);
  if (forTaluka.length > 0) {
    return forTaluka;
  }

  const normalizedName = talukaName?.trim();
  if (!normalizedName || !isCityTalukaName(normalizedName)) {
    return [];
  }

  return [
    {
      id: entireCityOptionValue(talukaId),
      taluka_id: talukaId,
      name: entireCityDisplayLabel(normalizedName),
      scope: 'taluka',
    },
  ];
}

export function buildWorkingAreaSubmitPayload(entries: WorkingAreaEntry[]): {
  working_village_ids: number[];
  working_full_city_taluka_ids: number[];
  working_district_ids: number[];
  working_taluka_ids: number[];
  working_taluka_id?: number;
} {
  const allValues = entries.flatMap((entry) => entry.villageIds);
  const split = splitWorkingAreaSelection(allValues);

  const workingDistrictIds = Array.from(
    new Set(entries.map((entry) => entry.districtId).filter((id) => id > 0)),
  );
  const workingTalukaIds = Array.from(
    new Set(entries.map((entry) => entry.talukaId).filter((id) => id > 0)),
  );

  const workingVillageIds = Array.from(
    new Set([...split.entireCityOptionIds, ...split.villageIds]),
  );

  return {
    working_village_ids: workingVillageIds,
    working_full_city_taluka_ids: split.fullCityTalukaIds,
    working_district_ids: workingDistrictIds,
    working_taluka_ids: workingTalukaIds,
    working_taluka_id: workingTalukaIds.length === 1 ? workingTalukaIds[0] : undefined,
  };
}
