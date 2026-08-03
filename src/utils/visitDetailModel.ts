import type { ApiRecord } from './apiHelpers';
import { pickNestedString, pickString } from './apiHelpers';
import { formatFarmerDisplayId } from './displayIds';
import {
  parseVisitChecklistRecord,
  resolveVisitChecklistTarget,
  resolveVisitServiceCode,
  type VisitChecklistValues,
} from './visitChecklistHelpers';

export interface VisitChecklistPreviewItem {
  key: string;
  label: string;
  checked: boolean;
}

export interface VisitDetailModel {
  assignmentCode: string;
  statusBadge: string;
  priorityLabel: string;
  projectName: string;
  scheduledLabel: string;
  visitTypeLabel: string;
  farmerName: string;
  farmerId: string;
  farmerPhone: string;
  farmerLocation: string;
  farmName: string;
  farmId: string;
  farmArea: string;
  cropType: string;
  serviceFocus: string;
  assignmentStatus: string;
  checklistPreview: VisitChecklistPreviewItem[];
  checklistTotalCount: number;
  checklistCompleted: boolean;
  canAcceptVisit: boolean;
  canStartVisit: boolean;
  canCheckIn: boolean;
  canStartVerification: boolean;
  showVerificationActions: boolean;
  evidenceUploadsCount: number;
}

function formatScheduledDate(assignment: ApiRecord): string {
  const raw = pickString(assignment, 'visit_date', 'due_date', 'scheduled_at', 'created_at');

  if (raw === '-') {
    return 'Not scheduled';
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatArea(assignment: ApiRecord): string {
  const acres = pickNestedString(assignment, 'farm.area_acres');
  const hectares = pickNestedString(assignment, 'farm.area_hectares');
  const landArea = pickNestedString(assignment, 'farm.land_area');
  const unit = pickNestedString(assignment, 'farm.land_area_unit');

  if (acres !== '-') {
    return `${acres} Acres`;
  }

  if (hectares !== '-') {
    return `${hectares} ha`;
  }

  if (landArea !== '-') {
    return unit !== '-' ? `${landArea} ${unit}` : landArea;
  }

  return '—';
}

function formatFarmerId(assignment: ApiRecord): string {
  const code =
    pickNestedString(assignment, 'farmer.farmer_code') !== '-'
      ? pickNestedString(assignment, 'farmer.farmer_code')
      : pickNestedString(assignment, 'farmer.code');

  if (code !== '-') {
    return code;
  }

  const id = pickString(assignment, 'farmer_id');

  return id !== '-' ? `BHG-FRM-${String(id).padStart(6, '0')}` : '—';
}

function formatFarmId(assignment: ApiRecord): string {
  const code =
    pickNestedString(assignment, 'farm.farm_code') !== '-'
      ? pickNestedString(assignment, 'farm.farm_code')
      : pickNestedString(assignment, 'farm.code');

  if (code !== '-') {
    return code;
  }

  const id = pickNestedString(assignment, 'farm.id');

  return id !== '-' ? `BHG-FRM-LND-${id.padStart(5, '0')}` : '—';
}

function mapStatusBadge(status: string): string {
  const normalized = status.toLowerCase();

  if (normalized === 'approved' || normalized === 'completed' || normalized === 'submitted_to_admin') {
    return 'Completed';
  }

  if (normalized === 'assigned' || normalized === 'accepted') {
    return 'Scheduled';
  }

  if (normalized === 'rescheduled') {
    return 'Rescheduled';
  }

  return 'Pending';
}

function mapPriorityLabel(assignment: ApiRecord): string {
  const priority = pickString(assignment, 'priority', 'urgency').toLowerCase();

  if (priority === 'high' || priority === 'urgent') {
    return 'High';
  }

  if (priority === 'low') {
    return 'Low';
  }

  return 'Normal';
}

function readChecklistValues(assignment: ApiRecord): VisitChecklistValues | null {
  const checklist = assignment.verification_checklist ?? assignment.checklist;

  if (!checklist || typeof checklist !== 'object') {
    return null;
  }

  return parseVisitChecklistRecord(checklist as ApiRecord);
}

function buildFarmerChecklistItems(values: VisitChecklistValues | null): VisitChecklistPreviewItem[] {
  return [
    {
      key: 'farmer_identity',
      label: 'Farmer identity',
      checked: values?.farmer_confirmation === true,
    },
    {
      key: 'land_ownership',
      label: 'Land ownership validation',
      checked: values?.farm_area_verified === true,
    },
    {
      key: 'boundary_gps',
      label: 'Boundary GPS match',
      checked: values?.farm_location_verified === true,
    },
    {
      key: 'weekly_evidence',
      label: 'Weekly activity evidence',
      checked: values?.weekly_activity_evidence_checked === true,
    },
  ];
}

function buildCompanyChecklistItems(
  values: VisitChecklistValues | null,
  serviceCode: string | null,
): VisitChecklistPreviewItem[] {
  const items: VisitChecklistPreviewItem[] = [
    {
      key: 'site_location',
      label: 'Site location verified',
      checked: values?.site_location_verified === true,
    },
    {
      key: 'site_activity',
      label: 'Site activity verified',
      checked: values?.site_activity_verified === true,
    },
  ];

  if (serviceCode === 'WASTE_MGMT') {
    items.push({
      key: 'waste_processing',
      label: 'Waste processing verified',
      checked: values?.waste_processing_verified === true,
    });
  } else if (serviceCode === 'IND_CARBON') {
    items.push({
      key: 'industrial_data',
      label: 'Industrial data checked',
      checked: values?.industrial_data_checked === true,
    });
  } else if (serviceCode === 'BIOCHAR') {
    items.push({
      key: 'biochar_batch',
      label: 'Biochar batch verified',
      checked: values?.biochar_batch_verified === true,
    });
  }

  return items;
}

export function buildVisitDetailModel(assignment: ApiRecord, assignmentId: number): VisitDetailModel {
  const status = pickString(assignment, 'assignment_status', 'status');
  const assignmentStatus = status.toLowerCase();
  const targetType = resolveVisitChecklistTarget(assignment);
  const serviceCode = resolveVisitServiceCode(assignment);
  const checklistValues = readChecklistValues(assignment);
  const checklistItems =
    targetType === 'farmer'
      ? buildFarmerChecklistItems(checklistValues)
      : buildCompanyChecklistItems(checklistValues, serviceCode);

  const farmerName =
    pickNestedString(assignment, 'farmer.name') !== '-'
      ? pickNestedString(assignment, 'farmer.name')
      : pickNestedString(assignment, 'farmer.user.name');
  const farmName = pickNestedString(assignment, 'farm.farm_name');
  const village =
    pickNestedString(assignment, 'farmer.village') !== '-'
      ? pickNestedString(assignment, 'farmer.village')
      : pickNestedString(assignment, 'farm.village_name') !== '-'
        ? pickNestedString(assignment, 'farm.village_name')
        : pickNestedString(assignment, 'farm.village');
  const district =
    pickNestedString(assignment, 'farmer.district') !== '-'
      ? pickNestedString(assignment, 'farmer.district')
      : pickNestedString(assignment, 'farm.district_name') !== '-'
        ? pickNestedString(assignment, 'farm.district_name')
        : pickNestedString(assignment, 'farm.district');
  const taluka = pickNestedString(assignment, 'farmer.taluka_name');
  const locationParts = [village, taluka !== '-' ? taluka : district].filter((part) => part !== '-');
  const phone =
    pickNestedString(assignment, 'farmer.phone') !== '-'
      ? pickNestedString(assignment, 'farmer.phone')
      : pickNestedString(assignment, 'farmer.mobile') !== '-'
        ? pickNestedString(assignment, 'farmer.mobile')
        : pickNestedString(assignment, 'farmer.user.mobile');
  const project =
    pickNestedString(assignment, 'service.name') !== '-'
      ? pickNestedString(assignment, 'service.name')
      : 'Field Verification';
  const crop =
    pickNestedString(assignment, 'farm.crop_type') !== '-'
      ? pickNestedString(assignment, 'farm.crop_type')
      : pickNestedString(assignment, 'farm.crop_name');
  const evidence = assignment.evidence_uploads ?? assignment.evidenceUploads;
  const evidenceUploadsCount = Array.isArray(evidence) ? evidence.length : 0;
  const checklist = assignment.verification_checklist ?? assignment.checklist;
  const checklistCompleted = Boolean(
    checklist && typeof checklist === 'object' && (checklist as ApiRecord).completed_at,
  );

  const assignmentCode =
    pickString(assignment, 'assignment_code', 'code') !== '-'
      ? pickString(assignment, 'assignment_code', 'code')
      : `BHG-VST-${String(assignmentId).padStart(6, '0')}`;

  return {
    assignmentCode,
    statusBadge: mapStatusBadge(status),
    priorityLabel: mapPriorityLabel(assignment),
    projectName: project !== '-' ? project : 'Field Verification',
    scheduledLabel: formatScheduledDate(assignment),
    visitTypeLabel: targetType === 'farmer' ? 'Field Verification' : 'Site Verification',
    farmerName: farmerName !== '-' ? farmerName : 'Farmer',
    farmerId: formatFarmerId(assignment),
    farmerPhone: phone !== '-' ? phone : '',
    farmerLocation: locationParts.join(', ') || 'Gujarat',
    farmName: farmName !== '-' ? farmName : 'Farm',
    farmId: formatFarmId(assignment),
    farmArea: formatArea(assignment),
    cropType: crop !== '-' ? crop : '—',
    serviceFocus: project !== '-' ? project : 'Field Verification',
    assignmentStatus,
    checklistPreview: checklistItems.slice(0, 3),
    checklistTotalCount: checklistItems.length,
    checklistCompleted,
    canAcceptVisit: assignmentStatus === 'assigned',
    canStartVisit: assignmentStatus === 'accepted',
    canCheckIn: assignmentStatus === 'started',
    canStartVerification: assignmentStatus === 'checked_in',
    showVerificationActions:
      assignmentStatus === 'verification_in_progress' || assignmentStatus === 'checked_in',
    evidenceUploadsCount,
  };
}
