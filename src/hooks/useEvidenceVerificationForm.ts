import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getEvidenceVerification,
  saveEvidenceVerificationDraft,
  submitEvidenceVerification,
} from '../api/fieldOfficerApi';
import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import type { EvidenceCompletionKey, EvidenceReviewStatus } from '../constants/evidenceVerificationChecklist';
import type { ApiRecord } from '../utils/apiHelpers';
import {
  applyEvidenceVerificationData,
  buildEvidenceVerificationPayload,
  calculateEvidenceCompletionPercent,
  canSubmitEvidenceVerification,
  createDefaultEvidenceVerificationFormState,
  evidenceVerificationBlockers,
  mapEvidenceVerificationRecord,
  type EvidenceVerificationFormState,
  type EvidenceVerificationViewModel,
} from '../utils/evidenceVerificationHelpers';

export function useEvidenceVerificationForm(assignmentId: number) {
  const [viewModel, setViewModel] = useState<EvidenceVerificationViewModel | null>(null);
  const [formState, setFormState] = useState<EvidenceVerificationFormState>(() =>
    createDefaultEvidenceVerificationFormState(),
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getEvidenceVerification(assignmentId);
      const record = mapEvidenceVerificationRecord(data as ApiRecord);
      const verificationData = ((data as ApiRecord).evidence_verification as ApiRecord)?.verification_data ?? null;

      setViewModel(record);
      setFormState(
        applyEvidenceVerificationData(
          record,
          verificationData && typeof verificationData === 'object' ? (verificationData as ApiRecord) : null,
          createDefaultEvidenceVerificationFormState(),
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load evidence verification.'));
      setViewModel(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = useCallback(
    async (submit: boolean) => {
      if (!viewModel) {
        return false;
      }

      setError(null);
      if (submit) {
        setSubmitting(true);
      } else {
        setSavingDraft(true);
      }

      try {
        const payload = buildEvidenceVerificationPayload(formState);
        const response = submit
          ? await submitEvidenceVerification(assignmentId, payload)
          : await saveEvidenceVerificationDraft(assignmentId, payload);

        const record = mapEvidenceVerificationRecord(response as ApiRecord);
        const verificationData = ((response as ApiRecord).evidence_verification as ApiRecord)?.verification_data ?? null;

        setViewModel(record);
        setFormState(
          applyEvidenceVerificationData(
            record,
            verificationData && typeof verificationData === 'object' ? (verificationData as ApiRecord) : null,
            formState,
          ),
        );

        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, submit ? 'Failed to submit evidence verification.' : 'Failed to save draft.'));
        return false;
      } finally {
        setSubmitting(false);
        setSavingDraft(false);
      }
    },
    [assignmentId, formState, viewModel],
  );

  const updatePhotoReview = useCallback(
    (
      category: 'feedstock' | 'production' | 'application',
      id: string,
      status: EvidenceReviewStatus,
      remark?: string,
    ) => {
      const key =
        category === 'feedstock'
          ? 'feedstockPhotoReviews'
          : category === 'production'
            ? 'productionPhotoReviews'
            : 'applicationPhotoReviews';

      setFormState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [id]: {
            status,
            remark: remark ?? prev[key][id]?.remark ?? '',
          },
        },
      }));
    },
    [],
  );

  const updateDocumentReview = useCallback((id: string, status: EvidenceReviewStatus, remark?: string) => {
    setFormState((prev) => ({
      ...prev,
      documentReviews: {
        ...prev.documentReviews,
        [id]: {
          status,
          remark: remark ?? prev.documentReviews[id]?.remark ?? '',
        },
      },
    }));
  }, []);

  const updateWeightSlipReview = useCallback((status: EvidenceReviewStatus, remark?: string) => {
    setFormState((prev) => ({
      ...prev,
      weightSlipReview: {
        status,
        remark: remark ?? prev.weightSlipReview?.remark ?? '',
      },
    }));
  }, []);

  const updateGpsReview = useCallback(
    (id: string, statusKey: string, status: string, remark?: string) => {
      setFormState((prev) => ({
        ...prev,
        gpsRecordReviews: {
          ...prev.gpsRecordReviews,
          [id]: {
            statusKey,
            status,
            remark: remark ?? prev.gpsRecordReviews[id]?.remark ?? '',
          },
        },
      }));
    },
    [],
  );

  const setPhotoRemark = useCallback(
    (category: 'feedstock' | 'production' | 'application', id: string, remark: string) => {
      const key =
        category === 'feedstock'
          ? 'feedstockPhotoReviews'
          : category === 'production'
            ? 'productionPhotoReviews'
            : 'applicationPhotoReviews';

      setFormState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [id]: {
            status: prev[key][id]?.status ?? 'pending',
            remark,
          },
        },
      }));
    },
    [],
  );

  const setDocumentRemark = useCallback((id: string, remark: string) => {
    setFormState((prev) => ({
      ...prev,
      documentReviews: {
        ...prev.documentReviews,
        [id]: {
          status: prev.documentReviews[id]?.status ?? 'pending',
          remark,
        },
      },
    }));
  }, []);

  const setWeightSlipRemark = useCallback((remark: string) => {
    setFormState((prev) => ({
      ...prev,
      weightSlipReview: {
        status: prev.weightSlipReview?.status ?? 'pending',
        remark,
      },
    }));
  }, []);

  const setGpsRemark = useCallback((id: string, remark: string) => {
    setFormState((prev) => ({
      ...prev,
      gpsRecordReviews: {
        ...prev.gpsRecordReviews,
        [id]: {
          statusKey: prev.gpsRecordReviews[id]?.statusKey ?? 'needs_review',
          status: prev.gpsRecordReviews[id]?.status ?? 'Needs Review',
          remark,
        },
      },
    }));
  }, []);

  const toggleCompletionItem = useCallback((key: EvidenceCompletionKey, value: boolean) => {
    setFormState((prev) => ({
      ...prev,
      completionChecklist: { ...prev.completionChecklist, [key]: value },
    }));
  }, []);

  const completionPercent = useMemo(() => calculateEvidenceCompletionPercent(formState), [formState]);
  const submitBlockers = useMemo(
    () => (viewModel ? evidenceVerificationBlockers(formState, viewModel) : ['Evidence data not loaded']),
    [formState, viewModel],
  );
  const submitReady = useMemo(
    () => (viewModel ? canSubmitEvidenceVerification(formState, viewModel) : false),
    [formState, viewModel],
  );

  return {
    viewModel,
    formState,
    loading,
    submitting,
    savingDraft,
    error,
    completionPercent,
    submitBlockers,
    submitReady,
    reload: load,
    updatePhotoReview,
    updateDocumentReview,
    updateWeightSlipReview,
    updateGpsReview,
    setPhotoRemark,
    setDocumentRemark,
    setWeightSlipRemark,
    setGpsRemark,
    toggleCompletionItem,
    setVerificationResult: (value: VerificationResult | null) =>
      setFormState((prev) => ({ ...prev, verificationResult: value })),
    setOfficerRemarks: (value: string) => setFormState((prev) => ({ ...prev, officerRemarks: value })),
    setFinalRemarks: (value: string) => setFormState((prev) => ({ ...prev, finalRemarks: value })),
    setCorrectionReason: (value: string) => setFormState((prev) => ({ ...prev, correctionReason: value })),
    setRequiredEvidence: (value: string) => setFormState((prev) => ({ ...prev, requiredEvidence: value })),
    setCorrectionDueDate: (value: string) => setFormState((prev) => ({ ...prev, correctionDueDate: value })),
    setRejectionReason: (value: string) => setFormState((prev) => ({ ...prev, rejectionReason: value })),
    setEvidenceNotes: (value: string) => setFormState((prev) => ({ ...prev, evidenceNotes: value })),
    saveDraft: () => persist(false),
    submit: () => persist(true),
    setError,
  };
}
