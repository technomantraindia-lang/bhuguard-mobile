import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface FeedstockVerificationModalsProps {
  draftSavedVisible: boolean;
  successVisible: boolean;
  rejectConfirmVisible: boolean;
  verificationCode: string;
  farmerName: string;
  statusLabel: string;
  verificationDateLabel: string;
  onCloseDraftSaved: () => void;
  onCloseSuccess: () => void;
  onViewNextVerification: () => void;
  onGoDashboard: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
}

export function FeedstockVerificationModals({
  draftSavedVisible,
  successVisible,
  rejectConfirmVisible,
  verificationCode,
  farmerName,
  statusLabel,
  verificationDateLabel,
  onCloseDraftSaved,
  onCloseSuccess,
  onViewNextVerification,
  onGoDashboard,
  onConfirmReject,
  onCancelReject,
}: FeedstockVerificationModalsProps) {
  return (
    <>
      <Modal visible={draftSavedVisible} transparent animationType="fade" onRequestClose={onCloseDraftSaved}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="assignment_turned_in" size={36} color={officerTheme.primaryContainer} />
            <Text style={styles.title}>Draft Saved</Text>
            <Text style={styles.copy}>Your feedstock verification draft has been saved.</Text>
            <Pressable style={styles.primaryButton} onPress={onCloseDraftSaved}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={onCloseSuccess}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="verified" size={40} color={officerTheme.primaryContainer} filled />
            <Text style={styles.title}>Feedstock Verification Completed</Text>
            <Text style={styles.copy}>Feedstock collection record has been successfully verified.</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Verification ID</Text>
              <Text style={styles.summaryValue}>{verificationCode}</Text>
              <Text style={styles.summaryLabel}>Farmer Name</Text>
              <Text style={styles.summaryValue}>{farmerName}</Text>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{statusLabel}</Text>
              <Text style={styles.summaryLabel}>Verification Date</Text>
              <Text style={styles.summaryValue}>{verificationDateLabel}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={onViewNextVerification}>
              <Text style={styles.primaryButtonText}>View Next Verification</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onGoDashboard}>
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectConfirmVisible} transparent animationType="fade" onRequestClose={onCancelReject}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <Text style={styles.title}>Reject Record?</Text>
            <Text style={styles.copy}>This will mark the feedstock collection as rejected. Continue?</Text>
            <Pressable style={[styles.primaryButton, styles.rejectButton]} onPress={onConfirmReject}>
              <Text style={styles.primaryButtonText}>Reject Record</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onCancelReject}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
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
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: officerTheme.onSurface, textAlign: 'center' },
  copy: { fontSize: 15, lineHeight: 22, color: officerTheme.onSurfaceVariant, textAlign: 'center' },
  summaryBox: {
    width: '100%',
    backgroundColor: officerTheme.surfaceContainer,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: officerTheme.outline },
  summaryValue: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface, marginBottom: 6 },
  primaryButton: {
    width: '100%',
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectButton: { backgroundColor: officerTheme.error },
  primaryButtonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 15 },
  secondaryButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { color: officerTheme.primaryContainer, fontWeight: '700', fontSize: 14 },
});
