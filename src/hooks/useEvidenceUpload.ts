import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import {
  buildEvidenceFormData,
  getEvidence,
  uploadEvidence,
  type EvidenceListParams,
  type EvidenceUploadPayload,
} from '../api/evidenceApi';
import type { EvidenceRole } from '../constants/evidenceCategories';
import { categoryRequiresGps } from '../constants/evidenceCategories';
import type { LiveCapturedEvidence } from '../utils/liveEvidenceCapture';
import { getApiErrorMessage } from '../api/authApi';
import { extractList, type ApiRecord } from '../utils/apiHelpers';
import { isNetworkError, isTimeoutError } from '../utils/apiError';

interface UseEvidenceUploadOptions {
  role: EvidenceRole;
  visitId?: number | string;
  listParams?: EvidenceListParams;
  onSuccess?: () => void;
}

export function useEvidenceUpload({ role, visitId, listParams, onSuccess }: UseEvidenceUploadOptions) {
  const [loadingList, setLoadingList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setError(null);

    try {
      const data = await getEvidence(role, { ...listParams, visitId });
      const items = extractList(data as ApiRecord, ['evidence', 'evidence_uploads', 'data']);

      setUploadedCount(items.length);
    } catch (err) {
      setUploadedCount(0);
      setError(getApiErrorMessage(err, 'Unable to load evidence.'));
    } finally {
      setLoadingList(false);
    }
  }, [listParams, role, visitId]);

  const submitEvidence = useCallback(
    async (
      file: LiveCapturedEvidence | { uri: string; name: string; type: string },
      payload: EvidenceUploadPayload,
    ): Promise<boolean> => {
      if (role === 'field_officer' && visitId == null) {
        setError('Visit ID is missing. Please reopen this visit and try again.');
        return false;
      }

      if (categoryRequiresGps(payload.evidence_category, role)) {
        const hasGps =
          ('latitude' in file && file.latitude != null && file.longitude != null) ||
          (payload.latitude != null && payload.longitude != null);

        if (!hasGps) {
          setError('GPS is required for this evidence type.');
          return false;
        }
      }

      setUploading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const formData = buildEvidenceFormData(file, payload, role);
        let lastError: unknown;

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await uploadEvidence(role, formData, visitId);
            setSuccessMessage('Evidence uploaded successfully.');
            await refreshList();
            onSuccess?.();
            return true;
          } catch (err) {
            lastError = err;
            if (attempt === 0 && (isTimeoutError(err) || isNetworkError(err))) {
              continue;
            }
            break;
          }
        }

        setError(getApiErrorMessage(lastError, 'Evidence upload failed. Tap Retry Upload without recapturing.'));
        return false;
      } finally {
        setUploading(false);
      }
    },
    [onSuccess, refreshList, role, visitId],
  );

  const showSuccessAlert = useCallback((message = 'Evidence uploaded successfully.') => {
    Alert.alert('Success', message);
  }, []);

  return {
    loadingList,
    uploading,
    uploadedCount,
    error,
    successMessage,
    setError,
    refreshList,
    submitEvidence,
    showSuccessAlert,
  };
}
