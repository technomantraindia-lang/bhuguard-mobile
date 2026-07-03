import * as Location from 'expo-location';

export interface ResolvedCaptureLocation {
  village: string;
  taluka: string;
  district: string;
  state: string;
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
