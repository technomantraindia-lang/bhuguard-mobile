import * as Location from 'expo-location';

import {
  acceptVisit,
  checkInVisit,
  completeVisit,
  getVisitAssignmentDetail,
  startVerification,
  startVisit,
} from '../api/fieldOfficerApi';

import type { ApiRecord } from './apiHelpers';
import { countVisitEvidenceUploads } from './visitChecklistHelpers';

export type VisitVerificationStepKey =
  | 'accept'
  | 'check_in'
  | 'verify'
  | 'checklist'
  | 'evidence'
  | 'review';

export interface VisitVerificationStep {
  key: VisitVerificationStepKey;
  label: string;
}

export const VISIT_VERIFICATION_STEPS: VisitVerificationStep[] = [
  { key: 'accept', label: 'Accept' },
  { key: 'check_in', label: 'Check-in' },
  { key: 'verify', label: 'Verify' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'review', label: 'Review' },
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

  return data;
}

export function getAssignmentStatus(assignment: ApiRecord): string {
  return String(assignment.assignment_status ?? assignment.status ?? '').toLowerCase();
}

function statusIndex(status: string): number {
  const index = STATUS_ORDER.indexOf(status);

  return index === -1 ? 0 : index;
}

function isChecklistCompleted(assignment: ApiRecord): boolean {
  const checklist = assignment.verification_checklist ?? assignment.checklist;

  return Boolean(checklist && typeof checklist === 'object' && (checklist as ApiRecord).completed_at);
}

export interface VisitVerificationProgress {
  currentStep: VisitVerificationStepKey;
  completedSteps: VisitVerificationStepKey[];
}

export function resolveVisitVerificationProgress(assignment: ApiRecord): VisitVerificationProgress {
  const status = getAssignmentStatus(assignment);
  const index = statusIndex(status);
  const checklistDone = isChecklistCompleted(assignment);
  const evidenceDone = countVisitEvidenceUploads(assignment) > 0;
  const submitted = status === 'submitted_to_admin' || status === 'approved';

  const completedSteps: VisitVerificationStepKey[] = [];

  if (index > statusIndex('assigned')) {
    completedSteps.push('accept');
  }

  if (index > statusIndex('started')) {
    completedSteps.push('check_in');
  }

  if (index > statusIndex('checked_in')) {
    completedSteps.push('verify');
  }

  if (checklistDone) {
    completedSteps.push('checklist');
  }

  if (evidenceDone) {
    completedSteps.push('evidence');
  }

  if (submitted) {
    completedSteps.push('review');
  }

  let currentStep: VisitVerificationStepKey = 'accept';

  if (index <= statusIndex('assigned')) {
    currentStep = 'accept';
  } else if (index <= statusIndex('accepted')) {
    currentStep = 'accept';
  } else if (index <= statusIndex('started')) {
    currentStep = 'check_in';
  } else if (index <= statusIndex('checked_in')) {
    currentStep = 'verify';
  } else if (!checklistDone) {
    currentStep = 'checklist';
  } else if (!evidenceDone) {
    currentStep = 'evidence';
  } else {
    currentStep = 'review';
  }

  return { currentStep, completedSteps };
}

async function refreshAssignment(assignmentId: number | string): Promise<ApiRecord> {
  const detail = await getVisitAssignmentDetail(assignmentId);

  return unwrapAssignmentRecord(detail as ApiRecord);
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
