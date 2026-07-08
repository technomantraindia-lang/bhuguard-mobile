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

const UNKNOWN_LOCATION = '-';

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
  const empty: ValidatedCaptureLocation = {
    village: '',
    taluka: '',
    district: '',
    state: 'Gujarat',
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

    const villages = await getVillages(
      matchedTaluka.id,
      raw.village !== UNKNOWN_LOCATION ? raw.village : undefined,
    );
    const matchedVillage = findBestAddressMatch(raw.village, villages);

    return {
      village: matchedVillage?.name ?? '',
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

    const district = resolveDistrict(place);
    const taluka = firstClean(place.city, place.subregion, district);
    const village = firstDifferent(
      taluka,
      place.name,
      place.district,
      place.street,
      place.city,
      place.subregion,
    );

    return {
      village,
      taluka,
      district,
      state: cleanPart(place.region) ?? 'Gujarat',
    };
  } catch {
    return { village: UNKNOWN_LOCATION, taluka: UNKNOWN_LOCATION, district: UNKNOWN_LOCATION, state: 'Gujarat' };
  }
}
