import type { ApiRecord } from './apiHelpers';

export type VisitChecklistTargetType = 'farmer' | 'company';

export type VisitChecklistValues = {
  farm_location_verified: boolean | null;
  farm_area_verified: boolean | null;
  weekly_activity_evidence_checked: boolean | null;
  farmer_confirmation: boolean | null;
  site_location_verified: boolean | null;
  site_activity_verified: boolean | null;
  waste_processing_verified: boolean | null;
  industrial_data_checked: boolean | null;
  biochar_batch_verified: boolean | null;
  correction_required: boolean;
  correction_notes: string;
  officer_notes: string;
};

export const DEFAULT_VISIT_CHECKLIST_VALUES: VisitChecklistValues = {
  farm_location_verified: null,
  farm_area_verified: null,
  weekly_activity_evidence_checked: null,
  farmer_confirmation: null,
  site_location_verified: null,
  site_activity_verified: null,
  waste_processing_verified: null,
  industrial_data_checked: null,
  biochar_batch_verified: null,
  correction_required: false,
  correction_notes: '',
  officer_notes: '',
};

function readBool(value: unknown): boolean | null {
  if (value === true || value === false) {
    return value;
  }

  return null;
}

export function resolveVisitChecklistTarget(assignment: ApiRecord): VisitChecklistTargetType {
  const farmer = assignment.farmer;

  if (farmer && typeof farmer === 'object') {
    return 'farmer';
  }

  return 'company';
}

export function resolveVisitServiceCode(assignment: ApiRecord): string | null {
  const service = assignment.service;

  if (!service || typeof service !== 'object') {
    return null;
  }

  const code = (service as ApiRecord).code;

  return typeof code === 'string' ? code : null;
}

export function parseVisitChecklistRecord(checklist: ApiRecord): VisitChecklistValues {
  const checklistData =
    checklist.checklist_data && typeof checklist.checklist_data === 'object'
      ? (checklist.checklist_data as ApiRecord)
      : {};

  return {
    farm_location_verified: readBool(checklistData.farm_location_verified),
    farm_area_verified: readBool(checklistData.farm_area_verified),
    weekly_activity_evidence_checked: readBool(checklistData.weekly_activity_evidence_checked),
    farmer_confirmation: readBool(checklist.farmer_confirmation),
    site_location_verified: readBool(checklistData.site_location_verified),
    site_activity_verified: readBool(checklistData.site_activity_verified),
    waste_processing_verified: readBool(checklistData.waste_processing_verified),
    industrial_data_checked: readBool(checklistData.industrial_data_checked),
    biochar_batch_verified: readBool(checklistData.biochar_batch_verified),
    correction_required: checklist.correction_required === true,
    correction_notes: typeof checklist.correction_notes === 'string' ? checklist.correction_notes : '',
    officer_notes: typeof checklist.officer_notes === 'string' ? checklist.officer_notes : '',
  };
}

export function buildVisitChecklistPayload(
  values: VisitChecklistValues,
  targetType: VisitChecklistTargetType,
  serviceCode: string | null,
  submit: boolean,
): ApiRecord {
  const payload: ApiRecord = {
    farm_location_verified: values.farm_location_verified,
    farm_area_verified: values.farm_area_verified,
    weekly_activity_evidence_checked: values.weekly_activity_evidence_checked,
    farmer_confirmation: values.farmer_confirmation,
    site_location_verified: values.site_location_verified,
    site_activity_verified: values.site_activity_verified,
    waste_processing_verified: values.waste_processing_verified,
    industrial_data_checked: values.industrial_data_checked,
    biochar_batch_verified: values.biochar_batch_verified,
    correction_required: values.correction_required,
    correction_notes: values.correction_notes || null,
    officer_notes: values.officer_notes || null,
    submit,
  };

  if (targetType === 'farmer') {
    payload.site_location_verified = null;
    payload.site_activity_verified = null;
    payload.waste_processing_verified = null;
    payload.industrial_data_checked = null;
    payload.biochar_batch_verified = null;
  } else {
    payload.farm_location_verified = null;
    payload.farm_area_verified = null;
    payload.weekly_activity_evidence_checked = null;
    payload.farmer_confirmation = null;

    if (serviceCode === 'WASTE_MGMT') {
      payload.waste_processing_verified = values.waste_processing_verified;
      payload.industrial_data_checked = null;
      payload.biochar_batch_verified = null;
    } else if (serviceCode === 'IND_CARBON') {
      payload.industrial_data_checked = values.industrial_data_checked;
      payload.waste_processing_verified = null;
      payload.biochar_batch_verified = null;
    } else if (serviceCode === 'BIOCHAR') {
      payload.biochar_batch_verified = values.biochar_batch_verified;
      payload.waste_processing_verified = null;
      payload.industrial_data_checked = null;
    }
  }

  return payload;
}

export function isVisitChecklistCompleted(assignment: ApiRecord): boolean {
  const checklist = assignment.verification_checklist ?? assignment.checklist;

  if (!checklist || typeof checklist !== 'object') {
    return false;
  }

  return Boolean((checklist as ApiRecord).completed_at);
}

export function countVisitEvidenceUploads(assignment: ApiRecord): number {
  const evidence = assignment.evidence_uploads ?? assignment.evidenceUploads;

  return Array.isArray(evidence) ? evidence.length : 0;
}
