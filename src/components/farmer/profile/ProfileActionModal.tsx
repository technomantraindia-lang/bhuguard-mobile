import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { BhuguardLogo } from '../../shared/BhuguardLogo';
import { LOGO_SIZES } from '../../../constants/branding';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

type ProfileModalVariant = 'success' | 'confirm-logout' | 'confirm-delete';

interface ProfileActionModalProps {
  visible: boolean;
  variant: ProfileModalVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}

export function ProfileActionModal({
  visible,
  variant,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onClose,
}: ProfileActionModalProps) {
  const isConfirm = variant !== 'success';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, dashboardShadow]}>
          {variant === 'success' ? (
            <BhuguardLogo size={LOGO_SIZES.modal} animation="bounce" />
          ) : (
            <View style={[styles.iconWrap, styles.iconWrapDanger]}>
              <BhuguardMaterialIcon name="pending_actions" size={28} color={dashboardTheme.error} />
            </View>
          )}

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {isConfirm ? (
            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, variant === 'confirm-delete' && styles.dangerButton]}
                onPress={onConfirm}
              >
                <Text style={styles.primaryButtonText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.primaryButton} onPress={onClose}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 27, 43, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: dashboardTheme.errorContainer,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: dashboardTheme.error,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
});
