import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { BhuguardLogo } from '../shared/BhuguardLogo';
import { LOGO_SIZES } from '../../constants/branding';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';

interface FarmerReportDownloadModalProps {
  visible: boolean;
  variant: 'single' | 'bulk';
  reportTitle?: string;
  downloadCount?: number;
  onClose: () => void;
}

export function FarmerReportDownloadModal({
  visible,
  variant,
  reportTitle,
  downloadCount = 0,
  onClose,
}: FarmerReportDownloadModalProps) {
  const isBulk = variant === 'bulk';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, dashboardShadow]}>
          <BhuguardLogo size={LOGO_SIZES.modal} animation={visible ? 'bounce' : 'none'} />

          <Text style={styles.title}>{isBulk ? 'Bulk Download Started' : 'Download Successful'}</Text>

          <Text style={styles.message}>
            {isBulk
              ? `${downloadCount} report${downloadCount === 1 ? '' : 's'} queued for download. You will be notified when files are ready.`
              : `${reportTitle ?? 'Report'} PDF is ready. Use the share sheet to save it to your device or open in a PDF app.`}
          </Text>

          <View style={styles.hintRow}>
            <BhuguardMaterialIcon name="assignment" size={16} color={dashboardTheme.primary} />
            <Text style={styles.hint}>Official verification documents are stored securely.</Text>
          </View>

          <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onClose}>
            <Text style={styles.buttonText}>Ok</Text>
          </Pressable>
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
    marginBottom: 4,
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
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: dashboardTheme.surfaceContainerLow,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
  },
  hint: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: dashboardTheme.onSurfaceVariant,
  },
  button: {
    marginTop: 8,
    width: '100%',
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
