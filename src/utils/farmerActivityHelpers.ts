import { FARMER_ACTIVITY_TYPES } from '../constants/farmerActivityTypes';
import { formatActivityDisplayDate } from './activityDateHelpers';
import { extractList, pickNestedString, pickString, type ApiRecord } from './apiHelpers';

export type ActivityDisplayStatus = 'approved' | 'under_review' | 'correction_required' | 'draft';

export type ActivityFilterChip =
  | 'all'
  | 'approved'
  | 'under_review'
  | 'correction_required'
  | 'draft'
  | 'most_recent';

export interface FarmerActivityViewModel {
  id: number;
  farmId: number;
  title: string;
  emoji: string;
  farmName: string;
  dateLabel: string;
  sortKey: number;
  status: ActivityDisplayStatus;
  statusLabel: string;
  evidencePhotoCount: number;
  evidenceLabel: string;
  fieldOfficerName: string | null;
  remark: string | null;
  hasGps: boolean;
}

export interface FarmerActivitiesSummary {
  submitted: number;
  approved: number;
  underReview: number;
  correctionRequired: number;
  verified: number;
  pending: number;
  photosUploaded: number;
  documentsUploaded: number;
  gpsCapturedPercent: number;
  lastVerificationLabel: string | null;
  fieldOfficerName: string | null;
  verificationStatusLabel: string;
}

const ACTIVITY_EMOJI: Record<string, string> = {
  crop_sowing: '🌱',
  irrigation: '💧',
  biochar_application: '♻️',
  fertilizer_use: '🌿',
  composting: '🍂',
  harvesting: '🌾',
  cover_crop: '🌿',
  residue_management: '🔄',
  soil_testing: '🧪',
  other: '📋',
};

const STATUS_LABELS: Record<ActivityDisplayStatus, string> = {
  approved: 'Approved',
  under_review: 'Under Review',
  correction_required: 'Correction Required',
  draft: 'Draft',
};

export const ACTIVITY_FILTER_CHIPS: { id: ActivityFilterChip; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'correction_required', label: 'Correction Required' },
  { id: 'draft', label: 'Draft' },
  { id: 'most_recent', label: 'Most Recent' },
];

function parseNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function activityTypeLabel(type: string): string {
  const match = FARMER_ACTIVITY_TYPES.find((item) => item.value === type);

  if (match) {
    return match.label;
  }

  return type
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function mapActivityDisplayStatus(rawStatus: string): ActivityDisplayStatus {
  const status = rawStatus.trim().toLowerCase();

  if (['approved', 'verified', 'completed'].includes(status)) {
    return 'approved';
  }

  if (['correction_required', 'correction', 'rejected', 'needs_correction', 'returned'].includes(status)) {
    return 'correction_required';
  }

  if (['draft', 'saved'].includes(status)) {
    return 'draft';
  }

  return 'under_review';
}

function toSortKey(value: string): number {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function formatVerificationDate(value: unknown): string | null {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return null;
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildEvidenceLabel(count: number): string {
  if (count <= 0) {
    return 'No photos uploaded yet';
  }

  if (count === 1) {
    return '1 Photo Uploaded';
  }

  return `${count} Photos Uploaded`;
}

export function mapActivityRecord(record: ApiRecord, farmNameById: Map<number, string>): FarmerActivityViewModel | null {
  const id = parseNumber(record.id);

  if (id <= 0) {
    return null;
  }

  const farmId = parseNumber(record.farm_id);
  const activityType = pickString(record, 'activity_type');
  const title = pickString(record, 'activity_type_label') !== '-' ? pickString(record, 'activity_type_label') : activityTypeLabel(activityType);
  const activityDate = pickString(record, 'activity_date', 'created_at');
  const farmName = farmNameById.get(farmId) ?? pickNestedString(record, 'farm.farm_name');

  if (!farmName || farmName === '-') {
    return null;
  }

  const status = mapActivityDisplayStatus(pickString(record, 'status'));
  const evidencePath = pickString(record, 'evidence_photo_path');
  const evidenceCount = evidencePath !== '-' ? 1 : 0;
  const latitude = pickString(record, 'gps_latitude');
  const longitude = pickString(record, 'gps_longitude');
  const remark = pickString(record, 'description', 'remarks');

  return {
    id,
    farmId,
    title,
    emoji: ACTIVITY_EMOJI[activityType] ?? '📋',
    farmName,
    dateLabel: activityDate !== '-' ? formatActivityDisplayDate(activityDate.slice(0, 10)) : 'Date not available',
    sortKey: toSortKey(activityDate),
    status,
    statusLabel: STATUS_LABELS[status],
    evidencePhotoCount: evidenceCount,
    evidenceLabel: buildEvidenceLabel(evidenceCount),
    fieldOfficerName: null,
    remark: status === 'correction_required' && remark !== '-' ? remark : null,
    hasGps: latitude !== '-' && longitude !== '-',
  };
}

export function buildFarmNameMap(farms: ApiRecord[]): Map<number, string> {
  const map = new Map<number, string>();

  farms.forEach((farm) => {
    const id = parseNumber(farm.id);
    const name = pickString(farm, 'farm_name', 'name');

    if (id > 0 && name !== '-') {
      map.set(id, name);
    }
  });

  return map;
}

export function buildActivitiesSummary(
  activities: FarmerActivityViewModel[],
  verificationAssignments: ApiRecord[],
): FarmerActivitiesSummary {
  const submitted = activities.length;
  const approved = activities.filter((item) => item.status === 'approved').length;
  const underReview = activities.filter((item) => item.status === 'under_review').length;
  const correctionRequired = activities.filter((item) => item.status === 'correction_required').length;
  const pending = underReview + correctionRequired;
  const photosUploaded = activities.reduce((total, item) => total + item.evidencePhotoCount, 0);
  const gpsCapturedCount = activities.filter((item) => item.hasGps).length;
  const gpsCapturedPercent = submitted > 0 ? Math.round((gpsCapturedCount / submitted) * 100) : 0;

  const latestAssignment = verificationAssignments
    .map((assignment) => ({
      sortKey: toSortKey(pickString(assignment, 'updated_at', 'created_at')),
      officerName: pickNestedString(assignment, 'field_officer.name'),
      status: pickString(assignment, 'assignment_status'),
      completedAt: pickNestedString(assignment, 'checklist.completed_at'),
    }))
    .sort((left, right) => right.sortKey - left.sortKey)[0];

  const officerName = latestAssignment?.officerName !== '-' ? latestAssignment?.officerName ?? null : null;
  const lastVerification =
    latestAssignment?.completedAt && latestAssignment.completedAt !== '-'
      ? formatVerificationDate(latestAssignment.completedAt)
      : null;

  const verificationStatusLabel =
    latestAssignment?.status && latestAssignment.status !== '-'
      ? latestAssignment.status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
      : approved > 0
        ? 'Verified'
        : 'Pending Review';

  return {
    submitted,
    approved,
    underReview,
    correctionRequired,
    verified: approved,
    pending,
    photosUploaded,
    documentsUploaded: 0,
    gpsCapturedPercent,
    lastVerificationLabel: lastVerification,
    fieldOfficerName: officerName,
    verificationStatusLabel,
  };
}

export function filterActivities(
  activities: FarmerActivityViewModel[],
  filter: ActivityFilterChip,
  searchQuery: string,
): FarmerActivityViewModel[] {
  const query = searchQuery.trim().toLowerCase();

  let filtered = activities.filter((activity) => {
    if (query.length === 0) {
      return true;
    }

    return (
      activity.title.toLowerCase().includes(query) ||
      activity.farmName.toLowerCase().includes(query) ||
      activity.statusLabel.toLowerCase().includes(query)
    );
  });

  if (filter === 'approved' || filter === 'under_review' || filter === 'correction_required' || filter === 'draft') {
    filtered = filtered.filter((activity) => activity.status === filter);
  }

  return [...filtered].sort((left, right) => right.sortKey - left.sortKey);
}

export function extractActivityLogs(data: ApiRecord): ApiRecord[] {
  return extractList(data, ['activity_logs', 'logs']);
}

export function extractVerificationAssignments(data: ApiRecord): ApiRecord[] {
  return extractList(data, ['assignments']);
}
