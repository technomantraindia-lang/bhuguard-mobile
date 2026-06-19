import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORT_DRAFT_PREFIX = 'fo_visit_report_draft_';

export type VisitReportDraft = {
  recommendation: 'verified' | 'correction_requested' | 'rejected';
  summary: string;
  observationNotes: string;
  riskNotes: string;
  supportingNotes: string;
  savedAt: string;
};

function reportDraftKey(assignmentId: number | string): string {
  return `${REPORT_DRAFT_PREFIX}${assignmentId}`;
}

export async function saveVisitReportDraft(
  assignmentId: number | string,
  draft: Omit<VisitReportDraft, 'savedAt'>,
): Promise<void> {
  const payload: VisitReportDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(reportDraftKey(assignmentId), JSON.stringify(payload));
}

export async function loadVisitReportDraft(assignmentId: number | string): Promise<VisitReportDraft | null> {
  const raw = await AsyncStorage.getItem(reportDraftKey(assignmentId));

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as VisitReportDraft;
  } catch {
    return null;
  }
}

export async function clearVisitReportDraft(assignmentId: number | string): Promise<void> {
  await AsyncStorage.removeItem(reportDraftKey(assignmentId));
}
