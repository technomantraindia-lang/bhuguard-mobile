import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

interface FeedstockCollectionSuccessModalProps {
  visible: boolean;
  recordCode: string;
  onDone: () => void;
}

export function FeedstockCollectionSuccessModal({
  visible,
  recordCode,
  onDone,
}: FeedstockCollectionSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={[styles.card, dashboardShadow]}>
          <View style={styles.iconWrap}>
            <View style={styles.iconRingOuter} />
            <View style={styles.iconRingInner} />
            <BhuguardMaterialIcon name="verified" size={40} color={dashboardTheme.primaryContainer} filled />
          </View>

          <Text style={styles.title}>Collection Submitted!</Text>
          <Text style={styles.copy}>
            Your feedstock collection data has been securely saved to the Bhuguard ledger.
          </Text>

          <View style={styles.recordBox}>
            <Text style={styles.recordLabel}>Record ID</Text>
            <Text style={styles.recordCode}>{recordCode}</Text>
          </View>

          <Pressable style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]} onPress={onDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(41, 48, 64, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: dashboardTheme.surfaceLowest,
  },
  iconRingOuter: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: `${dashboardTheme.primaryContainer}33`,
  },
  iconRingInner: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: `${dashboardTheme.primaryContainer}1A`,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    marginBottom: 8,
    textAlign: 'center',
  },
  copy: {
    fontSize: 16,
    lineHeight: 24,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
  },
  recordBox: {
    width: '100%',
    backgroundColor: dashboardTheme.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${dashboardTheme.outlineVariant}4D`,
    marginBottom: 32,
    gap: 4,
  },
  recordLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.outline,
  },
  recordCode: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
    letterSpacing: 1,
  },
  doneButton: {
    width: '100%',
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: dashboardTheme.onPrimary,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
