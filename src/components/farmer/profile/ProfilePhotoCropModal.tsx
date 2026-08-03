import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfilePhotoCropModalProps {
  visible: boolean;
  photoUri: string | null;
  loading?: boolean;
  onUpdate: () => void;
  onClose: () => void;
}

export function ProfilePhotoCropModal({
  visible,
  photoUri,
  loading = false,
  onUpdate,
  onClose,
}: ProfilePhotoCropModalProps) {
  if (!photoUri) {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Confirm Profile Photo</Text>
          <Text style={styles.subtitle}>Review your photo, then tap OK to save or Retry to capture again.</Text>

          <View style={styles.previewFrame}>
            <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}
            onPress={onUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={dashboardTheme.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>OK</Text>
            )}
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>Retry</Text>
          </Pressable>
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
  sheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: dashboardTheme.onSurfaceVariant,
  },
  previewFrame: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: dashboardTheme.secondaryContainer,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.7,
  },
});
