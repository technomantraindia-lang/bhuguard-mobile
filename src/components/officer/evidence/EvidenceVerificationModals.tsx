import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

interface EvidenceVerificationModalsProps {
  draftSavedVisible: boolean;
  successVisible: boolean;
  rejectConfirmVisible: boolean;
  downloadSuccessVisible: boolean;
  rejectionSheetVisible: boolean;
  rejectionTargetLabel: string;
  verificationCode: string;
  visitId: string;
  farmerName: string;
  onCloseDraftSaved: () => void;
  onProceedDigitalSignature: () => void;
  onBackToVisits: () => void;
  onConfirmReject: () => void;
  onCancelReject: () => void;
  onCloseDownloadSuccess: () => void;
  onCloseRejectionSheet: () => void;
  onConfirmRejectionSheet: (reason: string) => void;
  rejectionReason: string;
  onRejectionReasonChange: (text: string) => void;
}

export function EvidenceVerificationModals({
  draftSavedVisible,
  successVisible,
  rejectConfirmVisible,
  downloadSuccessVisible,
  rejectionSheetVisible,
  rejectionTargetLabel,
  verificationCode,
  visitId,
  farmerName,
  onCloseDraftSaved,
  onProceedDigitalSignature,
  onBackToVisits,
  onConfirmReject,
  onCancelReject,
  onCloseDownloadSuccess,
  onCloseRejectionSheet,
  onConfirmRejectionSheet,
  rejectionReason,
  onRejectionReasonChange,
}: EvidenceVerificationModalsProps) {
  return (
    <>
      <Modal visible={draftSavedVisible} transparent animationType="fade" onRequestClose={onCloseDraftSaved}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="assignment_turned_in" size={36} color={officerTheme.primaryContainer} />
            <Text style={styles.title}>Draft Saved</Text>
            <Text style={styles.copy}>Evidence verification draft saved successfully.</Text>
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
            <Text style={styles.copy}>Document download has started.</Text>
            <Pressable style={styles.primaryButton} onPress={onCloseDownloadSuccess}>
              <Text style={styles.primaryButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={successVisible} transparent animationType="fade" onRequestClose={onBackToVisits}>
        <View style={styles.overlay}>
          <View style={[styles.card, officerCardShadow]}>
            <BhuguardMaterialIcon name="verified" size={40} color={officerTheme.primaryContainer} filled />
            <Text style={styles.title}>Evidence Verification Completed</Text>
            <Text style={styles.copy}>All evidence records have been reviewed successfully.</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Verification ID</Text>
              <Text style={styles.summaryValue}>{verificationCode}</Text>
              <Text style={styles.summaryLabel}>Visit ID</Text>
              <Text style={styles.summaryValue}>{visitId}</Text>
              <Text style={styles.summaryLabel}>Farmer Name</Text>
              <Text style={styles.summaryValue}>{farmerName}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={onProceedDigitalSignature}>
              <Text style={styles.primaryButtonText}>Proceed to Digital Signature</Text>
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
            <Text style={styles.title}>Reject Evidence?</Text>
            <Text style={styles.copy}>This will mark the evidence verification as rejected. Add a rejection reason before confirming.</Text>
            <Pressable style={[styles.primaryButton, styles.rejectButton]} onPress={onConfirmReject}>
              <Text style={styles.primaryButtonText}>Reject Evidence</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onCancelReject}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={rejectionSheetVisible} transparent animationType="slide" onRequestClose={onCloseRejectionSheet}>
        <Pressable style={styles.sheetOverlay} onPress={onCloseRejectionSheet}>
          <Pressable style={[styles.sheet, officerCardShadow]} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.title}>Rejection Reason</Text>
            <Text style={styles.copy}>Add a reason for rejecting {rejectionTargetLabel}.</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={onRejectionReasonChange}
              style={styles.inputWrap}
              multiline
              placeholder="Enter rejection reason…"
              placeholderTextColor={officerTheme.outline}
            />
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                onConfirmRejectionSheet(rejectionReason);
              }}
            >
              <Text style={styles.primaryButtonText}>Confirm Rejection</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onCloseRejectionSheet}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(20, 27, 43, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(20, 27, 43, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: officerTheme.surfaceLowest, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  card: { width: '100%', maxWidth: 340, backgroundColor: officerTheme.surfaceLowest, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: officerTheme.headingGreen, textAlign: 'center' },
  copy: { fontSize: 14, lineHeight: 20, color: officerTheme.onSurfaceVariant, textAlign: 'center' },
  summaryBox: { width: '100%', backgroundColor: officerTheme.surfaceLow, borderRadius: 12, padding: 12, gap: 4 },
  summaryLabel: { fontSize: 12, color: officerTheme.outline, fontWeight: '600', marginTop: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface },
  primaryButton: { width: '100%', backgroundColor: officerTheme.primaryContainer, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: officerTheme.onPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondaryButton: { width: '100%', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { color: officerTheme.primary, fontSize: 14, fontWeight: '700' },
  rejectButton: { backgroundColor: officerTheme.error },
  inputWrap: { width: '100%', borderWidth: 1, borderColor: officerTheme.outlineVariant, borderRadius: 12, padding: 12, minHeight: 80, color: officerTheme.onSurface, textAlignVertical: 'top' },
});
