import { getFarmerActivityTypeIcon, getFarmerActivityTypeLabel } from '../constants/farmerActivityTypes';

import type { BhuguardIconName } from '../components/shared/BhuguardMaterialIcon';

import { formatActivityDisplayDate, formatActivityTimestamp } from './activityDateHelpers';

import { extractList, pickNestedString, pickString, type ApiRecord } from './apiHelpers';
import { formatFarmerDisplayId } from './displayIds';



export type ActivityDisplayStatus =

  | 'draft'

  | 'submitted'

  | 'under_review'

  | 'approved'

  | 'rejected'

  | 'correction_required';



export type ActivityFilterChip =

  | 'all'

  | 'approved'

  | 'under_review'

  | 'correction_required'

  | 'draft'

  | 'most_recent';



export interface FarmerActivityViewModel {

  id: number;

  activityId: string;

  farmId: number;

  title: string;

  emoji: string;

  iconName: BhuguardIconName;

  farmName: string;

  farmerName: string;

  projectName: string;

  dateLabel: string;

  recordedAtLabel: string | null;

  sortKey: number;

  status: ActivityDisplayStatus;

  statusLabel: string;

  submittedBy: string;

  evidencePhotoCount: number;

  documentsCount: number;

  evidenceLabel: string;

  gpsCaptured: boolean;

  gpsLabel: string;

  fieldOfficerName: string | null;

  reviewDateLabel: string | null;

  remark: string | null;

  quantity: number | null;

  unit: string | null;

  description: string | null;

}



export interface FarmerActivitiesSummary {

  submitted: number;

  approved: number;

  pending: number;

  underReview: number;

  correctionRequired: number;

  verified: number;

  photosUploaded: number;

  documentsUploaded: number;

  gpsCapturedPercent: number;

  lastVerificationLabel: string | null;

  fieldOfficerName: string | null;

  verificationStatusLabel: string;

}



export interface FarmerLocationInfo {

  village: string;

  taluka: string;

  district: string;

  pincode: string;

}



export interface FarmerLandInfo {

  acresLabel: string;

  hectaresLabel: string;

  bighaLabel: string;

}



export interface FarmerDashboardStats {

  totalFarms: number;

  mappedFarms: number;

  activitiesCount: number;

  pendingActivities: number;

  approvedActivities: number;

  lastVerificationDate: string | null;

}



const ACTIVITY_EMOJI: Record<string, string> = {

  crop_sowing: '🌱',

  irrigation: '💧',

  biochar_application: '♻️',

  regenerative_agriculture: '🌱',

  agroforestry: '🌳',

  fertilizer_use: '🌿',

  composting: '🍂',

  harvesting: '🌾',

  cover_crop: '🌿',

  residue_management: '🔄',

  soil_testing: '🧪',

  other: '📋',

};



export const STATUS_LABELS: Record<ActivityDisplayStatus, string> = {

  draft: 'Draft',

  submitted: 'Submitted',

  under_review: 'Under Review',

  approved: 'Approved',

  rejected: 'Rejected',

  correction_required: 'Correction Required',

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
  return getFarmerActivityTypeLabel(type);
}



export function mapActivityDisplayStatus(rawStatus: string): ActivityDisplayStatus {

  const status = rawStatus.trim().toLowerCase();



  if (['approved', 'verified', 'completed'].includes(status)) {

    return 'approved';

  }



  if (['rejected'].includes(status)) {

    return 'rejected';

  }



  if (['correction_required', 'correction', 'needs_correction', 'returned'].includes(status)) {

    return 'correction_required';

  }



  if (['draft', 'saved'].includes(status)) {

    return 'draft';

  }



  if (['submitted'].includes(status)) {

    return 'submitted';

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



function normalizeProjectName(name: string): string {

  const trimmed = name.trim();



  if (!trimmed || trimmed === '-') {

    return 'Regenerative Agriculture';

  }



  if (/biochar/i.test(trimmed)) {

    return 'Biochar';

  }



  if (/agro.?forest/i.test(trimmed)) {

    return 'Agroforestry';

  }



  if (/regenerative/i.test(trimmed)) {

    return 'Regenerative Agriculture';

  }



  return trimmed;

}



export function extractFarmerLocation(profile: ApiRecord): FarmerLocationInfo {

  const farmerProfile = (profile.farmer_profile ?? profile) as ApiRecord;



  return {

    village: pickString(farmerProfile, 'village'),

    taluka: pickString(farmerProfile, 'taluka', 'taluka_name'),

    district: pickString(farmerProfile, 'district', 'district_name'),

    pincode: pickString(farmerProfile, 'pincode'),

  };

}



/** Never fabricates a display ID; prefers server display fields, else legacy farmer_code. */
export function formatFarmerCode(profile: ApiRecord): string {
  return formatFarmerDisplayId(profile);
}



export function mapActivityRecord(record: ApiRecord, farmNameById: Map<number, string>): FarmerActivityViewModel | null {

  const id = parseNumber(record.id);



  if (id <= 0) {

    return null;

  }



  const farmId = parseNumber(record.farm_id);

  const activityType = pickString(record, 'activity_type');

  const title =

    pickString(record, 'activity_name') !== '-'

      ? pickString(record, 'activity_name')

      : pickString(record, 'activity_type_label') !== '-'

        ? pickString(record, 'activity_type_label')

        : activityTypeLabel(activityType);

  const activityDate = pickString(record, 'activity_date', 'created_at');

  const farmName =

    pickString(record, 'farm_name') !== '-'

      ? pickString(record, 'farm_name')

      : (farmNameById.get(farmId) ?? pickNestedString(record, 'farm.farm_name'));



  if (!farmName || farmName === '-') {

    return null;

  }



  const status = mapActivityDisplayStatus(pickString(record, 'status'));

  const photosCount = parseNumber(record.photos_count) || (pickString(record, 'evidence_photo_path') !== '-' ? 1 : 0);

  const documentsCount = parseNumber(record.documents_count);

  const gpsCaptured =

    record.gps_captured === true ||

    (pickString(record, 'gps_latitude') !== '-' && pickString(record, 'gps_longitude') !== '-');

  const officerName = pickString(record, 'officer_name', 'review_officer_name');

  const reviewDate = pickString(record, 'review_date', 'reviewed_at');

  const remarks = pickString(record, 'remarks', 'review_remarks', 'description');

  const quantityRaw = record.quantity;

  const quantity = quantityRaw === null || quantityRaw === undefined || quantityRaw === '' ? null : parseNumber(quantityRaw);

  const unit = pickString(record, 'unit');

  const description = pickString(record, 'description');

  const activityId =

    pickString(record, 'activity_id', 'activity_code') !== '-'

      ? pickString(record, 'activity_id', 'activity_code')

      : `ACT-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;



  const farmerName = pickString(record, 'farmer_name');

  const projectName = normalizeProjectName(pickString(record, 'project'));

  const submittedBy = pickString(record, 'submitted_by') !== '-' ? pickString(record, 'submitted_by') : 'Farmer';



  const showRemarks =

    remarks !== '-' &&

    (status === 'correction_required' || status === 'approved' || status === 'rejected' || Boolean(record.review_remarks));



  return {

    id,

    activityId,

    farmId,

    title,

    emoji: ACTIVITY_EMOJI[activityType] ?? '📋',

    iconName: getFarmerActivityTypeIcon(activityType),

    farmName,

    farmerName: farmerName !== '-' ? farmerName : '',

    projectName,

    dateLabel: activityDate !== '-' ? formatActivityDisplayDate(activityDate.slice(0, 10)) : 'Date not available',

    recordedAtLabel: formatActivityTimestamp(pickString(record, 'created_at', 'submission_date')),

    sortKey: toSortKey(activityDate),

    status,

    statusLabel: STATUS_LABELS[status],

    submittedBy,

    evidencePhotoCount: photosCount,

    documentsCount,

    evidenceLabel: photosCount > 0 ? `${photosCount} Photo${photosCount === 1 ? '' : 's'}` : 'No photos',

    gpsCaptured,

    gpsLabel: gpsCaptured ? 'Captured' : 'Not captured',

    fieldOfficerName: officerName !== '-' ? officerName : null,

    reviewDateLabel: reviewDate !== '-' ? formatVerificationDate(reviewDate) : null,

    remark: showRemarks && remarks !== '-' ? remarks : null,

    quantity,

    unit: unit !== '-' ? unit : null,

    description: description !== '-' ? description : null,

  };

}



export function buildFarmNameMap(farms: ApiRecord[]): Map<number, string> {

  const map = new Map<number, string>();



  farms.forEach((farm) => {

    const farmId = parseNumber(farm.id);

    const name = pickString(farm, 'farm_name', 'name');



    if (farmId > 0 && name !== '-') {

      map.set(farmId, name);

    }

  });



  return map;

}



export function countMappedFarms(farms: ApiRecord[]): number {

  return farms.filter((farm) => farm.boundary_mapped === true || pickString(farm, 'boundary_status') === 'mapped').length;

}



export function buildActivitiesSummary(

  activities: FarmerActivityViewModel[],

  verificationAssignments: ApiRecord[],

): FarmerActivitiesSummary {

  const submitted = activities.length;

  const approved = activities.filter((item) => item.status === 'approved').length;

  const underReview = activities.filter((item) => item.status === 'under_review' || item.status === 'submitted').length;

  const correctionRequired = activities.filter((item) => item.status === 'correction_required').length;

  const pending = underReview + correctionRequired;

  const photosUploaded = activities.reduce((total, item) => total + item.evidencePhotoCount, 0);

  const documentsUploaded = activities.reduce((total, item) => total + item.documentsCount, 0);

  const gpsCapturedCount = activities.filter((item) => item.gpsCaptured).length;

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

    documentsUploaded,

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

      activity.activityId.toLowerCase().includes(query) ||

      activity.farmName.toLowerCase().includes(query) ||

      activity.projectName.toLowerCase().includes(query) ||

      activity.statusLabel.toLowerCase().includes(query)

    );

  });



  if (filter === 'approved' || filter === 'under_review' || filter === 'correction_required' || filter === 'draft') {

    filtered = filtered.filter((activity) => {

      if (filter === 'under_review') {

        return activity.status === 'under_review' || activity.status === 'submitted';

      }



      return activity.status === filter;

    });

  }



  return [...filtered].sort((left, right) => right.sortKey - left.sortKey);

}



export function extractActivityLogs(data: ApiRecord): ApiRecord[] {

  return extractList(data, ['activity_logs', 'logs']);

}



export function extractVerificationAssignments(data: ApiRecord): ApiRecord[] {

  return extractList(data, ['assignments']);

}



export function buildActivityTimelineSteps(status: ActivityDisplayStatus): Array<{ label: string; complete: boolean }> {

  const order: ActivityDisplayStatus[] = ['submitted', 'under_review', 'approved'];

  const currentIndex =

    status === 'approved'

      ? 2

      : status === 'under_review' || status === 'submitted'

        ? 1

        : status === 'correction_required' || status === 'rejected'

          ? 1

          : 0;



  return [

    { label: 'Submitted', complete: currentIndex >= 0 },

    { label: 'Under Review', complete: currentIndex >= 1 },

    { label: status === 'rejected' ? 'Rejected' : 'Verified', complete: status === 'approved' },

    { label: 'Approved', complete: status === 'approved' },

  ];

}


