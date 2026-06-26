import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface FarmVerificationChecklistModalsProps {
  draftSavedVisible: boolean;
  successVisible: boolean;
  rejectConfirmVisible: boolean;
  verificationId: string;
  farmerName: string;
  farmName: string;
  statusLabel: string;
  onCloseDraftSaved: () => void;
  onProceedFeedstock: () => void;
  onGoDashboard: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
}

export function FarmVerificationChecklistModals({
  draftSavedVisible,
  successVisible,
  rejectConfirmVisible,
  verificationId,
  farmerName,
  farmName,
  statusLabel,
  onCloseDraftSaved,
  onProceedFeedstock,
  onGoDashboard,
  onConfirmReject,
  onCancelReject,
}: FarmVerificationChecklistModalsProps) {
  return (
    <>
      <Modal visible={draftSavedVisible} transparent animationType="fade" onRequestClose={onCloseDraftSaved}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="assignment_turned_in" size={36} color={officerTheme.primaryContainer} />
            <Text style={styles.title}>Draft Saved</Text>
            <Text style={styles.copy}>Farm verification draft saved successfully.</Text>
            <Pressable style={styles.primaryButton} onPress={onCloseDraftSaved}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={onGoDashboard}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="verified" size={40} color={officerTheme.primaryContainer} filled />
            <Text style={styles.title}>Farm Verification Completed</Text>
            <Text style={styles.copy}>Farm details have been successfully verified.</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Verification ID</Text>
              <Text style={styles.summaryValue}>{verificationId}</Text>
              <Text style={styles.summaryLabel}>Farmer Name</Text>
              <Text style={styles.summaryValue}>{farmerName}</Text>
              <Text style={styles.summaryLabel}>Farm Name</Text>
              <Text style={styles.summaryValue}>{farmName}</Text>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{statusLabel}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={onProceedFeedstock}>
              <Text style={styles.primaryButtonText}>Proceed to Feedstock Verification</Text>
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
            <Text style={styles.title}>Reject Farm Verification?</Text>
            <Text style={styles.copy}>
              This will mark the farm verification as rejected. Add final remarks before confirming.
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
    marginTop: 4,
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
    textAlign: 'center',
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
