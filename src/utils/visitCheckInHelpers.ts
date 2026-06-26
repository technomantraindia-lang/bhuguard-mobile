import type { ApiRecord } from './apiHelpers';
import { pickNestedString, pickString } from './apiHelpers';
import { DEFAULT_ALLOWED_RADIUS_METERS } from './locationUtils';
import { extractAllowedRadius, extractVisitTargetCoordinates } from './visitGpsVerification';

export interface VisitCheckInRouteContext {
  visitId: string;
  farmerOrCompanyName: string;
  farmOrSiteName: string;
  address: string;
  targetLatitude: number | null;
  targetLongitude: number | null;
  allowedRadius: number;
  assignmentStatus: string;
  checkinStatus: string;
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

  const farm = record.farm as ApiRecord | undefined;
  const site = record.site as ApiRecord | undefined;

  const nestedParts = [
    pickNestedString(record, 'farm.village'),
    pickNestedString(record, 'farm.taluka'),
    pickNestedString(record, 'farm.district'),
    pickNestedString(record, 'site.village'),
    pickNestedString(record, 'site.city'),
    pickNestedString(record, 'site.district'),
    farm ? pickString(farm, 'village', 'address') : '-',
    site ? pickString(site, 'address', 'city') : '-',
  ].filter((part) => part !== '-');

  return nestedParts.join(', ') || 'Gujarat';
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

export function buildVisitCheckInRouteContext(
  assignment: ApiRecord,
  assignmentId: number | string,
): VisitCheckInRouteContext {
  const record = (assignment.assignment ?? assignment.data ?? assignment) as ApiRecord;
  const coords = extractVisitTargetCoordinates(record);
  const assignmentStatus = String(record.assignment_status ?? record.status ?? '').toLowerCase();
  const visitId =
    pickString(record, 'visit_id', 'assignment_code') !== '-'
      ? pickString(record, 'visit_id', 'assignment_code')
      : `VIS-${String(assignmentId).padStart(6, '0')}`;

  const farmerName = pickString(record, 'farmer_name') !== '-' ? pickString(record, 'farmer_name') : '';
  const companyName =
    pickNestedString(record, 'company.name') !== '-'
      ? pickNestedString(record, 'company.name')
      : pickString(record, 'company_name');
  const farmName = pickString(record, 'farm_name') !== '-' ? pickString(record, 'farm_name') : '';
  const siteName =
    pickNestedString(record, 'site.name') !== '-'
      ? pickNestedString(record, 'site.name')
      : pickString(record, 'site_name');

  return {
    visitId,
    farmerOrCompanyName: farmerName || (companyName !== '-' ? companyName : 'Farmer / Company'),
    farmOrSiteName:
      farmName ||
      (siteName !== '-' ? siteName : pickNestedString(record, 'farm.farm_name') !== '-' ? pickNestedString(record, 'farm.farm_name') : 'Farm / Site'),
    address: buildAddress(record),
    targetLatitude: coords?.latitude ?? null,
    targetLongitude: coords?.longitude ?? null,
    allowedRadius: extractAllowedRadius(record) || DEFAULT_ALLOWED_RADIUS_METERS,
    assignmentStatus,
    checkinStatus: resolveCheckinStatus(record, assignmentStatus),
  };
}

export function hasCompletedGpsCheckIn(assignment: ApiRecord): boolean {
  const record = (assignment.assignment ?? assignment.data ?? assignment) as ApiRecord;
  const assignmentStatus = String(record.assignment_status ?? record.status ?? '').toLowerCase();

  if (
    ['checked_in', 'verification_in_progress', 'completed', 'submitted_to_admin', 'approved'].includes(
      assignmentStatus,
    )
  ) {
    return true;
  }

  const checkinStatus = resolveCheckinStatus(record, assignmentStatus);

  return checkinStatus === 'checked_in';
}

export function visitCheckInRouteContextToApiRecord(context: VisitCheckInRouteContext): ApiRecord {
  return {
    visit_id: context.visitId,
    farmer_name: context.farmerOrCompanyName,
    farm_name: context.farmOrSiteName,
    village: context.address,
    farm_latitude: context.targetLatitude,
    farm_longitude: context.targetLongitude,
    allowed_radius_meter: context.allowedRadius,
    assignment_status: context.assignmentStatus,
    checkin_status: context.checkinStatus,
  };
}
