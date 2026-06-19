import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getFeedstockVerificationDetail,
  getFeedstockVerifications,
  saveFeedstockVerificationDraft,
  submitFeedstockVerification,
} from '../api/fieldOfficerApi';
import type { FeedstockChecklistItem, FeedstockPhotoReview, VerificationResult } from '../constants/feedstockVerificationChecklist';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import {
  buildVerificationPayload,
  mapFeedstockVerificationRecord,
  type FeedstockVerificationViewModel,
} from '../utils/feedstockVerificationHelpers';

export function useFeedstockVerificationForm(verificationId?: number) {
  const [verification, setVerification] = useState<FeedstockVerificationViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const [checklist, setChecklist] = useState<FeedstockChecklistItem[]>([]);
  const [photoReviews, setPhotoReviews] = useState<FeedstockPhotoReview[]>([]);
  const [weightSlipApproved, setWeightSlipApproved] = useState<boolean | null>(null);
  const [gpsVerified, setGpsVerified] = useState<boolean | null>(null);
  const [gpsFlagged, setGpsFlagged] = useState(false);
  const [officerRemarks, setOfficerRemarks] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [requiredChanges, setRequiredChanges] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult>(null);

  const applyRecord = useCallback((record: FeedstockVerificationViewModel) => {
    setVerification(record);
    setChecklist(record.checklist);
    setPhotoReviews(
      record.photos.map((photo) => ({
        photoId: photo.id,
        approved: photo.approved,
        rejected: photo.rejected,
      })),
    );
    setWeightSlipApproved(record.weightSlip.approved);
    setGpsVerified(null);
    setGpsFlagged(false);
    setOfficerRemarks(record.officerRemarks);
    setCorrectionNotes(record.correctionNotes);
    setRequiredChanges(record.requiredChanges);
    setRejectionReason(record.rejectionReason);
    setVerificationResult(record.verificationResult);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsEmpty(false);

    try {
      if (verificationId) {
        const data = await getFeedstockVerificationDetail(verificationId);
        const record = (data.feedstock_verification ?? data) as ApiRecord;
        applyRecord(mapFeedstockVerificationRecord(record));
        return;
      }

      const listData = await getFeedstockVerifications();
      const first = extractList(listData as ApiRecord, ['feedstock_verifications'])[0];

      if (!first) {
        setIsEmpty(true);
        setVerification(null);
        return;
      }

      applyRecord(mapFeedstockVerificationRecord(first));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load feedstock verification.'));
      setVerification(null);
      setIsEmpty(false);
    } finally {
      setLoading(false);
    }
  }, [applyRecord, verificationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const payload = useMemo(
    () =>
      buildVerificationPayload({
        checklist,
        photoReviews,
        weightSlipApproved,
        gpsVerified,
        gpsFlagged,
        officerRemarks,
        correctionNotes,
        requiredChanges,
        rejectionReason,
        verificationResult,
      }),
    [
      checklist,
      photoReviews,
      weightSlipApproved,
      gpsVerified,
      gpsFlagged,
      officerRemarks,
      correctionNotes,
      requiredChanges,
      rejectionReason,
      verificationResult,
    ],
  );

  const updateChecklistItem = (key: string, patch: Partial<FeedstockChecklistItem>) => {
    setChecklist((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const updatePhotoReview = (photoId: number, patch: Partial<FeedstockPhotoReview>) => {
    setPhotoReviews((current) =>
      current.map((item) => (item.photoId === photoId ? { ...item, ...patch } : item)),
    );
  };

  const validateSubmit = (): string | null => {
    if (!verificationResult) {
      return 'Select a final verification status before submitting.';
    }

    const incompleteChecklist = checklist.some((item) => !item.result);

    if (incompleteChecklist) {
      return 'Complete all feedstock verification checklist items.';
    }

    if (verificationResult === 'correction_required' && !correctionNotes.trim()) {
      return 'Add correction notes when requesting changes.';
    }

    if (verificationResult === 'rejected' && !rejectionReason.trim()) {
      return 'Add a rejection reason before rejecting this record.';
    }

    return null;
  };

  const saveDraft = async (): Promise<boolean> => {
    if (!verification) {
      return false;
    }

    setSavingDraft(true);
    setError(null);

    try {
      const data = await saveFeedstockVerificationDraft(verification.id, payload);
      const record = (data.feedstock_verification ?? data) as ApiRecord;
      applyRecord(mapFeedstockVerificationRecord(record));
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

    const validationError = validateSubmit();

    if (validationError) {
      setError(validationError);
      return false;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await submitFeedstockVerification(verification.id, payload);
      const record = (data.feedstock_verification ?? data) as ApiRecord;
      applyRecord(mapFeedstockVerificationRecord(record));
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
    loading,
    submitting,
    savingDraft,
    error,
    isEmpty,
    setError,
    reload: load,
    checklist,
    updateChecklistItem,
    photoReviews,
    updatePhotoReview,
    weightSlipApproved,
    setWeightSlipApproved,
    gpsVerified,
    setGpsVerified,
    gpsFlagged,
    setGpsFlagged,
    officerRemarks,
    setOfficerRemarks,
    correctionNotes,
    setCorrectionNotes,
    requiredChanges,
    setRequiredChanges,
    rejectionReason,
    setRejectionReason,
    verificationResult,
    setVerificationResult,
    saveDraft,
    submit,
  };
}
