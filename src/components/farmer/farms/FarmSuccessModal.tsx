import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../../../constants/branding';
import { BhuguardLogo } from '../../shared/BhuguardLogo';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FarmSuccessModalProps {
  visible: boolean;
  message?: string;
  onClose: () => void;
}

export function FarmSuccessModal({
  visible,
  message = 'Farm added successfully',
  onClose,
}: FarmSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, dashboardShadow]}>
          <BhuguardLogo size={LOGO_SIZES.modal} animation={visible ? 'bounce' : 'none'} />

          <Text style={styles.title}>Success</Text>
          <Text style={styles.message}>{message}</Text>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.textMuted,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    width: '100%',
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
});
