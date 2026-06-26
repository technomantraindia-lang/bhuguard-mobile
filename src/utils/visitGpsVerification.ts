import {
  calculateDistanceInMeters,
  DEFAULT_ALLOWED_RADIUS_METERS,
  formatDistance,
  isValidCoordinates,
} from './locationUtils';
import type { OfficerGpsCaptureResult } from './officerGpsCapture';
import { pickNestedString, pickString, type ApiRecord } from './apiHelpers';

export type VisitLocationStatus =
  | 'pending'
  | 'verified'
  | 'outside_radius'
  | 'override_requested'
  | 'rejected';

export interface VisitGpsContext {
  assignmentId: number;
  visitId: string;
  farmerName: string;
  farmName: string;
  address: string;
  village: string;
  taluka: string;
  district: string;
  projectName: string;
  farmLatitude: number;
  farmLongitude: number;
  allowedRadiusMeter: number;
  boundaryPolygon: Array<{ latitude: number; longitude: number }>;
  hasTargetCoordinates: boolean;
  needsFarmCoordinates: boolean;
  assignmentStatus: string;
  checkinStatus: string;
}

export interface VisitLocationVerification {
  distanceFromFarmMeter: number | null;
  insideVisitArea: boolean;
  locationStatus: VisitLocationStatus;
}

export function extractVisitTargetCoordinates(
  record: ApiRecord,
): { latitude: number; longitude: number } | null {
  const farm = record.farm as ApiRecord | undefined;
  const site = record.site as ApiRecord | undefined;

  const candidates: Array<[unknown, unknown]> = [
    [record.farm_latitude, record.farm_longitude],
    [record.registered_boundary_center_latitude, record.registered_boundary_center_longitude],
    [record.target_latitude, record.target_longitude],
    [record.latitude, record.longitude],
    [farm?.latitude, farm?.longitude],
    [site?.latitude, site?.longitude],
  ];

  for (const [latRaw, lngRaw] of candidates) {
    const latitude = Number(latRaw);
    const longitude = Number(lngRaw);

    if (isValidCoordinates(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

export function extractAllowedRadius(record: ApiRecord): number {
  const settings = record.settings as ApiRecord | undefined;
  const raw =
    record.allowed_radius_meter ??
    record.allowed_radius ??
    record.checkin_radius ??
    settings?.default_radius;

  const radius = Number(raw);

  if (Number.isFinite(radius) && radius > 0) {
    return radius;
  }

  return DEFAULT_ALLOWED_RADIUS_METERS;
}

function buildAddress(record: ApiRecord): string {
  const parts = [
    pickString(record, 'village'),
    pickString(record, 'taluka'),
    pickString(record, 'district'),
  ].filter((part) => part !== '-');

  if (parts.length > 0) {
    return parts.join(', ');
  }

  const nested = [
    pickNestedString(record, 'farm.village'),
    pickNestedString(record, 'farm.taluka'),
    pickNestedString(record, 'farm.district'),
    pickNestedString(record, 'site.address'),
    pickNestedString(record, 'site.city'),
  ].filter((part) => part !== '-');

  return nested.join(', ') || 'Gujarat';
}

function resolveCheckinStatus(record: ApiRecord, assignmentStatus: string): string {
  const latest = (record.latest_gps_checkin ?? record.latestGpsCheckin ?? record.last_checkin) as
    | ApiRecord
    | undefined;

  if (latest && typeof latest === 'object') {
    const locationStatus = String(latest.location_status ?? latest.checkin_status ?? '').toLowerCase();

    if (locationStatus === 'verified') {
      return 'checked_in';
    }

    if (locationStatus === 'override_requested') {
      return 'outside_radius_pending';
    }

    if (locationStatus) {
      return locationStatus;
    }
  }

  if (assignmentStatus === 'checked_in' || assignmentStatus === 'verification_in_progress') {
    return 'checked_in';
  }

  return assignmentStatus;
}

export function mapVisitGpsContext(data: ApiRecord, assignmentId: number): VisitGpsContext {
  const record = (data.data ?? data.assignment ?? data) as ApiRecord;
  const coords = extractVisitTargetCoordinates(record);
  const assignmentStatus = String(record.assignment_status ?? record.status ?? '').toLowerCase();
  const needsFarmCoordinates = Boolean(record.needs_farm_coordinates);

  const polygonRaw = record.boundary_polygon;
  const boundaryPolygon = Array.isArray(polygonRaw)
    ? polygonRaw
        .map((point) => {
          if (!point || typeof point !== 'object') {
            return null;
          }

          const p = point as ApiRecord;
          const latitude = Number(p.latitude ?? p.lat);
          const longitude = Number(p.longitude ?? p.lng);

          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return null;
          }

          return { latitude, longitude };
        })
        .filter((point): point is { latitude: number; longitude: number } => point != null)
    : [];

  return {
    assignmentId: Number(record.assignment_id ?? record.id ?? assignmentId),
    visitId:
      pickString(record, 'visit_id', 'assignment_code') !== '-'
        ? pickString(record, 'visit_id', 'assignment_code')
        : `VIS-${String(assignmentId).padStart(6, '0')}`,
    farmerName: pickString(record, 'farmer_name') !== '-' ? pickString(record, 'farmer_name') : 'Farmer',
    farmName: pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : 'Farm',
    address: buildAddress(record),
    village: pickString(record, 'village') !== '-' ? pickString(record, 'village') : '—',
    taluka: pickString(record, 'taluka') !== '-' ? pickString(record, 'taluka') : '—',
    district: pickString(record, 'district') !== '-' ? pickString(record, 'district') : '—',
    projectName:
      pickString(record, 'project_name') !== '-'
        ? pickString(record, 'project_name')
        : pickNestedString(record, 'service.name') !== '-'
          ? pickNestedString(record, 'service.name')
          : 'Biochar',
    farmLatitude: coords?.latitude ?? 0,
    farmLongitude: coords?.longitude ?? 0,
    allowedRadiusMeter: extractAllowedRadius(record),
    boundaryPolygon,
    hasTargetCoordinates: coords != null,
    needsFarmCoordinates,
    assignmentStatus,
    checkinStatus: resolveCheckinStatus(record, assignmentStatus),
  };
}

export function verifyVisitLocation(
  capture: OfficerGpsCaptureResult,
  context: VisitGpsContext,
  overrideRequested = false,
): VisitLocationVerification {
  if (!context.hasTargetCoordinates) {
    return {
      distanceFromFarmMeter: null,
      insideVisitArea: false,
      locationStatus: 'pending',
    };
  }

  const distanceFromFarmMeter = calculateDistanceInMeters(
    capture.latitude,
    capture.longitude,
    context.farmLatitude,
    context.farmLongitude,
  );

  const insideVisitArea =
    distanceFromFarmMeter != null && distanceFromFarmMeter <= context.allowedRadiusMeter;

  let locationStatus: VisitLocationStatus = 'pending';

  if (overrideRequested) {
    locationStatus = 'override_requested';
  } else if (insideVisitArea) {
    locationStatus = 'verified';
  } else if (distanceFromFarmMeter != null) {
    locationStatus = 'outside_radius';
  }

  return {
    distanceFromFarmMeter,
    insideVisitArea,
    locationStatus,
  };
}

export function formatDistanceMeters(value: number | null | undefined): string {
  return formatDistance(value);
}

export function locationStatusLabel(status: VisitLocationStatus): string {
  switch (status) {
    case 'verified':
      return 'Inside Farm Radius';
    case 'outside_radius':
      return 'Outside Farm Radius';
    case 'override_requested':
      return 'Outside Radius Pending';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Pending';
  }
}
