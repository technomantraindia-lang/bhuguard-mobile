import { useCallback, useState } from 'react';

import {
  captureLivePhotoEvidence,
  pickStampedPhotoEvidence,
  type LiveCapturedEvidence,
} from '../utils/liveEvidenceCapture';

interface UseLiveEvidenceCaptureOptions {
  defaultName?: string;
  allowsEditing?: boolean;
}

export function useLiveEvidenceCapture(options?: UseLiveEvidenceCaptureOptions) {
  const [evidence, setEvidence] = useState<LiveCapturedEvidence | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureEvidence = useCallback(async (): Promise<LiveCapturedEvidence | null> => {
    setCapturing(true);
    setError(null);

    try {
      const result = await captureLivePhotoEvidence({
        defaultName: options?.defaultName,
        allowsEditing: options?.allowsEditing,
      });

      if (result.ok) {
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
  }, [options?.allowsEditing, options?.defaultName]);

  const retakeEvidence = useCallback(async (): Promise<LiveCapturedEvidence | null> => {
    return captureEvidence();
  }, [captureEvidence]);

  const clearEvidence = useCallback(() => {
    setEvidence(null);
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
  }, [options?.allowsEditing, options?.defaultName]);

  return {
    evidence,
    capturing,
    error,
    setError,
    setEvidence,
    captureEvidence,
    retakeEvidence,
    pickGalleryEvidence,
    clearEvidence,
    gpsCaptured: evidence?.latitude != null && evidence?.longitude != null,
  };
}
