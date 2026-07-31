import {
  ArtisanLiveEvidenceCameraModal,
  type ArtisanLiveCameraCapture,
} from './ArtisanLiveEvidenceCameraModal';

interface EndProcessLiveCameraModalProps {
  visible: boolean;
  onCancel: () => void;
  onCaptured: (uri: string) => void;
}

/** @deprecated Prefer ArtisanLiveEvidenceCameraModal — kept for compatibility. */
export function EndProcessLiveCameraModal({
  visible,
  onCancel,
  onCaptured,
}: EndProcessLiveCameraModalProps) {
  return (
    <ArtisanLiveEvidenceCameraModal
      visible={visible}
      title="End-Process Image"
      onCancel={onCancel}
      onCaptured={(capture: ArtisanLiveCameraCapture) => onCaptured(capture.uri)}
    />
  );
}
