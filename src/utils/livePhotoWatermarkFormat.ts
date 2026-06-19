import type { UserType } from '../types/auth';

export interface LivePhotoWatermarkMeta {
  capturedAtLabel: string;
  coordinatesLabel: string;
  villageLabel: string;
  divisionLabel: string;
  stateLabel: string;
  userLabel: string;
}

export function formatWatermarkTimestamp(iso: string): string {
  const date = new Date(iso);

  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return `${day} ${month} ${year} ${time}`;
}

export function formatWatermarkCoordinates(latitude: number, longitude: number): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';

  return `${Math.abs(latitude).toFixed(4)}${latDirection} ${Math.abs(longitude).toFixed(4)}${lonDirection}`;
}

export function formatWatermarkUserLabel(userType: UserType | null, name: string | null | undefined): string {
  const roleLabel =
    userType === 'field_officer' ? 'Field Officer' : userType === 'farmer' ? 'Farmer' : 'User';

  return `${roleLabel}: ${name?.trim() || 'Bhuguard User'}`;
}

export function buildLivePhotoWatermarkMeta(input: {
  capturedAt: string;
  latitude: number | null;
  longitude: number | null;
  village: string;
  division: string;
  state: string;
  userType: UserType | null;
  userName: string | null | undefined;
}): LivePhotoWatermarkMeta {
  return {
    capturedAtLabel: formatWatermarkTimestamp(input.capturedAt),
    coordinatesLabel:
      input.latitude != null && input.longitude != null
        ? formatWatermarkCoordinates(input.latitude, input.longitude)
        : 'GPS unavailable',
    villageLabel: input.village,
    divisionLabel: input.division,
    stateLabel: input.state,
    userLabel: formatWatermarkUserLabel(input.userType, input.userName),
  };
}

export function getLivePhotoWatermarkLines(meta: LivePhotoWatermarkMeta): string[] {
  return [
    meta.capturedAtLabel,
    meta.coordinatesLabel,
    meta.villageLabel,
    meta.divisionLabel,
    meta.stateLabel,
    meta.userLabel,
  ];
}
