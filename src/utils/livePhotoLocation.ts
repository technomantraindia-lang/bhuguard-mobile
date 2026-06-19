import * as Location from 'expo-location';

export interface ResolvedCaptureLocation {
  village: string;
  division: string;
  state: string;
}

function formatDivisionLabel(district: string | null | undefined, subregion: string | null | undefined): string {
  const source = district?.trim() || subregion?.trim();

  if (!source) {
    return '—';
  }

  return /division$/i.test(source) ? source : `${source} Division`;
}

export async function resolveCaptureLocation(
  latitude: number,
  longitude: number,
): Promise<ResolvedCaptureLocation> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];

    if (!place) {
      return { village: '—', division: '—', state: 'Gujarat' };
    }

    const village =
      place.name?.trim() ||
      place.city?.trim() ||
      place.district?.trim() ||
      place.subregion?.trim() ||
      '—';

    return {
      village,
      division: formatDivisionLabel(place.district, place.subregion),
      state: place.region?.trim() || 'Gujarat',
    };
  } catch {
    return { village: '—', division: '—', state: 'Gujarat' };
  }
}
