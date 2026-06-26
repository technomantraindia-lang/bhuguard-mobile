import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface MrvVerificationChecklistModalsProps {
  draftSavedVisible: boolean;
  successVisible: boolean;
  rejectConfirmVisible: boolean;
  verificationId: string;
  onCloseDraftSaved: () => void;
  onCloseSuccess: () => void;
  onGenerateReport: () => void;
  onGoDashboard: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
}

export function MrvVerificationChecklistModals({
  draftSavedVisible,
  successVisible,
  rejectConfirmVisible,
  verificationId,
  onCloseDraftSaved,
  onCloseSuccess,
  onGenerateReport,
  onGoDashboard,
  onConfirmReject,
  onCancelReject,
}: MrvVerificationChecklistModalsProps) {
  return (
    <>
      <Modal visible={draftSavedVisible} transparent animationType="fade" onRequestClose={onCloseDraftSaved}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="assignment_turned_in" size={36} color={officerTheme.primaryContainer} />
            <Text style={styles.title}>Draft Saved</Text>
            <Text style={styles.copy}>Verification checklist draft saved successfully.</Text>
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
            <Text style={styles.title}>Verification Completed</Text>
            <Text style={styles.copy}>Verification checklist completed successfully.</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Verification ID</Text>
              <Text style={styles.summaryValue}>{verificationId}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={onGenerateReport}>
              <Text style={styles.primaryButtonText}>Generate Report</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onGoDashboard}>
              <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectConfirmVisible} transparent animationType="fade" onRequestClose={onCancelReject}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="lock" size={36} color={officerTheme.error} />
            <Text style={styles.title}>Reject Verification?</Text>
            <Text style={styles.copy}>
              This will mark the verification as rejected. You can add final remarks before confirming.
            </Text>
            <Pressable style={[styles.primaryButton, styles.rejectButton]} onPress={onConfirmReject}>
              <Text style={styles.primaryButtonText}>Reject Verification</Text>
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
    maxWidth: 340,
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.headingGreen,
    textAlign: 'center',
  },
  copy: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  summaryBox: {
    width: '100%',
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: officerTheme.outline,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: officerTheme.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: officerTheme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: officerTheme.error,
  },
});
