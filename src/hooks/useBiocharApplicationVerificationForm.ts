import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getBiocharApplicationDetail,
  getBiocharApplicationForAssignment,
  getBiocharApplications,
  saveBiocharApplicationVerificationDraft,
  submitBiocharApplicationVerification,
} from '../api/fieldOfficerApi';
import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import type { BiocharPhotoPhase, SectionResult } from '../constants/biocharApplicationVerificationChecklist';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import {
  applyBiocharVerificationData,
  biocharApplicationVerificationBlockers,
  buildBiocharApplicationPayload,
  calculateBiocharCompletionPercent,
  canSubmitBiocharApplicationVerification,
  createDefaultBiocharApplicationFormState,
  mapBiocharApplicationRecord,
  type BiocharApplicationVerificationFormState,
  type BiocharApplicationVerificationViewModel,
} from '../utils/biocharApplicationVerificationHelpers';

export function useBiocharApplicationVerificationForm(
  applicationId?: number,
  assignmentId?: number,
) {
  const [application, setApplication] = useState<BiocharApplicationVerificationViewModel | null>(null);
  const [formState, setFormState] = useState<BiocharApplicationVerificationFormState>(() =>
    createDefaultBiocharApplicationFormState(),
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      let data: ApiRecord;

      if (applicationId) {
        data = await getBiocharApplicationDetail(applicationId);
      } else if (assignmentId) {
        data = await getBiocharApplicationForAssignment(assignmentId);
      } else {
        const list = await getBiocharApplications();
        const first = extractList(list as ApiRecord, ['applications'])[0];

        if (!first) {
          setIsEmpty(true);
          setApplication(null);
          return;
        }

        data = { biochar_application: first };
      }

      const record = mapBiocharApplicationRecord(data as ApiRecord);
      const verificationData =
        ((data as ApiRecord).biochar_application as ApiRecord)?.verification_data ??
        (data as ApiRecord).verification_data;

      setApplication(record);
      setFormState(
        applyBiocharVerificationData(
          record,
          verificationData && typeof verificationData === 'object' ? (verificationData as ApiRecord) : null,
          createDefaultBiocharApplicationFormState(record),
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load biochar application verification.'));
      setApplication(null);
    } finally {
      setLoading(false);
    }
  }, [applicationId, assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSectionItem = (
    sectionKey: keyof BiocharApplicationVerificationFormState['sections'],
    itemKey: string,
    checked: boolean,
  ) => {
    setFormState((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...prev.sections[sectionKey],
          items: { ...prev.sections[sectionKey].items, [itemKey]: checked },
        },
      },
    }));
  };

  const updateSectionRemarks = (
    sectionKey: keyof BiocharApplicationVerificationFormState['sections'],
    remarks: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: { ...prev.sections[sectionKey], remarks },
      },
    }));
  };

  const setSectionResult = (
    sectionKey: keyof BiocharApplicationVerificationFormState['sections'],
    result: SectionResult,
  ) => {
    setFormState((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: { ...prev.sections[sectionKey], result },
      },
    }));
  };

  const updatePhotoReview = (phase: BiocharPhotoPhase, patch: Partial<{ approved: boolean | null; rejectionReason: string }>) => {
    setFormState((prev) => ({
      ...prev,
      photoReviews: prev.photoReviews.map((review) =>
        review.phase === phase ? { ...review, ...patch } : review,
      ),
    }));
  };

  const persist = useCallback(
    async (submit: boolean) => {
      if (!application) {
        return false;
      }

      if (submit) {
        setSubmitting(true);
      } else {
        setSavingDraft(true);
      }

      setError(null);

      try {
        const payload = buildBiocharApplicationPayload(formState);
        const response = submit
          ? await submitBiocharApplicationVerification(application.id, payload)
          : await saveBiocharApplicationVerificationDraft(application.id, payload);

        const record = mapBiocharApplicationRecord(response as ApiRecord);
        const verificationData = ((response as ApiRecord).biochar_application ?? response) as ApiRecord;

        setApplication(record);
        setFormState(
          applyBiocharVerificationData(
            record,
            (verificationData.verification_data as ApiRecord) ?? payload,
            formState,
          ),
        );

        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, submit ? 'Failed to submit verification.' : 'Failed to save draft.'));
        return false;
      } finally {
        setSubmitting(false);
        setSavingDraft(false);
      }
    },
    [application, formState],
  );

  const completionPercent = useMemo(() => calculateBiocharCompletionPercent(formState), [formState]);
  const submitBlockers = useMemo(() => biocharApplicationVerificationBlockers(formState), [formState]);
  const submitReady = useMemo(() => canSubmitBiocharApplicationVerification(formState), [formState]);

  return {
    application,
    formState,
    loading,
    submitting,
    savingDraft,
    error,
    isEmpty,
    completionPercent,
    submitBlockers,
    submitReady,
    reload: load,
    updateSectionItem,
    updateSectionRemarks,
    setSectionResult,
    updatePhotoReview,
    setOfficerObservedQuantity: (value: string) =>
      setFormState((prev) => ({ ...prev, officerObservedQuantity: value })),
    setPlotVerified: (value: boolean) => setFormState((prev) => ({ ...prev, plotVerified: value })),
    setBatchVerified: (value: boolean) => setFormState((prev) => ({ ...prev, batchVerified: value })),
    setInspectionNote: (value: string) => setFormState((prev) => ({ ...prev, inspectionNote: value })),
    addAdditionalPhoto: (uri: string) =>
      setFormState((prev) => ({ ...prev, additionalPhotos: [...prev.additionalPhotos, uri] })),
    addAdditionalDocument: (uri: string) =>
      setFormState((prev) => ({ ...prev, additionalDocuments: [...prev.additionalDocuments, uri] })),
    setCorrectionReason: (value: string) => setFormState((prev) => ({ ...prev, correctionReason: value })),
    setRequiredAction: (value: string) => setFormState((prev) => ({ ...prev, requiredAction: value })),
    setCorrectionDueDate: (value: string) => setFormState((prev) => ({ ...prev, correctionDueDate: value })),
    setRejectionReason: (value: string) => setFormState((prev) => ({ ...prev, rejectionReason: value })),
    setEvidenceNotes: (value: string) => setFormState((prev) => ({ ...prev, evidenceNotes: value })),
    setOfficerRemarks: (value: string) => setFormState((prev) => ({ ...prev, officerRemarks: value })),
    setFinalRemarks: (value: string) => setFormState((prev) => ({ ...prev, finalRemarks: value })),
    setVerificationResult: (value: VerificationResult) =>
      setFormState((prev) => ({ ...prev, verificationResult: value })),
    saveDraft: () => persist(false),
    submit: () => persist(true),
    setError,
  };
}
