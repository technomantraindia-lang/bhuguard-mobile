import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFeedstockVerificationDetail,
  getFeedstockVerifications,
  saveFeedstockVerificationDraft,
  submitFeedstockVerification,
} from '../api/fieldOfficerApi';
import type { FeedstockPhotoReview, SectionResult, VerificationResult } from '../constants/feedstockVerificationChecklist';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import {
  applyRecordToFormState,
  buildFeedstockFormPayload,
  calculateFeedstockCompletionPercent,
  canSubmitFeedstockVerification,
  createDefaultFeedstockFormState,
  feedstockVerificationBlockers,
  mapFeedstockVerificationRecord,
  type FeedstockVerificationFormState,
  type FeedstockVerificationViewModel,
} from '../utils/feedstockVerificationHelpers';

export function useFeedstockVerificationForm(verificationId?: number, officerName = 'Field Officer') {
  const [verification, setVerification] = useState<FeedstockVerificationViewModel | null>(null);
  const [formState, setFormState] = useState<FeedstockVerificationFormState>(() => createDefaultFeedstockFormState());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const applyRecord = useCallback(
    (record: FeedstockVerificationViewModel) => {
      setVerification(record);
      setFormState((current) => applyRecordToFormState(record, current));
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      if (verificationId) {
        const data = await getFeedstockVerificationDetail(verificationId);
        const record = (data.feedstock_verification ?? data) as ApiRecord;
        applyRecord(mapFeedstockVerificationRecord(record, officerName));
        return;
      }

      const listData = await getFeedstockVerifications();
      const first = extractList(listData as ApiRecord, ['feedstock_verifications'])[0];

      if (!first) {
        setIsEmpty(true);
        setVerification(null);
        return;
      }

      applyRecord(mapFeedstockVerificationRecord(first, officerName));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load feedstock verification.'));
      setVerification(null);
      setIsEmpty(false);
    } finally {
      setLoading(false);
    }
  }, [applyRecord, officerName, verificationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (officerName && verification) {
      setVerification((current) => (current ? { ...current, officerName } : current));
    }
  }, [officerName, verification?.id]);

  const completionPercent = useMemo(
    () => (verification ? calculateFeedstockCompletionPercent(formState, verification) : 0),
    [formState, verification],
  );

  const submitBlockers = useMemo(
    () => (verification ? feedstockVerificationBlockers(formState, verification) : ['Load verification data first.']),
    [formState, verification],
  );

  const submitReady = useMemo(
    () => (verification ? canSubmitFeedstockVerification(formState, verification) : false),
    [formState, verification],
  );

  const updateSectionItem = (
    sectionKey: keyof FeedstockVerificationFormState['sections'],
    itemKey: string,
    checked: boolean,
  ) => {
    setFormState((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [sectionKey]: {
          ...current.sections[sectionKey],
          items: {
            ...current.sections[sectionKey].items,
            [itemKey]: checked,
          },
        },
      },
    }));
  };

  const updateSectionResult = (
    sectionKey: keyof FeedstockVerificationFormState['sections'],
    result: SectionResult,
  ) => {
    setFormState((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [sectionKey]: {
          ...current.sections[sectionKey],
          result,
        },
      },
    }));
  };

  const updateSectionRemarks = (
    sectionKey: keyof FeedstockVerificationFormState['sections'],
    remarks: string,
  ) => {
    setFormState((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [sectionKey]: {
          ...current.sections[sectionKey],
          remarks,
        },
      },
    }));
  };

  const updatePhotoReview = (photoId: number, patch: Partial<FeedstockPhotoReview>) => {
    setFormState((current) => ({
      ...current,
      photoReviews: current.photoReviews.map((item) =>
        item.photoId === photoId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const setOfficerObservedQuantity = (value: string) => {
    setFormState((current) => ({ ...current, officerObservedQuantity: value }));
  };

  const setWeightSlipApproved = (approved: boolean | null) => {
    setFormState((current) => ({ ...current, weightSlipApproved: approved }));
  };

  const setWeightSlipRejectionReason = (value: string) => {
    setFormState((current) => ({ ...current, weightSlipRejectionReason: value }));
  };

  const setGpsVerified = (verified: boolean | null) => {
    setFormState((current) => ({
      ...current,
      gpsVerified: verified,
      gpsFlagged: verified ? false : current.gpsFlagged,
    }));
  };

  const setGpsFlagged = (flagged: boolean) => {
    setFormState((current) => ({
      ...current,
      gpsFlagged: flagged,
      gpsVerified: flagged ? false : current.gpsVerified,
    }));
  };

  const setGpsOverrideReason = (value: string) => {
    setFormState((current) => ({ ...current, gpsOverrideReason: value }));
  };

  const setGpsOverridePhotoUri = (uri: string | null) => {
    setFormState((current) => ({ ...current, gpsOverridePhotoUri: uri }));
  };

  const addOfficerEvidencePhoto = (uri: string) => {
    setFormState((current) => ({
      ...current,
      officerEvidencePhotos: [...current.officerEvidencePhotos, uri],
    }));
  };

  const setOfficerRemarks = (value: string) => {
    setFormState((current) => ({ ...current, officerRemarks: value }));
  };

  const setCorrectionNotes = (value: string) => {
    setFormState((current) => ({ ...current, correctionNotes: value }));
  };

  const setRequiredChanges = (value: string) => {
    setFormState((current) => ({ ...current, requiredChanges: value }));
  };

  const setCorrectionDueDate = (value: string) => {
    setFormState((current) => ({ ...current, correctionDueDate: value }));
  };

  const setEvidenceNotes = (value: string) => {
    setFormState((current) => ({ ...current, evidenceNotes: value }));
  };

  const setRejectionReason = (value: string) => {
    setFormState((current) => ({ ...current, rejectionReason: value }));
  };

  const setVerificationResult = (value: VerificationResult) => {
    setFormState((current) => ({ ...current, verificationResult: value }));
  };

  const saveDraft = async (): Promise<boolean> => {
    if (!verification) {
      return false;
    }

    setSavingDraft(true);
    setError(null);

    try {
      const data = await saveFeedstockVerificationDraft(verification.id, buildFeedstockFormPayload(formState));
      const record = (data.feedstock_verification ?? data) as ApiRecord;
      applyRecord(mapFeedstockVerificationRecord(record, officerName));
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save verification draft.'));
      return false;
    } finally {
      setSavingDraft(false);
    }
  };

  const submit = async (): Promise<boolean> => {
    if (!verification) {
      return false;
    }

    if (!submitReady) {
      setError(submitBlockers[0] ?? 'Complete all required verification steps.');
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await submitFeedstockVerification(verification.id, buildFeedstockFormPayload(formState));
      const record = (data.feedstock_verification ?? data) as ApiRecord;
      applyRecord(mapFeedstockVerificationRecord(record, officerName));
      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit feedstock verification.'));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    verification,
    formState,
    loading,
    submitting,
    savingDraft,
    error,
    isEmpty,
    completionPercent,
    submitReady,
    submitBlockers,
    setError,
    reload: load,
    updateSectionItem,
    updateSectionResult,
    updateSectionRemarks,
    updatePhotoReview,
    setOfficerObservedQuantity,
    setWeightSlipApproved,
    setWeightSlipRejectionReason,
    setGpsVerified,
    setGpsFlagged,
    setGpsOverrideReason,
    setGpsOverridePhotoUri,
    addOfficerEvidencePhoto,
    setOfficerRemarks,
    setCorrectionNotes,
    setRequiredChanges,
    setCorrectionDueDate,
    setEvidenceNotes,
    setRejectionReason,
    setVerificationResult,
    saveDraft,
    submit,
  };
}
