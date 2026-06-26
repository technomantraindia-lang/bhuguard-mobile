import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface FeedstockVerificationModalsProps {
  draftSavedVisible: boolean;
  successVisible: boolean;
  rejectConfirmVisible: boolean;
  downloadSuccessVisible: boolean;
  verificationCode: string;
  feedstockCode: string;
  farmerName: string;
  quantityLabel: string;
  statusLabel: string;
  onCloseDraftSaved: () => void;
  onCloseSuccess: () => void;
  onProceedBiocharApplication: () => void;
  onBackToVisits: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
  onCloseDownloadSuccess: () => void;
}

export function FeedstockVerificationModals({
  draftSavedVisible,
  successVisible,
  rejectConfirmVisible,
  downloadSuccessVisible,
  verificationCode,
  feedstockCode,
  farmerName,
  quantityLabel,
  statusLabel,
  onCloseDraftSaved,
  onCloseSuccess,
  onProceedBiocharApplication,
  onBackToVisits,
  onConfirmReject,
  onCancelReject,
  onCloseDownloadSuccess,
}: FeedstockVerificationModalsProps) {
  return (
    <>
      <Modal visible={draftSavedVisible} transparent animationType="fade" onRequestClose={onCloseDraftSaved}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="assignment_turned_in" size={36} color={officerTheme.primaryContainer} />
            <Text style={styles.title}>Draft Saved</Text>
            <Text style={styles.copy}>Your feedstock verification draft has been saved successfully.</Text>
            <Pressable style={styles.primaryButton} onPress={onCloseDraftSaved}>
              <Text style={styles.primaryButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={downloadSuccessVisible} transparent animationType="fade" onRequestClose={onCloseDownloadSuccess}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="description" size={36} color={officerTheme.primaryContainer} />
            <Text style={styles.title}>Download Started</Text>
            <Text style={styles.copy}>Weight slip download has started.</Text>
            <Pressable style={styles.primaryButton} onPress={onCloseDownloadSuccess}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={onCloseSuccess}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="verified" size={40} color={officerTheme.primaryContainer} filled />
            <Text style={styles.title}>Feedstock Verification Completed</Text>
            <Text style={styles.copy}>Feedstock collection has been successfully verified.</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Verification ID</Text>
              <Text style={styles.summaryValue}>{verificationCode}</Text>
              <Text style={styles.summaryLabel}>Feedstock Record ID</Text>
              <Text style={styles.summaryValue}>{feedstockCode}</Text>
              <Text style={styles.summaryLabel}>Farmer Name</Text>
              <Text style={styles.summaryValue}>{farmerName}</Text>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <Text style={styles.summaryValue}>{quantityLabel}</Text>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{statusLabel}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={onProceedBiocharApplication}>
              <Text style={styles.primaryButtonText}>Proceed to Biochar Application Verification</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onBackToVisits}>
              <Text style={styles.secondaryButtonText}>Back to Visits</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectConfirmVisible} transparent animationType="fade" onRequestClose={onCancelReject}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <Text style={styles.title}>Reject Record?</Text>
            <Text style={styles.copy}>
              This will mark the feedstock collection as rejected. Add a rejection reason before confirming.
            </Text>
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
