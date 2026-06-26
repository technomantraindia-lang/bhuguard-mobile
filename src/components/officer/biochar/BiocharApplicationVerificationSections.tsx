import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { VerificationResult } from '../../../constants/feedstockVerificationChecklist';
import {
  BIOCHAR_APPLICATION_PROGRESS_STEPS,
  BIOCHAR_APPLICATION_RESULT_OPTIONS,
  BIOCHAR_AFTER_PHOTO_CHECKLIST,
  BIOCHAR_BATCH_CHECKLIST,
  BIOCHAR_BEFORE_PHOTO_CHECKLIST,
  BIOCHAR_DATE_CHECKLIST,
  BIOCHAR_DURING_PHOTO_CHECKLIST,
  BIOCHAR_PLOT_CHECKLIST,
  BIOCHAR_QUANTITY_CHECKLIST,
  SECTION_RESULT_OPTIONS,
  type BiocharApplicationChecklistItemDef,
  type BiocharPhotoPhase,
  type BiocharSectionState,
  type SectionResult,
} from '../../../constants/biocharApplicationVerificationChecklist';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import {
  isBiocharProgressStepComplete,
  type BiocharApplicationVerificationFormState,
  type BiocharApplicationVerificationViewModel,
} from '../../../utils/biocharApplicationVerificationHelpers';
import { statusBadgeTone } from '../../../utils/mrvVerificationHelpers';
import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ label, statusKey }: { label: string; statusKey: string }) {
  const tone = statusBadgeTone(statusKey);
  const toneStyle =
    tone === 'approved' ? styles.badgeApproved : tone === 'rejected' ? styles.badgeRejected : tone === 'correction' ? styles.badgeCorrection : tone === 'pending' ? styles.badgePending : styles.badgeNeutral;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, onPress, variant = 'secondary' }: { label: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger' }) {
  const buttonStyle = variant === 'primary' ? styles.actionPrimary : variant === 'danger' ? styles.actionDanger : styles.actionSecondary;
  const textStyle = variant === 'primary' || variant === 'danger' ? styles.actionTextLight : styles.actionTextDark;
  return (
    <Pressable style={[styles.actionButton, buttonStyle]} onPress={onPress}>
      <Text style={[styles.actionButtonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

function ChecklistBlock({
  items,
  section,
  onToggle,
  onRemarksChange,
  onResultChange,
  actionButtons,
}: {
  items: BiocharApplicationChecklistItemDef[];
  section: BiocharSectionState;
  onToggle: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onResultChange: (result: SectionResult) => void;
  actionButtons?: ReactNode;
}) {
  return (
    <>
      {items.map((item) => (
        <Pressable key={item.key} style={styles.checklistRow} onPress={() => onToggle(item.key)}>
          <View style={[styles.checkbox, section.items[item.key] && styles.checkboxChecked]}>
            {section.items[item.key] ? <BhuguardMaterialIcon name="verified" size={16} color={officerTheme.onPrimary} filled /> : null}
          </View>
          <Text style={styles.checklistLabel}>{item.label}</Text>
        </Pressable>
      ))}
      <Text style={styles.subheading}>Result</Text>
      <View style={styles.resultRow}>
        {SECTION_RESULT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[
              styles.resultChip,
              section.result === option.value && option.value === 'pass' && styles.resultChipPass,
              section.result === option.value && option.value === 'fail' && styles.resultChipFail,
              section.result === option.value && option.value === 'needs_correction' && styles.resultChipCorrection,
            ]}
            onPress={() => onResultChange(option.value)}
          >
            <Text style={[styles.resultChipText, section.result === option.value && styles.resultChipTextSelected]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
      {actionButtons}
      <Text style={styles.remarksLabel}>Remarks</Text>
      <TextInput value={section.remarks} onChangeText={onRemarksChange} placeholder="Officer remarks" placeholderTextColor={officerTheme.outline} style={styles.remarksInput} multiline />
    </>
  );
}

export function BiocharApplicationTopCard({ data }: { data: BiocharApplicationVerificationViewModel }) {
  return (
    <SectionCard title="Verification Overview">
      <DetailRow label="Visit ID" value={data.visitId} />
      <DetailRow label="Verification ID" value={data.verificationCode} />
      <DetailRow label="Farmer Name" value={data.farmerName} />
      <DetailRow label="Farmer ID" value={data.farmerId} />
      <DetailRow label="Farm Name" value={data.farmName} />
      <DetailRow label="Farm ID" value={data.farmId} />
      <DetailRow label="Project" value={data.projectName} />
      <DetailRow label="Village" value={data.village} />
      <DetailRow label="Taluka" value={data.taluka} />
      <DetailRow label="District" value={data.district} />
      <DetailRow label="Officer Name" value={data.officerName} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Current Status</Text>
        <StatusBadge label={data.statusLabel} statusKey={data.statusKey} />
      </View>
    </SectionCard>
  );
}

export function BiocharSubmittedRecordCard({ data }: { data: BiocharApplicationVerificationViewModel }) {
  return (
    <SectionCard title="Section 1 — Submitted Application Record">
      <DetailRow label="Application Record ID" value={data.applicationRecordId} />
      <DetailRow label="Plot ID" value={data.plotId} />
      <DetailRow label="Batch ID" value={data.batchId} />
      <DetailRow label="Quantity Applied" value={data.quantityAppliedLabel} />
      <DetailRow label="Application Date" value={data.applicationDateLabel} />
      <DetailRow label="Submitted Date" value={data.submittedDateLabel} />
      <DetailRow label="Submitted By" value={data.submittedBy} />
      <DetailRow label="Status" value={data.recordStatusLabel} />
    </SectionCard>
  );
}

export function BiocharPlotVerificationSection(props: {
  section: BiocharSectionState;
  onToggle: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onResultChange: (result: SectionResult) => void;
  onViewPlotMap: () => void;
  onVerifyPlotLocation: () => void;
  plotVerified: boolean;
}) {
  return (
    <SectionCard title="Section 2 — Plot ID Verification">
      <ChecklistBlock
        items={BIOCHAR_PLOT_CHECKLIST}
        section={props.section}
        onToggle={props.onToggle}
        onRemarksChange={props.onRemarksChange}
        onResultChange={props.onResultChange}
        actionButtons={
          <View style={styles.buttonRow}>
            <ActionButton label="View Plot Map" onPress={props.onViewPlotMap} />
            <ActionButton label="Verify Plot Location" onPress={props.onVerifyPlotLocation} variant="primary" />
          </View>
        }
      />
      {props.plotVerified ? <StatusBadge label="Plot Location Verified" statusKey="verified" /> : null}
    </SectionCard>
  );
}

export function BiocharBatchVerificationSection(props: {
  data: BiocharApplicationVerificationViewModel;
  section: BiocharSectionState;
  onToggle: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onResultChange: (result: SectionResult) => void;
  onViewBatchDetails: () => void;
  onVerifyBatch: () => void;
  batchVerified: boolean;
}) {
  return (
    <SectionCard title="Section 3 — Batch ID Verification">
      <DetailRow label="Submitted Batch ID" value={props.data.batchId} />
      <DetailRow label="Batch Production Date" value={props.data.batchProductionDateLabel} />
      <DetailRow label="Batch Source" value={props.data.batchSource} />
      <DetailRow label="Batch Available Quantity" value={props.data.batchAvailableQuantityLabel} />
      <DetailRow label="Batch Status" value={props.data.batchStatusLabel} />
      <ChecklistBlock
        items={BIOCHAR_BATCH_CHECKLIST}
        section={props.section}
        onToggle={props.onToggle}
        onRemarksChange={props.onRemarksChange}
        onResultChange={props.onResultChange}
        actionButtons={
          <View style={styles.buttonRow}>
            <ActionButton label="View Batch Details" onPress={props.onViewBatchDetails} />
            <ActionButton label="Verify Batch" onPress={props.onVerifyBatch} variant="primary" />
          </View>
        }
      />
      {props.batchVerified ? <StatusBadge label="Batch Verified" statusKey="verified" /> : null}
    </SectionCard>
  );
}

export function BiocharQuantityVerificationSection(props: {
  data: BiocharApplicationVerificationViewModel;
  section: BiocharSectionState;
  officerObservedQuantity: string;
  differenceLabel: string;
  remainingLabel: string;
  onObservedQuantityChange: (value: string) => void;
  onToggle: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onResultChange: (result: SectionResult) => void;
}) {
  return (
    <SectionCard title="Section 4 — Quantity Applied Verification">
      <DetailRow label="Submitted Quantity" value={props.data.quantityAppliedLabel} />
      <DetailRow label="Available Batch Quantity" value={props.data.batchAvailableQuantityLabel} />
      <Text style={styles.remarksLabel}>Officer Observed Quantity (Kg)</Text>
      <TextInput value={props.officerObservedQuantity} onChangeText={props.onObservedQuantityChange} keyboardType="decimal-pad" style={styles.singleInput} placeholder="Enter observed quantity" placeholderTextColor={officerTheme.outline} />
      <DetailRow label="Difference" value={props.differenceLabel} />
      <DetailRow label="Remaining Batch Quantity" value={props.remainingLabel} />
      <ChecklistBlock
        items={BIOCHAR_QUANTITY_CHECKLIST}
        section={props.section}
        onToggle={props.onToggle}
        onRemarksChange={props.onRemarksChange}
        onResultChange={props.onResultChange}
      />
    </SectionCard>
  );
}

export function BiocharDateVerificationSection(props: {
  data: BiocharApplicationVerificationViewModel;
  section: BiocharSectionState;
  onToggle: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onResultChange: (result: SectionResult) => void;
}) {
  return (
    <SectionCard title="Section 5 — Application Date Verification">
      <DetailRow label="Farmer Submitted Date" value={props.data.farmerSubmittedDate} />
      <DetailRow label="Evidence Timestamp" value={props.data.evidenceTimestampLabel} />
      <DetailRow label="Officer Verified Date" value={props.data.officerVerifiedDateLabel} />
      <ChecklistBlock
        items={BIOCHAR_DATE_CHECKLIST}
        section={props.section}
        onToggle={props.onToggle}
        onRemarksChange={props.onRemarksChange}
        onResultChange={props.onResultChange}
      />
    </SectionCard>
  );
}

export function BiocharPhotoVerificationSection(props: {
  title: string;
  phase: BiocharPhotoPhase;
  photoUrl: string | null;
  section: BiocharSectionState;
  approved: boolean | null;
  rejectionReason: string;
  checklistItems: BiocharApplicationChecklistItemDef[];
  onToggle: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onResultChange: (result: SectionResult) => void;
  onViewFullscreen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRejectionReasonChange: (text: string) => void;
}) {
  return (
    <SectionCard title={props.title}>
      {props.photoUrl ? <Image source={{ uri: props.photoUrl }} style={styles.photoPreview} resizeMode="cover" /> : <Text style={styles.noPhoto}>No photo uploaded</Text>}
      <ChecklistBlock items={props.checklistItems} section={props.section} onToggle={props.onToggle} onRemarksChange={props.onRemarksChange} onResultChange={props.onResultChange} />
      <View style={styles.buttonRow}>
        <ActionButton label="View Fullscreen" onPress={props.onViewFullscreen} />
        <ActionButton label="Approve Photo" onPress={props.onApprove} variant="primary" />
        <ActionButton label="Reject Photo" onPress={props.onReject} variant="danger" />
      </View>
      {props.approved === false ? (
        <>
          <Text style={styles.remarksLabel}>Rejection Reason</Text>
          <TextInput value={props.rejectionReason} onChangeText={props.onRejectionReasonChange} style={styles.remarksInput} multiline placeholder="Reason for rejecting photo evidence" placeholderTextColor={officerTheme.outline} />
        </>
      ) : null}
      {props.approved === true ? <StatusBadge label="Photo Approved" statusKey="verified" /> : null}
    </SectionCard>
  );
}

export function BiocharAdditionalEvidenceSection(props: {
  inspectionNote: string;
  additionalPhotos: string[];
  onCapturePhoto: () => void;
  onCaptureGps: () => void;
  onUploadDocument: () => void;
  onInspectionNoteChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 9 — Officer Additional Evidence">
      <View style={styles.buttonRow}>
        <ActionButton label="Capture Plot Photo" onPress={props.onCapturePhoto} variant="primary" />
        <ActionButton label="Capture GPS Again" onPress={props.onCaptureGps} />
        <ActionButton label="Upload Document" onPress={props.onUploadDocument} />
      </View>
      <Text style={styles.remarksLabel}>Inspection Note</Text>
      <TextInput value={props.inspectionNote} onChangeText={props.onInspectionNoteChange} style={styles.remarksInput} multiline placeholder="Add inspection note" placeholderTextColor={officerTheme.outline} />
      {props.additionalPhotos.length > 0 ? <DetailRow label="Additional Photos" value={String(props.additionalPhotos.length)} /> : null}
    </SectionCard>
  );
}

export function BiocharVerificationSummarySection({ state, completionPercent }: { state: BiocharApplicationVerificationFormState; completionPercent: number }) {
  return (
    <SectionCard title="Section 10 — Verification Summary">
      {BIOCHAR_APPLICATION_PROGRESS_STEPS.map((step) => {
        const done = isBiocharProgressStepComplete(state, step.key);
        return (
          <View key={step.key} style={styles.progressRow}>
            <BhuguardMaterialIcon name={done ? 'verified' : 'schedule'} size={20} color={done ? officerTheme.primaryContainer : officerTheme.outline} filled={done} />
            <Text style={[styles.progressLabel, done && styles.progressLabelDone]}>{step.label}</Text>
          </View>
        );
      })}
      <View style={styles.completionBox}>
        <Text style={styles.completionLabel}>Completion</Text>
        <Text style={styles.completionValue}>{completionPercent}%</Text>
      </View>
    </SectionCard>
  );
}

export function BiocharFinalResultSection(props: {
  verificationResult: VerificationResult;
  finalRemarks: string;
  correctionReason: string;
  requiredAction: string;
  correctionDueDate: string;
  rejectionReason: string;
  evidenceNotes: string;
  onSelectResult: (value: VerificationResult) => void;
  onFinalRemarksChange: (text: string) => void;
  onCorrectionReasonChange: (text: string) => void;
  onRequiredActionChange: (text: string) => void;
  onCorrectionDueDateChange: (text: string) => void;
  onRejectionReasonChange: (text: string) => void;
  onEvidenceNotesChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 11 — Final Verification Result">
      {BIOCHAR_APPLICATION_RESULT_OPTIONS.map((option) => (
        <Pressable key={option.value ?? 'none'} style={styles.radioRow} onPress={() => props.onSelectResult(option.value)}>
          <View style={[styles.radioOuter, props.verificationResult === option.value && styles.radioOuterSelected]}>
            {props.verificationResult === option.value ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}
      {props.verificationResult === 'correction_required' ? (
        <>
          <TextInput value={props.correctionReason} onChangeText={props.onCorrectionReasonChange} style={styles.remarksInput} placeholder="Correction reason" placeholderTextColor={officerTheme.outline} multiline />
          <TextInput value={props.requiredAction} onChangeText={props.onRequiredActionChange} style={styles.remarksInput} placeholder="Required action from farmer" placeholderTextColor={officerTheme.outline} multiline />
          <TextInput value={props.correctionDueDate} onChangeText={props.onCorrectionDueDateChange} style={styles.singleInput} placeholder="Due date (YYYY-MM-DD)" placeholderTextColor={officerTheme.outline} />
        </>
      ) : null}
      {props.verificationResult === 'rejected' ? (
        <>
          <TextInput value={props.rejectionReason} onChangeText={props.onRejectionReasonChange} style={styles.remarksInput} placeholder="Rejection reason" placeholderTextColor={officerTheme.outline} multiline />
          <TextInput value={props.evidenceNotes} onChangeText={props.onEvidenceNotesChange} style={styles.remarksInput} placeholder="Evidence notes" placeholderTextColor={officerTheme.outline} multiline />
        </>
      ) : null}
      <Text style={styles.subheading}>Final Remarks</Text>
      <TextInput value={props.finalRemarks} onChangeText={props.onFinalRemarksChange} style={styles.finalRemarksInput} multiline textAlignVertical="top" placeholder="Biochar application verified successfully. Plot, batch, quantity and evidence photos matched the submitted record." placeholderTextColor={officerTheme.outline} />
    </SectionCard>
  );
}

export function BiocharApplicationBottomActions(props: {
  saving: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.bottomActions}>
      <ActionButton label={props.saving ? 'Saving…' : 'Save Draft'} onPress={props.onSaveDraft} />
      <ActionButton label="Submit Verification" onPress={props.onSubmit} variant="primary" />
      <ActionButton label="Request Correction" onPress={props.onRequestCorrection} />
      <ActionButton label="Reject Record" onPress={props.onReject} variant="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: officerTheme.surfaceLowest, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.headingGreen, marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { flex: 1, fontSize: 13, color: officerTheme.outline },
  detailValue: { flex: 1.2, fontSize: 13, color: officerTheme.onSurface, textAlign: 'right', fontWeight: '600' },
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeApproved: { backgroundColor: '#D7F5E3' },
  badgeRejected: { backgroundColor: officerTheme.errorContainer },
  badgeCorrection: { backgroundColor: '#FFF3CD' },
  badgePending: { backgroundColor: officerTheme.surfaceContainer },
  badgeNeutral: { backgroundColor: officerTheme.surfaceLow },
  subheading: { fontSize: 14, fontWeight: '700', color: officerTheme.onSurface, marginTop: 4 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, minHeight: 48 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: officerTheme.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: officerTheme.primaryContainer, borderColor: officerTheme.primaryContainer },
  checklistLabel: { flex: 1, fontSize: 14, color: officerTheme.onSurface, lineHeight: 20 },
  resultRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  resultChip: { borderWidth: 1, borderColor: officerTheme.outlineVariant, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, minHeight: 40, justifyContent: 'center' },
  resultChipPass: { borderColor: officerTheme.primaryContainer, backgroundColor: '#E8F8EE' },
  resultChipFail: { borderColor: officerTheme.error, backgroundColor: officerTheme.errorContainer },
  resultChipCorrection: { borderColor: officerTheme.tertiary, backgroundColor: '#FFF8E1' },
  resultChipText: { fontSize: 13, color: officerTheme.onSurface },
  resultChipTextSelected: { fontWeight: '700', color: officerTheme.primary },
  remarksLabel: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  remarksInput: { borderWidth: 1, borderColor: officerTheme.outlineVariant, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: 'top', color: officerTheme.onSurface },
  singleInput: { borderWidth: 1, borderColor: officerTheme.outlineVariant, borderRadius: 12, padding: 12, color: officerTheme.onSurface, backgroundColor: officerTheme.surfaceLowest },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  actionPrimary: { backgroundColor: officerTheme.primaryContainer },
  actionSecondary: { backgroundColor: officerTheme.surfaceLow, borderWidth: 1, borderColor: officerTheme.outlineVariant },
  actionDanger: { backgroundColor: officerTheme.error },
  actionButtonText: { fontSize: 13, fontWeight: '700' },
  actionTextLight: { color: officerTheme.onPrimary },
  actionTextDark: { color: officerTheme.primary },
  photoPreview: { width: '100%', height: 160, borderRadius: 12 },
  noPhoto: { fontSize: 13, color: officerTheme.outline, fontStyle: 'italic' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  progressLabel: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  progressLabelDone: { color: officerTheme.primary, fontWeight: '600' },
  completionBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: officerTheme.surfaceLow, borderRadius: 12, padding: 12 },
  completionLabel: { fontSize: 14, fontWeight: '600' },
  completionValue: { fontSize: 20, fontWeight: '800', color: officerTheme.primary },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, minHeight: 44 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: officerTheme.outline, alignItems: 'center', justifyContent: 'center' },
  radioOuterSelected: { borderColor: officerTheme.primaryContainer },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: officerTheme.primaryContainer },
  radioLabel: { fontSize: 14, color: officerTheme.onSurface },
  finalRemarksInput: { borderWidth: 1, borderColor: officerTheme.outlineVariant, borderRadius: 12, padding: 12, minHeight: 120, textAlignVertical: 'top', color: officerTheme.onSurface },
  bottomActions: { gap: 10, marginBottom: 8 },
});
