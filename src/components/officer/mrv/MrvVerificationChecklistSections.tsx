import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { VerificationResult } from '../../../constants/feedstockVerificationChecklist';
import {
  MRV_APPLICATION_CHECKLIST,
  MRV_FARM_CHECKLIST,
  MRV_FEEDSTOCK_CHECKLIST,
  MRV_INVENTORY_CHECKLIST,
  MRV_PRODUCTION_CHECKLIST,
  MRV_PROGRESS_STEPS,
  MRV_VERIFICATION_RESULT_OPTIONS,
  type MrvChecklistItemDef,
  type MrvSectionKey,
} from '../../../constants/mrvVerificationChecklist';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import {
  formatCheckInTime,
  formatCoordinate,
  formatDistanceKm,
  isMrvProgressStepComplete,
  statusBadgeTone,
  type MrvEvidenceSummary,
  type MrvGpsState,
  type MrvSectionState,
  type MrvVerificationState,
  type MrvVerificationViewModel,
} from '../../../utils/mrvVerificationHelpers';
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
    tone === 'approved'
      ? styles.badgeApproved
      : tone === 'rejected'
        ? styles.badgeRejected
        : tone === 'correction'
          ? styles.badgeCorrection
          : tone === 'pending'
            ? styles.badgePending
            : styles.badgeNeutral;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant = 'secondary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const buttonStyle =
    variant === 'primary'
      ? styles.actionPrimary
      : variant === 'danger'
        ? styles.actionDanger
        : styles.actionSecondary;
  const textStyle =
    variant === 'primary' || variant === 'danger' ? styles.actionTextLight : styles.actionTextDark;

  return (
    <Pressable style={[styles.actionButton, buttonStyle]} onPress={onPress}>
      <Text style={[styles.actionButtonText, textStyle]}>{label}</Text>
    </Pressable>
  );
}

function ChecklistRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable style={styles.checklistRow} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <BhuguardMaterialIcon name="verified" size={16} color={officerTheme.onPrimary} filled /> : null}
      </View>
      <Text style={styles.checklistLabel}>{label}</Text>
    </Pressable>
  );
}

function ChecklistSection({
  title,
  items,
  section,
  onToggleItem,
  onRemarksChange,
}: {
  title: string;
  items: MrvChecklistItemDef[];
  section: MrvSectionState;
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <SectionCard title={title}>
      {items.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={section.items[item.key] === true}
          onToggle={() => onToggleItem(item.key)}
        />
      ))}
      <Text style={styles.remarksLabel}>Remarks</Text>
      <TextInput
        value={section.remarks}
        onChangeText={onRemarksChange}
        placeholder="Add section remarks"
        placeholderTextColor={officerTheme.outline}
        style={styles.remarksInput}
        multiline
      />
    </SectionCard>
  );
}

export function MrvTopVerificationCard({ data }: { data: MrvVerificationViewModel }) {
  return (
    <SectionCard title="Verification Overview">
      <DetailRow label="Visit ID" value={data.visitId} />
      <DetailRow label="Verification ID" value={data.verificationId} />
      <DetailRow label="Farmer Name" value={data.farmerName} />
      <DetailRow label="Farmer ID" value={data.farmerId} />
      <DetailRow label="Farm Name" value={data.farmName} />
      <DetailRow label="Project" value={data.projectName} />
      <DetailRow label="Verification Date" value={data.verificationDateLabel} />
      <DetailRow label="Officer Name" value={data.officerName} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Current Status</Text>
        <StatusBadge label={data.statusLabel} statusKey={data.statusKey} />
      </View>
    </SectionCard>
  );
}

interface GpsSectionProps {
  gps: MrvGpsState;
  capturing: boolean;
  onCaptureGps: () => void;
  onVerifyLocation: () => void;
  onOpenGpsCheckIn: () => void;
}

export function MrvGpsCheckInSection({
  gps,
  capturing,
  onCaptureGps,
  onVerifyLocation,
  onOpenGpsCheckIn,
}: GpsSectionProps) {
  return (
    <SectionCard title="GPS Attendance Verification">
      <DetailRow label="Current Latitude" value={formatCoordinate(gps.latitude)} />
      <DetailRow label="Current Longitude" value={formatCoordinate(gps.longitude)} />
      <DetailRow label="GPS Accuracy" value={gps.accuracyM != null ? `${gps.accuracyM.toFixed(1)} m` : '—'} />
      <DetailRow label="Distance from Registered Farm" value={formatDistanceKm(gps.distanceFromFarmKm)} />
      <DetailRow label="Check-In Time" value={formatCheckInTime(gps.checkInTime)} />

      <View style={styles.buttonRow}>
        <ActionButton label={capturing ? 'Capturing...' : 'Capture GPS'} onPress={onCaptureGps} variant="primary" />
        <ActionButton label="GPS Check-In Screen" onPress={onOpenGpsCheckIn} />
      </View>
      <ActionButton label="Verify Location" onPress={onVerifyLocation} variant="primary" />

      <View style={styles.statusRow}>
        <StatusBadge label="Pending" statusKey={gps.status === 'pending' ? 'pending' : 'neutral'} />
        <StatusBadge label="Verified" statusKey={gps.status === 'verified' ? 'verified' : 'neutral'} />
        <StatusBadge label="Failed" statusKey={gps.status === 'failed' ? 'failed' : 'neutral'} />
      </View>
    </SectionCard>
  );
}

export function MrvFarmVerificationSection(props: {
  section: MrvSectionState;
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <ChecklistSection
      title="Farm Verification"
      items={MRV_FARM_CHECKLIST}
      section={props.section}
      onToggleItem={props.onToggleItem}
      onRemarksChange={props.onRemarksChange}
    />
  );
}

export function MrvFeedstockVerificationSection(props: {
  section: MrvSectionState;
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <ChecklistSection
      title="Feedstock Verification"
      items={MRV_FEEDSTOCK_CHECKLIST}
      section={props.section}
      onToggleItem={props.onToggleItem}
      onRemarksChange={props.onRemarksChange}
    />
  );
}

export function MrvProductionVerificationSection(props: {
  section: MrvSectionState;
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <ChecklistSection
      title="Biochar Production Verification"
      items={MRV_PRODUCTION_CHECKLIST}
      section={props.section}
      onToggleItem={props.onToggleItem}
      onRemarksChange={props.onRemarksChange}
    />
  );
}

export function MrvApplicationVerificationSection(props: {
  section: MrvSectionState;
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <ChecklistSection
      title="Biochar Application Verification"
      items={MRV_APPLICATION_CHECKLIST}
      section={props.section}
      onToggleItem={props.onToggleItem}
      onRemarksChange={props.onRemarksChange}
    />
  );
}

export function MrvInventoryVerificationSection(props: {
  section: MrvSectionState;
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <ChecklistSection
      title="Inventory Verification"
      items={MRV_INVENTORY_CHECKLIST}
      section={props.section}
      onToggleItem={props.onToggleItem}
      onRemarksChange={props.onRemarksChange}
    />
  );
}

export function MrvEvidenceVerificationSection({
  evidence,
  onViewEvidence,
  onApprove,
  onReject,
}: {
  evidence: MrvEvidenceSummary;
  onViewEvidence: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <SectionCard title="Evidence Verification">
      <Text style={styles.subheading}>Photo Summary</Text>
      <DetailRow label="Feedstock Photos" value={String(evidence.feedstockPhotos)} />
      <DetailRow label="Production Photos" value={String(evidence.productionPhotos)} />
      <DetailRow label="Application Photos" value={String(evidence.applicationPhotos)} />
      <DetailRow label="GPS Records" value={String(evidence.gpsRecords)} />
      <DetailRow label="Documents" value={String(evidence.documents)} />

      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Evidence Status</Text>
        <StatusBadge
          label={evidence.status === 'approved' ? 'Approved' : evidence.status === 'rejected' ? 'Rejected' : 'Pending'}
          statusKey={evidence.status}
        />
      </View>

      <View style={styles.buttonRow}>
        <ActionButton label="View Evidence" onPress={onViewEvidence} />
        <ActionButton label="Approve Evidence" onPress={onApprove} variant="primary" />
      </View>
      <ActionButton label="Reject Evidence" onPress={onReject} variant="danger" />
    </SectionCard>
  );
}

function SignaturePad({
  title,
  captured,
  onCapture,
  onClear,
}: {
  title: string;
  captured: boolean;
  onCapture: () => void;
  onClear: () => void;
}) {
  return (
    <View style={styles.signatureBlock}>
      <Text style={styles.subheading}>{title}</Text>
      <Pressable style={[styles.signaturePad, captured && styles.signaturePadCaptured]} onPress={onCapture}>
        {captured ? (
          <>
            <BhuguardMaterialIcon name="description" size={28} color={officerTheme.primaryContainer} />
            <Text style={styles.signatureCapturedText}>Signature Captured</Text>
          </>
        ) : (
          <>
            <BhuguardMaterialIcon name="person" size={28} color={officerTheme.outline} />
            <Text style={styles.signatureHint}>Tap to draw, upload, or photograph signature</Text>
          </>
        )}
      </Pressable>
      <View style={styles.buttonRow}>
        <ActionButton label="Capture Signature" onPress={onCapture} variant="primary" />
        <ActionButton label="Clear Signature" onPress={onClear} />
      </View>
    </View>
  );
}

export function MrvDigitalSignatureSection({
  farmerCaptured,
  officerCaptured,
  onCaptureFarmer,
  onCaptureOfficer,
  onClearFarmer,
  onClearOfficer,
}: {
  farmerCaptured: boolean;
  officerCaptured: boolean;
  onCaptureFarmer: () => void;
  onCaptureOfficer: () => void;
  onClearFarmer: () => void;
  onClearOfficer: () => void;
}) {
  return (
    <SectionCard title="Digital Signature">
      <SignaturePad title="Farmer Signature Pad" captured={farmerCaptured} onCapture={onCaptureFarmer} onClear={onClearFarmer} />
      <SignaturePad title="Officer Signature Pad" captured={officerCaptured} onCapture={onCaptureOfficer} onClear={onClearOfficer} />
    </SectionCard>
  );
}

export function MrvVerificationSummarySection({
  state,
  completionPercent,
  verificationResult,
  onSelectResult,
}: {
  state: MrvVerificationState;
  completionPercent: number;
  verificationResult: VerificationResult;
  onSelectResult: (value: VerificationResult) => void;
}) {
  return (
    <SectionCard title="Verification Summary">
      <Text style={styles.subheading}>Progress</Text>
      {MRV_PROGRESS_STEPS.map((step) => {
        const done = isMrvProgressStepComplete(state, step.key);

        return (
          <View key={step.key} style={styles.progressRow}>
            <BhuguardMaterialIcon
              name={done ? 'verified' : 'schedule'}
              size={20}
              color={done ? officerTheme.primaryContainer : officerTheme.outline}
              filled={done}
            />
            <Text style={[styles.progressLabel, done && styles.progressLabelDone]}>{step.label}</Text>
          </View>
        );
      })}

      <View style={styles.completionBox}>
        <Text style={styles.completionLabel}>Completion</Text>
        <Text style={styles.completionValue}>{completionPercent}%</Text>
      </View>

      <Text style={styles.subheading}>Verification Result</Text>
      {MRV_VERIFICATION_RESULT_OPTIONS.map((option) => (
        <Pressable
          key={option.value ?? 'none'}
          style={styles.radioRow}
          onPress={() => onSelectResult(option.value)}
        >
          <View style={[styles.radioOuter, verificationResult === option.value && styles.radioOuterSelected]}>
            {verificationResult === option.value ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}
    </SectionCard>
  );
}

export function MrvFinalRemarksSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Final Remarks">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="All activities verified successfully and evidence matched field observations."
        placeholderTextColor={officerTheme.outline}
        style={styles.finalRemarksInput}
        multiline
        textAlignVertical="top"
      />
    </SectionCard>
  );
}

export function MrvBottomActions({
  saving,
  onSaveDraft,
  onGenerateReport,
  onSubmitApproval,
  onRequestCorrection,
  onReject,
}: {
  saving: boolean;
  onSaveDraft: () => void;
  onGenerateReport: () => void;
  onSubmitApproval: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.bottomActions}>
      <ActionButton label={saving ? 'Saving...' : 'Save Draft'} onPress={onSaveDraft} />
      <ActionButton label="Generate MRV Report" onPress={onGenerateReport} variant="primary" />
      <ActionButton label="Submit For Approval" onPress={onSubmitApproval} variant="primary" />
      <ActionButton label="Request Correction" onPress={onRequestCorrection} />
      <ActionButton label="Reject Verification" onPress={onReject} variant="danger" />
    </View>
  );
}

export type { MrvSectionKey };

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.headingGreen,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: officerTheme.outline,
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: officerTheme.onSurface,
    fontWeight: '600',
    textAlign: 'right',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeApproved: { backgroundColor: '#D7F5E3', },
  badgeRejected: { backgroundColor: officerTheme.errorContainer, },
  badgeCorrection: { backgroundColor: '#FFF4CC', },
  badgePending: { backgroundColor: '#E8EEF9', },
  badgeNeutral: { backgroundColor: officerTheme.surfaceContainer, },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.surfaceContainer,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  checkboxChecked: {
    backgroundColor: officerTheme.primaryContainer,
    borderColor: officerTheme.primaryContainer,
  },
  checklistLabel: {
    flex: 1,
    fontSize: 15,
    color: officerTheme.onSurface,
    fontWeight: '600',
  },
  remarksLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  remarksInput: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.surfaceLow,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSecondary: {
    backgroundColor: officerTheme.surfaceContainer,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  actionPrimary: {
    backgroundColor: officerTheme.primaryContainer,
  },
  actionDanger: {
    backgroundColor: officerTheme.error,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionTextDark: {
    color: officerTheme.primary,
  },
  actionTextLight: {
    color: officerTheme.onPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  signatureBlock: {
    gap: 8,
    marginBottom: 8,
  },
  signaturePad: {
    minHeight: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: officerTheme.surfaceLow,
  },
  signaturePadCaptured: {
    borderStyle: 'solid',
    borderColor: officerTheme.primaryContainer,
    backgroundColor: '#EEF9F2',
  },
  signatureHint: {
    fontSize: 13,
    color: officerTheme.outline,
    fontWeight: '600',
  },
  signatureCapturedText: {
    fontSize: 13,
    color: officerTheme.primaryContainer,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  progressLabel: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  progressLabelDone: {
    color: officerTheme.primary,
  },
  completionBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: officerTheme.surfaceLow,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
  },
  completionValue: {
    fontSize: 24,
    fontWeight: '800',
    color: officerTheme.primaryContainer,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: officerTheme.primaryContainer,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: officerTheme.primaryContainer,
  },
  radioLabel: {
    fontSize: 15,
    color: officerTheme.onSurface,
    fontWeight: '600',
  },
  finalRemarksInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.surfaceLow,
  },
  bottomActions: {
    gap: 10,
    marginTop: 4,
    marginBottom: 24,
  },
});
