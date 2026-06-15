import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useProfilePhotoDisplay } from '../../../hooks/useProfilePhotoDisplay';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfilePhotoPreviewModalProps {
  visible: boolean;
  photoUri: string | null;
  onClose: () => void;
}

export function ProfilePhotoPreviewModal({ visible, photoUri, onClose }: ProfilePhotoPreviewModalProps) {
  const displayUri = useProfilePhotoDisplay(photoUri);

  if (!photoUri || !visible) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.closeArea} onPress={onClose}>
          <View style={styles.card}>
            {displayUri ? (
              <Image key={displayUri} source={{ uri: displayUri }} style={styles.image} resizeMode="contain" />
            ) : (
              <View style={styles.loadingFrame}>
                <ActivityIndicator size="large" color={dashboardTheme.primaryContainer} />
              </View>
            )}
            <Text style={styles.caption}>Profile Photo Preview</Text>
          </View>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  closeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  image: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  loadingFrame: {
    width: '100%',
    height: 320,
    borderRadius: 12,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
});
