import { useCallback, useState } from 'react';

import {
  captureLivePhotoEvidence,
  pickStampedPhotoEvidence,
  refreshEvidenceGeocode,
  type LiveCapturedEvidence,
} from '../utils/liveEvidenceCapture';

interface UseLiveEvidenceCaptureOptions {
  defaultName?: string;
  allowsEditing?: boolean;
  /** When true, capture lands in pending until confirmPending / rejectPending. */
  requireConfirm?: boolean;
}

export function useLiveEvidenceCapture(options?: UseLiveEvidenceCaptureOptions) {
  const [evidence, setEvidence] = useState<LiveCapturedEvidence | null>(null);
  const [pendingEvidence, setPendingEvidence] = useState<LiveCapturedEvidence | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requireConfirm = options?.requireConfirm === true;

  const captureEvidence = useCallback(async (): Promise<LiveCapturedEvidence | null> => {
    setCapturing(true);
    setError(null);

    try {
      const result = await captureLivePhotoEvidence({
        defaultName: options?.defaultName,
        allowsEditing: options?.allowsEditing,
      });

      if (result.ok) {
        if (requireConfirm) {
          setPendingEvidence(result.evidence);
          return null;
        }
        setEvidence(result.evidence);
        return result.evidence;
      }

      if (!result.cancelled && result.error) {
        setError(result.error);
      }

      return null;
    } finally {
      setCapturing(false);
    }
  }, [options?.allowsEditing, options?.defaultName, requireConfirm]);

  const retakeEvidence = useCallback(async (): Promise<LiveCapturedEvidence | null> => {
    setPendingEvidence(null);
    return captureEvidence();
  }, [captureEvidence]);

  const retryGeocode = useCallback(async (): Promise<LiveCapturedEvidence | null> => {
    const current = pendingEvidence ?? evidence;

    if (!current) {
      setError('Capture a photo with GPS before retrying location.');
      return null;
    }

    setCapturing(true);
    setError(null);

    try {
      const result = await refreshEvidenceGeocode(current);

      if (!result.ok) {
        if (result.error) {
          setError(result.error);
        }
        return null;
      }

      if (pendingEvidence) {
        setPendingEvidence(result.evidence);
      } else {
        setEvidence(result.evidence);
      }

      return result.evidence;
    } finally {
      setCapturing(false);
    }
  }, [evidence, pendingEvidence]);

  const confirmPending = useCallback(() => {
    if (!pendingEvidence) {
      return null;
    }
    setEvidence(pendingEvidence);
    setPendingEvidence(null);
    return pendingEvidence;
  }, [pendingEvidence]);

  const rejectPending = useCallback(() => {
    setPendingEvidence(null);
  }, []);

  const clearEvidence = useCallback(() => {
    setEvidence(null);
    setPendingEvidence(null);
    setError(null);
  }, []);

  const pickGalleryEvidence = useCallback(async (): Promise<LiveCapturedEvidence | null> => {
    setCapturing(true);
    setError(null);

    try {
      const result = await pickStampedPhotoEvidence({
        defaultName: options?.defaultName,
        allowsEditing: options?.allowsEditing,
      });

      if (result.ok) {
        if (requireConfirm) {
          setPendingEvidence(result.evidence);
          return null;
        }
        setEvidence(result.evidence);
        return result.evidence;
      }

      if (!result.cancelled && result.error) {
        setError(result.error);
      }

      return null;
    } finally {
      setCapturing(false);
    }
  }, [options?.allowsEditing, options?.defaultName, requireConfirm]);

  return {
    evidence,
    pendingEvidence,
    capturing,
    error,
    setError,
    setEvidence,
    captureEvidence,
    retakeEvidence,
    retryGeocode,
    confirmPending,
    rejectPending,
    pickGalleryEvidence,
    clearEvidence,
    gpsCaptured: evidence?.latitude != null && evidence?.longitude != null,
  };
}
