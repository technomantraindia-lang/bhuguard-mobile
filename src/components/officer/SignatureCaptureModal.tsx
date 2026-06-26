import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { officerTheme } from '../../theme/officerDashboardTheme';
import {
  captureDrawnSignatureImage,
  captureSignatureImageFromCamera,
  pickSignatureImageFromLibrary,
} from '../../utils/signatureImageCapture';
import { hasSignatureInk, pathFromStroke, type SignaturePoint } from '../../utils/signatureStrokeExport';

interface SignatureCaptureModalProps {
  visible: boolean;
  title: string;
  saving?: boolean;
  onClose: () => void;
  onCaptured: (uri: string) => void;
}

export function SignatureCaptureModal({
  visible,
  title,
  saving = false,
  onClose,
  onCaptured,
}: SignatureCaptureModalProps) {
  const [padSize, setPadSize] = useState({ width: 0, height: 220 });
  const [strokes, setStrokes] = useState<SignaturePoint[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<SignaturePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !saving && !busy,
      onMoveShouldSetPanResponder: () => !saving && !busy,
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentStroke([{ x: locationX, y: locationY }]);
        setError(null);
      },
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setCurrentStroke((previous) => [...previous, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setCurrentStroke((previous) => {
          if (previous.length > 0) {
            setStrokes((existing) => [...existing, previous]);
          }

          return [];
        });
      },
    }),
  ).current;

  const resetPad = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setError(null);
  };

  const handleClose = () => {
    if (saving || busy) {
      return;
    }

    resetPad();
    onClose();
  };

  const handleCapturedUri = (uri: string) => {
    onCaptured(uri);
    resetPad();
  };

  const handleSave = async () => {
    const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;

    if (!hasSignatureInk(allStrokes)) {
      setError('Please sign in the box before saving.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const uri = await captureDrawnSignatureImage(allStrokes, padSize.width, padSize.height);
      handleCapturedUri(uri);
    } catch (captureError) {
      const message =
        captureError instanceof Error
          ? captureError.message
          : 'Unable to save signature image. Please try again.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleUploadFromGallery = async () => {
    setBusy(true);
    setError(null);

    try {
      const uri = await pickSignatureImageFromLibrary();

      if (uri) {
        handleCapturedUri(uri);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Unable to upload signature image. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCaptureFromCamera = async () => {
    setBusy(true);
    setError(null);

    try {
      const uri = await captureSignatureImageFromCamera();

      if (uri) {
        handleCapturedUri(uri);
      }
    } catch (cameraError) {
      setError(
        cameraError instanceof Error
          ? cameraError.message
          : 'Unable to capture signature photo. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const allStrokes = currentStroke.length > 0 ? [...strokes, currentStroke] : strokes;
  const isDisabled = saving || busy;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Sign in the box, or upload / photograph a signature image.</Text>

          <View
            style={styles.padSurface}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;

              if (width > 0 && height > 0) {
                setPadSize({ width, height });
              }
            }}
          >
            <View style={styles.padTouchArea} {...panResponder.panHandlers}>
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                {allStrokes.map((stroke, index) => (
                  <Path
                    key={`stroke-${index}`}
                    d={pathFromStroke(stroke)}
                    stroke={officerTheme.onSurface}
                    strokeWidth={3}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            </View>
          </View>

          <View style={styles.uploadActions}>
            <Pressable
              style={styles.uploadButton}
              onPress={() => void handleUploadFromGallery()}
              disabled={isDisabled}
            >
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </Pressable>
            <Pressable
              style={styles.uploadButton}
              onPress={() => void handleCaptureFromCamera()}
              disabled={isDisabled}
            >
              <Text style={styles.uploadButtonText}>Take Photo</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {isDisabled ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={officerTheme.primary} />
              <Text style={styles.loadingText}>{saving ? 'Uploading signature...' : 'Processing signature...'}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={resetPad} disabled={isDisabled}>
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={handleClose} disabled={isDisabled}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, isDisabled && styles.primaryButtonDisabled]}
              onPress={() => void handleSave()}
              disabled={isDisabled}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Signature'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: officerTheme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  subtitle: {
    fontSize: 13,
    color: officerTheme.outline,
  },
  padSurface: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    overflow: 'hidden',
  },
  padTouchArea: {
    height: 220,
    backgroundColor: '#fff',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8faf7',
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.primary,
  },
  errorText: {
    fontSize: 13,
    color: officerTheme.error,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: officerTheme.outline,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  primaryButton: {
    flex: 1.4,
    backgroundColor: officerTheme.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onPrimary,
  },
});
