import { useCallback, useEffect, useState } from 'react';

import { getVisitAssignmentDetail } from '../api/fieldOfficerApi';
import type { ApiRecord } from '../utils/apiHelpers';
import {
  resolveVisitVerificationProgress,
  unwrapAssignmentRecord,
  type VisitVerificationProgress,
  type VisitVerificationStepKey,
} from '../utils/visitWorkflowHelpers';

interface UseVisitVerificationProgressResult {
  loading: boolean;
  assignment: ApiRecord | null;
  progress: VisitVerificationProgress;
  reload: () => Promise<void>;
}

const EMPTY_PROGRESS: VisitVerificationProgress = {
  currentStep: 'accept',
  completedSteps: [],
};

export function useVisitVerificationProgress(
  assignmentId: number | string,
  activeStep?: VisitVerificationStepKey,
): UseVisitVerificationProgressResult {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<ApiRecord | null>(null);
  const [progress, setProgress] = useState<VisitVerificationProgress>(EMPTY_PROGRESS);

  const reload = useCallback(async () => {
    setLoading(true);

    try {
      const detail = await getVisitAssignmentDetail(assignmentId);
      const record = unwrapAssignmentRecord(detail as ApiRecord);
      const resolved = resolveVisitVerificationProgress(record);

      setAssignment(record);
      setProgress(
        activeStep
          ? { ...resolved, currentStep: activeStep }
          : resolved,
      );
    } catch {
      setAssignment(null);
      setProgress(activeStep ? { ...EMPTY_PROGRESS, currentStep: activeStep } : EMPTY_PROGRESS);
    } finally {
      setLoading(false);
    }
  }, [activeStep, assignmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, assignment, progress, reload };
}
