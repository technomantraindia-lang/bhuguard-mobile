import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/authApi';
import { submitVisitCheckIn } from '../api/checkInApi';
import {
  getAssignmentChecklist,
  getFieldOfficerProfile,
  getVisitAssignmentDetail,
  submitChecklist,
} from '../api/fieldOfficerApi';
import type { VerificationResult } from '../constants/feedstockVerificationChecklist';
import type { MrvSectionKey } from '../constants/mrvVerificationChecklist';
import { isApiNotFound } from '../utils/apiError';
import { type ApiRecord } from '../utils/apiHelpers';
import { haversineMeters } from '../utils/boundaryGeometry';
import {
  DEFAULT_ALLOWED_RADIUS_METERS,
  MAX_ALLOWED_ACCURACY_METERS,
} from '../utils/locationUtils';
import { captureHighAccuracyGps } from '../utils/officerGpsCapture';
import {
  buildMrvChecklistPayload,
  buildMrvViewModel,
  calculateMrvCompletionPercent,
  canGenerateMrvReport,
  canSubmitForApproval,
  createDefaultMrvState,
  mrvReportBlockers,
  parseMrvVerificationState,
  summarizeEvidenceFromAssignment,
  type MrvVerificationState,
  type MrvVerificationViewModel,
} from '../utils/mrvVerificationHelpers';
import {
  uploadChecklistSignature,
  type ChecklistSignatureRole,
} from '../utils/uploadChecklistSignature';
import { unwrapAssignmentRecord } from '../utils/visitWorkflowHelpers';

export function useMrvVerificationChecklistForm(assignmentId: number) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [capturingSignature, setCapturingSignature] = useState(false);
  const [verifyingGps, setVerifyingGps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<ApiRecord | null>(null);
  const [viewModel, setViewModel] = useState<MrvVerificationViewModel | null>(null);
  const [state, setState] = useState<MrvVerificationState>(() => createDefaultMrvState({}));

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

      let checklistRecord: ApiRecord | null = null;
      const embedded = assignmentRecord.verification_checklist ?? assignmentRecord.checklist;

      if (embedded && typeof embedded === 'object') {
        checklistRecord = embedded as ApiRecord;
      } else {
        try {
          const checklistData = await getAssignmentChecklist(assignmentId);
          const checklist = (checklistData as ApiRecord).checklist ?? checklistData;
          checklistRecord = checklist && typeof checklist === 'object' ? (checklist as ApiRecord) : null;
        } catch (err) {
          if (!isApiNotFound(err)) {
            throw err;
          }
        }
      }

      const parsed = parseMrvVerificationState(assignmentRecord, checklistRecord);
      parsed.evidence = {
        ...summarizeEvidenceFromAssignment(assignmentRecord),
        status: parsed.evidence.status,
      };

      setAssignment(assignmentRecord);
      setViewModel(buildMrvViewModel(assignmentRecord, assignmentId, officerName));
      setState(parsed);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load verification checklist.'));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateSectionItem = useCallback((section: MrvSectionKey, key: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        items: { ...prev[section].items, [key]: checked },
      },
    }));
  }, []);

  const updateSectionRemarks = useCallback((section: MrvSectionKey, remarks: string) => {
    setState((prev) => ({
      ...prev,
      [section]: { ...prev[section], remarks },
    }));
  }, []);

  const captureGps = useCallback(async () => {
    setError(null);

    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      setError('Location permission is required for GPS verification.');
      return false;
    }

    try {
      const position = await captureHighAccuracyGps();
      const latitude = position.latitude;
      const longitude = position.longitude;
      const accuracyM = position.accuracyM;

      let distanceFromFarmKm: number | null = null;

      if (assignment) {
        const farm = assignment.farm as ApiRecord | undefined;
        const farmLat = farm?.latitude != null ? Number(farm.latitude) : null;
        const farmLng = farm?.longitude != null ? Number(farm.longitude) : null;

        if (farmLat != null && farmLng != null) {
          distanceFromFarmKm = haversineMeters(latitude, longitude, farmLat, farmLng) / 1000;
        }
      }

      setState((prev) => ({
        ...prev,
        gps: {
          latitude,
          longitude,
          accuracyM,
          distanceFromFarmKm,
          checkInTime: position.timestamp,
          status: 'pending',
        },
      }));

      return true;
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to capture GPS location.'));
      return false;
    }
  }, [assignment]);

  const verifyLocation = useCallback(async () => {
    setError(null);
    setVerifyingGps(true);

    try {
      const gpsState = state.gps;

      if (gpsState.latitude == null || gpsState.longitude == null) {
        setError('Capture GPS before verifying location.');
        return false;
      }

      if (gpsState.accuracyM != null && gpsState.accuracyM > MAX_ALLOWED_ACCURACY_METERS) {
        setError('GPS accuracy is low. Move to an open area and capture again.');
        return false;
      }

      const farm = assignment?.farm as ApiRecord | undefined;
      const farmLat = farm?.latitude != null ? Number(farm.latitude) : null;
      const farmLng = farm?.longitude != null ? Number(farm.longitude) : null;
      const distanceM =
        farmLat != null && farmLng != null
          ? haversineMeters(gpsState.latitude, gpsState.longitude, farmLat, farmLng)
          : 0;
      const allowedRadius = Number(
        assignment?.allowed_radius_meter ?? assignment?.allowed_radius ?? DEFAULT_ALLOWED_RADIUS_METERS,
      );

      await submitVisitCheckIn(assignmentId, {
        latitude: gpsState.latitude,
        longitude: gpsState.longitude,
        accuracy: gpsState.accuracyM ?? 0,
        captured_at: gpsState.checkInTime ?? new Date().toISOString(),
        distance_from_target: distanceM,
        allowed_radius: Number.isFinite(allowedRadius) && allowedRadius > 0 ? allowedRadius : DEFAULT_ALLOWED_RADIUS_METERS,
      });

      setState((prev) => ({
        ...prev,
        gps: {
          ...prev.gps,
          distanceFromFarmKm: distanceM / 1000,
          status: 'verified',
        },
      }));

      return true;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        gps: {
          ...prev.gps,
          status: 'failed',
        },
      }));
      setError(getApiErrorMessage(err, 'Unable to verify GPS check-in.'));
      return false;
    } finally {
      setVerifyingGps(false);
    }
  }, [assignment, assignmentId, state.gps]);

  const setEvidenceStatus = useCallback((status: MrvVerificationState['evidence']['status']) => {
    setState((prev) => ({
      ...prev,
      evidence: { ...prev.evidence, status },
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

  const markMrvReportGenerated = useCallback(() => {
    setState((prev) => ({ ...prev, mrvReportGenerated: true }));
  }, []);

  const persist = useCallback(
    async (submit: boolean, nextState?: MrvVerificationState) => {
      setSaving(true);
      setError(null);

      try {
        const payload = buildMrvChecklistPayload(nextState ?? state, submit);
        await submitChecklist(assignmentId, payload);

        if (nextState) {
          setState(nextState);
        }

        return true;
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to save verification checklist.'));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [assignmentId, state],
  );

  const saveDraft = useCallback(async () => persist(false), [persist]);

  const submitForApproval = useCallback(async () => persist(true), [persist]);

  const saveWithReportGenerated = useCallback(async () => {
    const nextState = { ...state, mrvReportGenerated: true };
    return persist(false, nextState);
  }, [persist, state]);

  const saveRejected = useCallback(async () => {
    const nextState = { ...state, verificationResult: 'rejected' as VerificationResult };
    return persist(false, nextState);
  }, [persist, state]);

  const saveCorrectionRequired = useCallback(async () => {
    const nextState = {
      ...state,
      verificationResult: 'correction_required' as VerificationResult,
    };
    return persist(false, nextState);
  }, [persist, state]);

  const completionPercent = useMemo(() => calculateMrvCompletionPercent(state), [state]);

  const reportReady = useMemo(() => canGenerateMrvReport(state), [state]);
  const approvalReady = useMemo(() => canSubmitForApproval(state), [state]);
  const reportBlockers = useMemo(() => mrvReportBlockers(state), [state]);

  return {
    loading,
    saving,
    capturingSignature,
    verifyingGps,
    error,
    assignment,
    viewModel,
    state,
    completionPercent,
    reportReady,
    approvalReady,
    reportBlockers,
    reload,
    updateSectionItem,
    updateSectionRemarks,
    captureGps,
    verifyLocation,
    setEvidenceStatus,
    uploadSignature,
    clearSignature,
    setVerificationResult,
    setFinalRemarks,
    markMrvReportGenerated,
    saveDraft,
    submitForApproval,
    saveWithReportGenerated,
    saveRejected,
    saveCorrectionRequired,
    setError,
  };
}
