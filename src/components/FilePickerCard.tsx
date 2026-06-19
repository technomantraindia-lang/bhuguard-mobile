import { LiveEvidenceCaptureCard } from './evidence/LiveEvidenceCaptureCard';
import { useLiveEvidenceCapture } from '../hooks/useLiveEvidenceCapture';
import type { LiveCapturedEvidence } from '../utils/liveEvidenceCapture';

interface FilePickerCardProps {
  title?: string;
  subtitle?: string;
  evidence?: LiveCapturedEvidence | null;
  capturing?: boolean;
  uploading?: boolean;
  error?: string | null;
  onOpenCamera?: () => void;
  onRetake?: () => void;
  onUpload?: () => void;
  uploadLabel?: string;
  showUploadButton?: boolean;
  /** @deprecated Use onOpenCamera — kept for legacy call sites. */
  onPick?: () => void;
  /** @deprecated Gallery/file picking is disabled for evidence. */
  pickLabel?: string;
  fileName?: string;
  fileSize?: string;
  onRemove?: () => void;
}

/** Camera-only evidence capture card. Gallery and file picker uploads are not supported. */
export function FilePickerCard({
  evidence = null,
  capturing = false,
  uploading = false,
  error = null,
  onOpenCamera,
  onRetake,
  onUpload,
  uploadLabel,
  showUploadButton,
  onPick,
}: FilePickerCardProps) {
  return (
    <LiveEvidenceCaptureCard
      evidence={evidence}
      capturing={capturing}
      uploading={uploading}
      error={error}
      onOpenCamera={onOpenCamera ?? onPick ?? (() => undefined)}
      onRetake={onRetake ?? onOpenCamera ?? onPick ?? (() => undefined)}
      onUpload={onUpload}
      uploadLabel={uploadLabel}
      showUploadButton={showUploadButton}
    />
  );
}

export function useFilePickerEvidence(defaultName?: string) {
  return useLiveEvidenceCapture({ defaultName });
}
