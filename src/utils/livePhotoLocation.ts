import * as Location from 'expo-location';

import { getDistricts, getTalukas, getVillages, type AddressOption } from '../api/addressApi';

export interface ResolvedCaptureLocation {
  village: string;
  taluka: string;
  district: string;
  state: string;
}

export interface ValidatedCaptureLocation extends ResolvedCaptureLocation {
  resolved: boolean;
  villageId?: number | null;
  talukaId?: number | null;
  districtId?: number | null;
}

const UNKNOWN_LOCATION = 'Unknown';

const GUJARAT_DISTRICTS = [
  'Ahmedabad',
  'Amreli',
  'Anand',
  'Aravalli',
  'Banaskantha',
  'Bharuch',
  'Bhavnagar',
  'Botad',
  'Chhota Udaipur',
  'Dahod',
  'Dang',
  'Devbhoomi Dwarka',
  'Gandhinagar',
  'Gir Somnath',
  'Jamnagar',
  'Junagadh',
  'Kachchh',
  'Kheda',
  'Mahisagar',
  'Mehsana',
  'Morbi',
  'Narmada',
  'Navsari',
  'Panchmahal',
  'Patan',
  'Porbandar',
  'Rajkot',
  'Sabarkantha',
  'Surat',
  'Surendranagar',
  'Tapi',
  'Vadodara',
  'Valsad',
];

function cleanPart(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (/^[A-Z0-9]{4}\+[A-Z0-9]{2,}/i.test(trimmed)) {
    return null;
  }

  if (/^\d{3,}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function firstClean(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    const cleaned = cleanPart(value);

    if (cleaned) {
      return cleaned;
    }
  }

  return UNKNOWN_LOCATION;
}

function firstDifferent(reference: string, ...values: Array<string | null | undefined>): string {
  const normalizedReference = reference.toLowerCase();

  for (const value of values) {
    const cleaned = cleanPart(value);

    if (cleaned && cleaned.toLowerCase() !== normalizedReference) {
      return cleaned;
    }
  }

  return UNKNOWN_LOCATION;
}

/** Reject full street / shop addresses that must never land in the Village stamp field. */
function looksLikeStreetAddress(value: string | null | undefined): boolean {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return false;
  }

  if (/,/.test(trimmed) && trimmed.split(',').length >= 2 && /\d/.test(trimmed)) {
    return true;
  }

  if (/^(shop|plot|flat|floor|near|opp\.?|opposite|road|rd\.?|street|st\.?)\b/i.test(trimmed)) {
    return true;
  }

  if (/\b(first|second|third|ground)\s+floor\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

function resolveDistrict(place: Location.LocationGeocodedAddress): string {
  const candidates = [
    cleanPart(place.subregion),
    cleanPart(place.city),
    cleanPart(place.district),
  ].filter((value): value is string => Boolean(value));

  const knownDistrict = candidates.find((value) =>
    GUJARAT_DISTRICTS.some((district) => district.toLowerCase() === value.toLowerCase()),
  );

  return knownDistrict ?? candidates[0] ?? UNKNOWN_LOCATION;
}

function normalizeAddressName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findBestAddressMatch(candidate: string, options: AddressOption[]): AddressOption | null {
  if (!candidate || candidate === UNKNOWN_LOCATION) {
    return null;
  }

  const normalizedCandidate = normalizeAddressName(candidate);
  const exact = options.find((option) => normalizeAddressName(option.name) === normalizedCandidate);

  if (exact) {
    return exact;
  }

  const partial = options.find((option) => {
    const normalizedOption = normalizeAddressName(option.name);

    return (
      normalizedOption.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedOption)
    );
  });

  return partial ?? null;
}

async function validateAgainstAddressMaster(raw: ResolvedCaptureLocation): Promise<ValidatedCaptureLocation> {
  const fallbackVillage =
    raw.village && raw.village !== UNKNOWN_LOCATION && raw.village !== '-'
      ? raw.village
      : UNKNOWN_LOCATION;
  const fallbackTaluka =
    raw.taluka && raw.taluka !== UNKNOWN_LOCATION && raw.taluka !== '-'
      ? raw.taluka
      : UNKNOWN_LOCATION;
  const fallbackDistrict =
    raw.district && raw.district !== UNKNOWN_LOCATION && raw.district !== '-'
      ? raw.district
      : UNKNOWN_LOCATION;

  const empty: ValidatedCaptureLocation = {
    village: fallbackVillage,
    taluka: fallbackTaluka,
    district: fallbackDistrict,
    state: raw.state || 'Gujarat',
    resolved: false,
  };

  try {
    const districts = await getDistricts('Gujarat');
    const matchedDistrict = findBestAddressMatch(raw.district, districts);

    if (!matchedDistrict) {
      return empty;
    }

    const talukas = await getTalukas(matchedDistrict.id);
    const matchedTaluka = findBestAddressMatch(raw.taluka, talukas);

    if (!matchedTaluka) {
      return {
        ...empty,
        district: matchedDistrict.name,
        state: 'Gujarat',
        districtId: matchedDistrict.id,
      };
    }

    const villageLookup = await getVillages(
      matchedTaluka.id,
      raw.village !== UNKNOWN_LOCATION && raw.village !== '-' ? raw.village : undefined,
    );
    const matchedVillage = findBestAddressMatch(raw.village, villageLookup.villages);

    return {
      // Keep reverse-geocode / Unknown village when master data has no match — never blank.
      village: matchedVillage?.name ?? fallbackVillage,
      taluka: matchedTaluka.name,
      district: matchedDistrict.name,
      state: 'Gujarat',
      resolved: Boolean(matchedVillage),
      villageId: matchedVillage?.id ?? null,
      talukaId: matchedTaluka.id,
      districtId: matchedDistrict.id,
    };
  } catch {
    return empty;
  }
}

export async function resolveValidatedCaptureLocation(
  latitude: number,
  longitude: number,
): Promise<ValidatedCaptureLocation> {
  const raw = await resolveCaptureLocation(latitude, longitude);

  return validateAgainstAddressMaster(raw);
}

/** Normalize a geocode part for stamps/UI — never blank when GPS exists. */
export function normalizeCaptureLocationPart(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();

  if (!trimmed || trimmed === '-' || trimmed === '—') {
    return UNKNOWN_LOCATION;
  }

  return trimmed;
}

export async function resolveCaptureLocation(
  latitude: number,
  longitude: number,
): Promise<ResolvedCaptureLocation> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];

    if (!place) {
      return { village: UNKNOWN_LOCATION, taluka: UNKNOWN_LOCATION, district: UNKNOWN_LOCATION, state: 'Gujarat' };
    }

    // Phase 12.6 — map reverse-geocode fields correctly:
    // village/hamlet/locality → Village (never street / full formatted address)
    // city_district/subdistrict/county → Taluka
    // district → District
    // state/region → State
    const placeAny = place as Record<string, string | null | undefined>;
    const district = resolveDistrict(place);
    const taluka = firstClean(
      placeAny.subregion,
      placeAny.city,
      placeAny.county,
      placeAny.district,
      district,
    );
    const village = firstDifferent(
      taluka,
      placeAny.district, // expo often puts village/locality in `district`
      placeAny.name && !looksLikeStreetAddress(placeAny.name) ? placeAny.name : null,
      placeAny.city && placeAny.city.toLowerCase() !== taluka.toLowerCase() ? placeAny.city : null,
      placeAny.subregion && placeAny.subregion.toLowerCase() !== taluka.toLowerCase()
        ? placeAny.subregion
        : null,
    );

    // Never assign a street/POI-style string to Village.
    const safeVillage =
      looksLikeStreetAddress(village) || village === UNKNOWN_LOCATION
        ? 'Village unavailable'
        : village;

    return {
      village: safeVillage,
      taluka: taluka === UNKNOWN_LOCATION ? UNKNOWN_LOCATION : taluka,
      district,
      state: cleanPart(place.region) ?? 'Gujarat',
    };
  } catch {
    return { village: UNKNOWN_LOCATION, taluka: UNKNOWN_LOCATION, district: UNKNOWN_LOCATION, state: 'Gujarat' };
  }
}
