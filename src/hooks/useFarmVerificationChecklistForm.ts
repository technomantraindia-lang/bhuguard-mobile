import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import {
  getAssignmentChecklist,
  getFieldOfficerProfile,
  getVisitAssignmentDetail,
  submitChecklist,
} from '../api/fieldOfficerApi';
import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import type {
  BoundaryIssueType,
  CropCondition,
  FarmActiveStatus,
  FarmPhotoKey,
} from '../constants/farmVerificationChecklist';
import { isApiNotFound } from '../utils/apiError';
import type { ApiRecord } from '../utils/apiHelpers';
import {
  buildFarmVerificationPayload,
  buildFarmVerificationViewModel,
  calculateFarmCompletionPercent,
  canSubmitFarmVerification,
  createDefaultFarmVerificationState,
  farmVerificationBlockers,
  parseFarmVerificationState,
  summarizeEvidenceDocuments,
  type FarmVerificationState,
  type FarmVerificationViewModel,
} from '../utils/farmVerificationHelpers';
import {
  uploadChecklistSignature,
  type ChecklistSignatureRole,
} from '../utils/uploadChecklistSignature';
import { unwrapAssignmentRecord } from '../utils/visitWorkflowHelpers';

export function useFarmVerificationChecklistForm(assignmentId: number) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capturingSignature, setCapturingSignature] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<ApiRecord | null>(null);
  const [checklistRecord, setChecklistRecord] = useState<ApiRecord | null>(null);
  const [viewModel, setViewModel] = useState<FarmVerificationViewModel | null>(null);
  const [state, setState] = useState<FarmVerificationState>(() => createDefaultFarmVerificationState({}));

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignmentData, profileData] = await Promise.all([
        getVisitAssignmentDetail(assignmentId),
        getFieldOfficerProfile(),
      ]);

      const assignmentRecord = unwrapAssignmentRecord(assignmentData as ApiRecord);
      const user = (profileData.user ?? profileData) as ApiRecord;
      const officerName =
        typeof user.name === 'string' && user.name.trim() ? user.name : 'Field Officer';

      let checklist: ApiRecord | null = null;
      const embedded = assignmentRecord.verification_checklist ?? assignmentRecord.checklist;

      if (embedded && typeof embedded === 'object') {
        checklist = embedded as ApiRecord;
      } else {
        try {
          const checklistData = await getAssignmentChecklist(assignmentId);
          const record = (checklistData as ApiRecord).checklist ?? checklistData;
          checklist = record && typeof record === 'object' ? (record as ApiRecord) : null;
        } catch (err) {
          if (!isApiNotFound(err)) {
            throw err;
          }
        }
      }

      const parsed = parseFarmVerificationState(assignmentRecord, checklist);
      parsed.evidence.documentsReviewed =
        parsed.evidence.documentsReviewed || summarizeEvidenceDocuments(assignmentRecord) > 0;

      setAssignment(assignmentRecord);
      setChecklistRecord(checklist);
      setViewModel(buildFarmVerificationViewModel(assignmentRecord, assignmentId, officerName));
      setState(parsed);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farm verification checklist.'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateExistenceItem = useCallback((key: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      existence: {
        ...prev.existence,
        items: { ...prev.existence.items, [key]: checked },
      },
    }));
  }, []);

  const updateExistenceRemarks = useCallback((remarks: string) => {
    setState((prev) => ({ ...prev, existence: { ...prev.existence, remarks } }));
  }, []);

  const updateBoundaryItem = useCallback((key: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      boundary: {
        ...prev.boundary,
        items: { ...prev.boundary.items, [key]: checked },
      },
    }));
  }, []);

  const updateBoundaryRemarks = useCallback((remarks: string) => {
    setState((prev) => ({ ...prev, boundary: { ...prev.boundary, remarks } }));
  }, []);

  const setBoundaryVerified = useCallback((verified: boolean) => {
    setState((prev) => ({
      ...prev,
      boundary: { ...prev.boundary, boundaryVerified: verified },
      evidence: { ...prev.evidence, boundaryVerified: verified },
    }));
  }, []);

  const setBoundaryIssueType = useCallback((value: BoundaryIssueType | null) => {
    setState((prev) => ({ ...prev, boundary: { ...prev.boundary, boundaryIssueType: value } }));
  }, []);

  const setBoundaryCorrectionNotes = useCallback((value: string) => {
    setState((prev) => ({ ...prev, boundary: { ...prev.boundary, correctionNotes: value } }));
  }, []);

  const updateLandAreaItem = useCallback((key: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      landArea: {
        ...prev.landArea,
        items: { ...prev.landArea.items, [key]: checked },
      },
    }));
  }, []);

  const updateLandAreaRemarks = useCallback((remarks: string) => {
    setState((prev) => ({ ...prev, landArea: { ...prev.landArea, remarks } }));
  }, []);

  const updateCropItem = useCallback((key: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      crop: {
        ...prev.crop,
        items: { ...prev.crop.items, [key]: checked },
      },
    }));
  }, []);

  const updateCropRemarks = useCallback((remarks: string) => {
    setState((prev) => ({ ...prev, crop: { ...prev.crop, remarks } }));
  }, []);

  const setCropCondition = useCallback((value: CropCondition | null) => {
    setState((prev) => ({ ...prev, crop: { ...prev.crop, cropCondition: value } }));
  }, []);

  const updateActiveStatusItem = useCallback((key: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      activeStatus: {
        ...prev.activeStatus,
        items: { ...prev.activeStatus.items, [key]: checked },
      },
    }));
  }, []);

  const updateActiveStatusRemarks = useCallback((remarks: string) => {
    setState((prev) => ({ ...prev, activeStatus: { ...prev.activeStatus, remarks } }));
  }, []);

  const setFarmStatus = useCallback((value: FarmActiveStatus | null) => {
    setState((prev) => ({ ...prev, activeStatus: { ...prev.activeStatus, farmStatus: value } }));
  }, []);

  const setPhoto = useCallback((key: FarmPhotoKey, uri: string | null) => {
    setState((prev) => {
      const photos = { ...prev.photos, [key]: uri };
      const photoCount = Object.values(photos).filter(Boolean).length;

      return {
        ...prev,
        photos,
        evidence: { ...prev.evidence, photosUploaded: photoCount },
      };
    });
  }, []);

  const setDocumentsReviewed = useCallback((reviewed: boolean) => {
    setState((prev) => ({
      ...prev,
      evidence: { ...prev.evidence, documentsReviewed: reviewed },
    }));
  }, []);

  const uploadSignature = useCallback(
    async (role: ChecklistSignatureRole, fileUri: string) => {
      setCapturingSignature(true);
      setError(null);

      try {
        const uploaded = await uploadChecklistSignature(assignmentId, role, fileUri);

        setState((prev) => ({
          ...prev,
          signatures: {
            ...prev.signatures,
            farmerCaptured: role === 'farmer' ? true : prev.signatures.farmerCaptured,
            officerCaptured: role === 'officer' ? true : prev.signatures.officerCaptured,
            farmerSignatureUrl:
              role === 'farmer' ? uploaded.fileUrl ?? fileUri : prev.signatures.farmerSignatureUrl,
            officerSignatureUrl:
              role === 'officer' ? uploaded.fileUrl ?? fileUri : prev.signatures.officerSignatureUrl,
          },
        }));

        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to upload signature.'));
        return false;
      } finally {
        setCapturingSignature(false);
      }
    },
    [assignmentId],
  );

  const clearSignature = useCallback((role: 'farmer' | 'officer') => {
    setState((prev) => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        farmerCaptured: role === 'farmer' ? false : prev.signatures.farmerCaptured,
        officerCaptured: role === 'officer' ? false : prev.signatures.officerCaptured,
        farmerSignatureUrl: role === 'farmer' ? null : prev.signatures.farmerSignatureUrl,
        officerSignatureUrl: role === 'officer' ? null : prev.signatures.officerSignatureUrl,
      },
    }));
  }, []);

  const setVerificationResult = useCallback((result: VerificationResult) => {
    setState((prev) => ({ ...prev, verificationResult: result }));
  }, []);

  const setFinalRemarks = useCallback((finalRemarks: string) => {
    setState((prev) => ({ ...prev, finalRemarks }));
  }, []);

  const persist = useCallback(
    async (submit: boolean, nextState?: FarmVerificationState) => {
      setSaving(true);
      setError(null);

      try {
        const activeState = nextState ?? state;
        const existingObserved =
          checklistRecord?.observed_values && typeof checklistRecord.observed_values === 'object'
            ? (checklistRecord.observed_values as ApiRecord)
            : null;

        const payload = buildFarmVerificationPayload(activeState, submit, existingObserved);
        await submitChecklist(assignmentId, payload);

        if (nextState) {
          setState(nextState);
        }

        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to save farm verification.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [assignmentId, checklistRecord, state],
  );

  const saveDraft = useCallback(async () => persist(false), [persist]);

  const submitVerification = useCallback(async () => {
    const nextState = { ...state, submitted: true };

    return persist(true, nextState);
  }, [persist, state]);

  const saveCorrectionRequired = useCallback(async () => {
    const nextState = {
      ...state,
      verificationResult: 'correction_required' as VerificationResult,
    };

    return persist(false, nextState);
  }, [persist, state]);

  const saveRejected = useCallback(async () => {
    const nextState = {
      ...state,
      verificationResult: 'rejected' as VerificationResult,
    };

    return persist(false, nextState);
  }, [persist, state]);

  const completionPercent = useMemo(() => calculateFarmCompletionPercent(state), [state]);
  const submitReady = useMemo(() => canSubmitFarmVerification(state), [state]);
  const submitBlockers = useMemo(() => farmVerificationBlockers(state), [state]);

  return {
    loading,
    saving,
    capturingSignature,
    error,
    assignment,
    viewModel,
    state,
    completionPercent,
    submitReady,
    submitBlockers,
    reload,
    updateExistenceItem,
    updateExistenceRemarks,
    updateBoundaryItem,
    updateBoundaryRemarks,
    setBoundaryVerified,
    setBoundaryIssueType,
    setBoundaryCorrectionNotes,
    updateLandAreaItem,
    updateLandAreaRemarks,
    updateCropItem,
    updateCropRemarks,
    setCropCondition,
    updateActiveStatusItem,
    updateActiveStatusRemarks,
    setFarmStatus,
    setPhoto,
    setDocumentsReviewed,
    uploadSignature,
    clearSignature,
    setVerificationResult,
    setFinalRemarks,
    saveDraft,
    submitVerification,
    saveCorrectionRequired,
    saveRejected,
    setError,
  };
}
