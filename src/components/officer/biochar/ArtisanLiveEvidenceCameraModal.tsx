import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { artisanTheme } from '../../../theme/artisanTheme';
import { getServerSyncedEpochMs } from '../../../services/serverTimeSync';

export interface ArtisanLiveCameraCapture {
  uri: string;
  /** Epoch ms at shutter — authoritative captured_at for this evidence. */
  shutterEpochMs: number;
}

interface ArtisanLiveEvidenceCameraModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onCaptured: (capture: ArtisanLiveCameraCapture) => void;
}

interface PendingCapture {
  uri: string;
  shutterEpochMs: number;
}

/**
 * Full-screen in-app camera for Artisan Biochar Production live evidence.
 * Shutter → preview with OK / Retry (no crop — the frame is used as-is).
 */
export function ArtisanLiveEvidenceCameraModal({
  visible,
  title,
  onCancel,
  onCaptured,
}: ArtisanLiveEvidenceCameraModalProps) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [pendingCapture, setPendingCapture] = useState<PendingCapture | null>(null);

  const takePicture = async () => {
    if (capturing) {
      return;
    }

    setCapturing(true);
    const shutterEpochMs = getServerSyncedEpochMs();

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        return;
      }

      setPendingCapture({ uri: photo.uri, shutterEpochMs });
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => {
    setPendingCapture(null);
  };

  const confirmCapture = () => {
    if (!pendingCapture) {
      return;
    }
    onCaptured(pendingCapture);
    setPendingCapture(null);
  };

  const handleCancel = () => {
    setPendingCapture(null);
    onCancel();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleCancel}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {pendingCapture ? (
          <View style={styles.cameraWrap}>
            <Image source={{ uri: pendingCapture.uri }} style={styles.camera} resizeMode="cover" />
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleCancel}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </Pressable>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.closeButtonSpacer} />
            </View>
            <View style={styles.previewBottomBar}>
              <Pressable style={styles.retryButton} onPress={retake}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
              <Pressable style={styles.okButton} onPress={confirmCapture}>
                <Text style={styles.okButtonText}>OK — Use Photo</Text>
              </Pressable>
            </View>
          </View>
        ) : !cameraPermission ? (
          <View style={styles.centered}>
            <ActivityIndicator color={artisanTheme.actionGreen} />
            <Text style={styles.permissionText}>Checking camera permission…</Text>
          </View>
        ) : !cameraPermission.granted ? (
          <View style={styles.centered}>
            <Text style={styles.permissionTitle}>Camera permission required</Text>
            <Text style={styles.permissionText}>Allow camera access to capture {title}.</Text>
            <Pressable style={styles.permissionButton} onPress={() => void requestCameraPermission()}>
              <Text style={styles.permissionButtonText}>Enable Camera</Text>
            </Pressable>
            <Pressable style={styles.linkButton} onPress={() => void Linking.openSettings()}>
              <Text style={styles.linkButtonText}>Open Settings</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
            <View style={styles.topBar}>
              <Pressable style={styles.closeButton} onPress={handleCancel} disabled={capturing}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </Pressable>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.closeButtonSpacer} />
            </View>
            <View style={styles.bottomBar}>
              <Text style={styles.hint}>Tap shutter, then confirm with OK</Text>
              <Pressable
                style={[styles.shutterOuter, capturing && styles.shutterDisabled]}
                onPress={() => void takePicture()}
                disabled={capturing}
              >
                <View style={styles.shutterInner}>
                  {capturing ? <ActivityIndicator color="#111827" /> : null}
                </View>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#111827',
  },
  permissionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: '#D1D5DB',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    marginTop: 8,
    backgroundColor: artisanTheme.actionGreen,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  linkButton: {
    padding: 8,
  },
  linkButtonText: {
    color: '#93C5FD',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 8,
    padding: 10,
  },
  cancelButtonText: {
    color: '#F3F4F6',
    fontWeight: '600',
  },
  cameraWrap: {
    flex: 1,
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    minWidth: 72,
    paddingVertical: 8,
  },
  closeButtonSpacer: {
    minWidth: 72,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: 36,
    gap: 16,
  },
  hint: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '500',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  previewBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  retryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 14,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  okButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: artisanTheme.actionGreen,
    paddingVertical: 14,
  },
  okButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
