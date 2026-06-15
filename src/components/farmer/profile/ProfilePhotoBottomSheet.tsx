import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface ProfilePhotoBottomSheetProps {
  visible: boolean;
  hasPhoto: boolean;
  onTakePhoto: () => void;
  onChooseGallery: () => void;
  onRemovePhoto: () => void;
  onClose: () => void;
}

export function ProfilePhotoBottomSheet({
  visible,
  hasPhoto,
  onTakePhoto,
  onChooseGallery,
  onRemovePhoto,
  onClose,
}: ProfilePhotoBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Choose Photo</Text>

          <SheetOption icon="photo_camera" label="Take Photo" onPress={onTakePhoto} />
          <SheetOption icon="landscape" label="Choose from Gallery" onPress={onChooseGallery} />
          {hasPhoto ? (
            <SheetOption icon="cloud_off" label="Remove Current Photo" onPress={onRemovePhoto} danger />
          ) : null}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function SheetOption({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: 'photo_camera' | 'landscape' | 'cloud_off';
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.option, pressed && styles.pressed]} onPress={onPress}>
      <BhuguardMaterialIcon name={icon} size={20} color={danger ? dashboardTheme.error : dashboardTheme.primary} />
      <Text style={[styles.optionText, danger && styles.optionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 8,
    paddingBottom: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.background,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  optionTextDanger: {
    color: dashboardTheme.error,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
