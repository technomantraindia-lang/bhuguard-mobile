import * as Location from 'expo-location';

import {
  acceptVisit,
  checkInVisit,
  completeVisit,
  getAssignmentChecklist,
  getVisitAssignmentDetail,
  startVerification,
  startVisit,
  submitChecklist,
} from '../api/fieldOfficerApi';

import type { ApiRecord } from './apiHelpers';
import { isApiNotFound } from './apiError';
import { countVisitEvidenceUploads } from './visitChecklistHelpers';
import { buildMrvChecklistPayload, enrichMrvStateFromAssignmentEvidence, parseMrvVerificationState } from './mrvVerificationHelpers';

export type VisitVerificationStepKey =
  | 'start_visit'
  | 'check_in'
  | 'farmer_details'
  | 'mobile_network'
  | 'start_biochar_activity'
  | 'biochar_process'
  | 'evidence'
  | 'review'
  | 'submit'
  | 'accept'
  | 'verify'
  | 'checklist';

export interface VisitVerificationStep {
  key: VisitVerificationStepKey;
  label: string;
}

export const VISIT_VERIFICATION_STEPS: VisitVerificationStep[] = [
  { key: 'start_visit', label: 'Start Visit' },
  { key: 'check_in', label: 'Check-in' },
  { key: 'farmer_details', label: 'Farmer Details' },
  { key: 'mobile_network', label: 'Mobile / Network' },
  { key: 'start_biochar_activity', label: 'Start Biochar Activity' },
  { key: 'biochar_process', label: 'Biochar Process' },
  { key: 'evidence', label: 'Evidence/Submit' },
];

const STATUS_ORDER = [
  'assigned',
  'accepted',
  'started',
  'checked_in',
  'verification_in_progress',
  'completed',
  'submitted_to_admin',
  'approved',
];

export function unwrapAssignmentRecord(data: ApiRecord): ApiRecord {
  if (data.assignment && typeof data.assignment === 'object') {
    return data.assignment as ApiRecord;
  }

  if (data.visit && typeof data.visit === 'object') {
    return data.visit as ApiRecord;
  }

  return data;
}

export function getAssignmentStatus(assignment: ApiRecord): string {
  return String(assignment.assignment_status ?? assignment.status ?? '').toLowerCase();
}

function statusIndex(status: string): number {
  const index = STATUS_ORDER.indexOf(status);

  return index === -1 ? 0 : index;
}

function hasMobileNetworkVerification(assignment: ApiRecord): boolean {
  return assignment.farmer_has_mobile !== undefined && assignment.farmer_has_mobile !== null;
}

export interface VisitVerificationProgress {
  currentStep: VisitVerificationStepKey;
  completedSteps: VisitVerificationStepKey[];
}

export function resolveVisitVerificationProgress(assignment: ApiRecord): VisitVerificationProgress {
  const status = getAssignmentStatus(assignment);
  const index = statusIndex(status);
  const evidenceDone = countVisitEvidenceUploads(assignment) > 0;
  const mobileNetworkDone = hasMobileNetworkVerification(assignment);
  const submitted = ['submitted_to_admin', 'approved'].includes(status);

  const completedSteps: VisitVerificationStepKey[] = [];

  if (index >= statusIndex('accepted')) {
    completedSteps.push('start_visit');
  }

  if (index > statusIndex('started')) {
    completedSteps.push('check_in');
  }

  if (assignment.farmer_id) {
    completedSteps.push('farmer_details');
  }

  if (mobileNetworkDone) {
    completedSteps.push('mobile_network');
    completedSteps.push('start_biochar_activity');
  }

  if (evidenceDone) {
    completedSteps.push('biochar_process');
    completedSteps.push('evidence');
  }

  if (submitted) {
    completedSteps.push('review', 'submit');
  }

  let currentStep: VisitVerificationStepKey = 'start_visit';

  if (index < statusIndex('accepted')) {
    currentStep = 'start_visit';
  } else if (index <= statusIndex('started')) {
    currentStep = 'check_in';
  } else if (!assignment.farmer_id) {
    currentStep = 'farmer_details';
  } else if (!mobileNetworkDone) {
    currentStep = 'mobile_network';
  } else if (!evidenceDone) {
    currentStep = 'start_biochar_activity';
  } else if (!submitted) {
    currentStep = 'evidence';
  } else {
    currentStep = 'submit';
  }

  return { currentStep, completedSteps };
}

async function refreshAssignment(assignmentId: number | string): Promise<ApiRecord> {
  const detail = await getVisitAssignmentDetail(assignmentId);

  return unwrapAssignmentRecord(detail as ApiRecord);
}

export async function ensureVisitReadyForGpsCheckIn(
  assignmentId: number | string,
): Promise<ApiRecord> {
  let assignment = await refreshAssignment(assignmentId);
  let status = getAssignmentStatus(assignment);

  if (['cancelled', 'canceled', 'completed', 'submitted_to_admin', 'approved', 'rejected'].includes(status)) {
    throw new Error(
      status === 'cancelled' || status === 'canceled'
        ? 'This visit is cancelled and cannot be checked in.'
        : 'This visit is already completed and cannot be checked in again.',
    );
  }

  if (['checked_in', 'verification_in_progress', 'started'].includes(status)) {
    return assignment;
  }

  if (status === 'assigned') {
    await acceptVisit(assignmentId);
    assignment = await refreshAssignment(assignmentId);
    status = getAssignmentStatus(assignment);
  }

  if (status === 'accepted') {
    await startVisit(assignmentId);
    assignment = await refreshAssignment(assignmentId);
  }

  return assignment;
}

export async function ensureAssignmentReadyForReportSubmit(
  assignmentId: number | string,
): Promise<ApiRecord> {
  let assignment = await refreshAssignment(assignmentId);
  let status = getAssignmentStatus(assignment);

  if (status === 'assigned') {
    await acceptVisit(assignmentId);
    assignment = await refreshAssignment(assignmentId);
    status = getAssignmentStatus(assignment);
  }

  if (status === 'accepted') {
    await startVisit(assignmentId);
    assignment = await refreshAssignment(assignmentId);
    status = getAssignmentStatus(assignment);
  }

  if (status === 'started') {
    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Location permission is required for GPS check-in before submitting the report.');
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await checkInVisit(assignmentId, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    assignment = await refreshAssignment(assignmentId);
    status = getAssignmentStatus(assignment);
  }

  if (status === 'checked_in') {
    await startVerification(assignmentId);
    assignment = await refreshAssignment(assignmentId);
    status = getAssignmentStatus(assignment);
  }

  if (status === 'verification_in_progress') {
    await completeVisit(assignmentId);
    assignment = await refreshAssignment(assignmentId);
    status = getAssignmentStatus(assignment);
  }

  if (!['verification_in_progress', 'completed', 'submitted_to_admin', 'approved'].includes(status)) {
    throw new Error(
      'This assignment is not ready for report submission yet. Complete the earlier verification steps first.',
    );
  }

  return assignment;
}

export async function ensureChecklistCompletedForReport(
  assignmentId: number | string,
): Promise<void> {
  const assignment = await refreshAssignment(assignmentId);
  const embeddedChecklist = assignment.verification_checklist ?? assignment.checklist;

  if (
    embeddedChecklist &&
    typeof embeddedChecklist === 'object' &&
    (embeddedChecklist as ApiRecord).completed_at
  ) {
    return;
  }

  let checklistRecord: ApiRecord | null =
    embeddedChecklist && typeof embeddedChecklist === 'object'
      ? (embeddedChecklist as ApiRecord)
      : null;

  if (!checklistRecord) {
    try {
      const checklistData = await getAssignmentChecklist(assignmentId);
      const record = (checklistData as ApiRecord).checklist ?? checklistData;
      checklistRecord = record && typeof record === 'object' ? (record as ApiRecord) : null;
    } catch (error) {
      if (!isApiNotFound(error)) {
        throw error;
      }
    }
  }

  const parsed = enrichMrvStateFromAssignmentEvidence(
    parseMrvVerificationState(assignment, checklistRecord),
    assignment,
  );
  await submitChecklist(assignmentId, buildMrvChecklistPayload(parsed, true));
}
