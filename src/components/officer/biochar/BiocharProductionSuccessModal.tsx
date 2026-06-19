import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface BiocharProductionSuccessModalProps {
  visible: boolean;
  batchCode: string;
  onClose: () => void;
  onBackToVisits: () => void;
}

export function BiocharProductionSuccessModal({
  visible,
  batchCode,
  onClose,
  onBackToVisits,
}: BiocharProductionSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <BhuguardMaterialIcon name="verified" size={36} color={officerTheme.primaryContainer} />
          </View>
          <Text style={styles.title}>Record Submitted</Text>
          <Text style={styles.message}>
            Biochar Production Batch <Text style={styles.batchCode}>{batchCode}</Text> has been successfully submitted
            for review.
          </Text>
          <Pressable style={styles.button} onPress={onBackToVisits}>
            <Text style={styles.buttonText}>Back to Assigned Visits</Text>
          </Pressable>
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
  title: { fontSize: 20, fontWeight: '700', color: officerTheme.onSurface, marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 22, color: officerTheme.onSurfaceVariant, textAlign: 'center', marginBottom: 16 },
  batchCode: { fontWeight: '700', color: officerTheme.primary },
  button: {
    width: '100%',
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: officerTheme.onPrimary, fontSize: 15, fontWeight: '700' },
});
