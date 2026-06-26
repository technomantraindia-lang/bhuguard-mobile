import * as Location from 'expo-location';

export interface ResolvedCaptureLocation {
  village: string;
  taluka: string;
  district: string;
  state: string;
}

export async function resolveCaptureLocation(
  latitude: number,
  longitude: number,
): Promise<ResolvedCaptureLocation> {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = results[0];

    if (!place) {
      return { village: '—', taluka: '—', district: '—', state: 'Gujarat' };
    }

    const village =
      place.name?.trim() ||
      place.city?.trim() ||
      place.district?.trim() ||
      place.subregion?.trim() ||
      '—';

    const taluka = place.subregion?.trim() || place.city?.trim() || '—';
    const district = place.district?.trim() || place.region?.trim() || '—';

    return {
      village,
      taluka,
      district,
      state: place.region?.trim() || 'Gujarat',
    };
  } catch {
    return { village: '—', taluka: '—', district: '—', state: 'Gujarat' };
  }
}
