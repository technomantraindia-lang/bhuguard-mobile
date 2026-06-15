import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { LOGO_SIZES } from '../constants/branding';
import { colors, shadows, spacing } from '../theme';
import { AppButton } from './AppButton';
import { BhuguardLogo } from './shared/BhuguardLogo';
import { StatusBadge } from './StatusBadge';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function SuccessModal({ visible, title, message, onClose }: SuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, shadows.elevated]} onPress={(e) => e.stopPropagation()}>
          <BhuguardLogo size={LOGO_SIZES.modal} animation={visible ? 'bounce' : 'none'} />
          <StatusBadge label="Success" tone="success" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <AppButton label="Done" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.screen,
  },
  card: {
    backgroundColor: colors.softGreen,
    borderRadius: 16,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.primaryDark, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textDark, lineHeight: 20, textAlign: 'center' },
});
