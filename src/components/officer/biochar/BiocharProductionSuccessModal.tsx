import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface BiocharProductionSuccessModalProps {
  visible: boolean;
  batchCode: string;
  onClose: () => void;
  onAddNewBatch?: () => void;
  onViewSubmitted?: () => void;
  onViewBatchStatus?: () => void;
  onBackToDashboard?: () => void;
  /** @deprecated Use onBackToDashboard */
  onBackToVisits?: () => void;
}

export function BiocharProductionSuccessModal({
  visible,
  batchCode,
  onClose,
  onAddNewBatch,
  onViewSubmitted,
  onViewBatchStatus,
  onBackToDashboard,
  onBackToVisits,
}: BiocharProductionSuccessModalProps) {
  const handleDashboard = onBackToDashboard ?? onBackToVisits ?? onClose;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <BhuguardMaterialIcon name="verified" size={36} color={officerTheme.primaryContainer} />
          </View>
          <Text style={styles.title}>Biochar Production Submitted Successfully</Text>
          <Text style={styles.message}>
            Biochar Production Batch <Text style={styles.batchCode}>{batchCode}</Text> has been submitted for review and is now read-only.
          </Text>
          {onViewSubmitted ? (
            <Pressable style={styles.button} onPress={onViewSubmitted}>
              <Text style={styles.buttonText}>View Submitted Production</Text>
            </Pressable>
          ) : null}
          {onViewBatchStatus ? (
            <Pressable style={styles.secondaryButton} onPress={onViewBatchStatus}>
              <Text style={styles.secondaryButtonText}>View Batch Status</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.secondaryButton} onPress={handleDashboard}>
            <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
          </Pressable>
          {onAddNewBatch ? (
            <Pressable style={styles.tertiaryButton} onPress={onAddNewBatch}>
              <Text style={styles.tertiaryButtonText}>Add New Batch</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 27, 43, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, color: officerTheme.onSurfaceVariant, textAlign: 'center', marginBottom: 16 },
  batchCode: { fontWeight: '700', color: officerTheme.primary },
  button: {
    width: '100%',
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: officerTheme.onPrimary, fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#EAF7EF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButtonText: { color: officerTheme.primaryContainer, fontSize: 15, fontWeight: '700' },
  tertiaryButton: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  tertiaryButtonText: { color: officerTheme.onSurfaceVariant, fontSize: 14, fontWeight: '600' },
});
