import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  EVIDENCE_COMPLETION_CHECKLIST,
  EVIDENCE_RESULT_OPTIONS,
  EVIDENCE_SUMMARY_CARDS,
} from '../../../constants/evidenceVerificationChecklist';
import type { VerificationResult } from '../../../constants/feedstockVerificationChecklist';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import type {
  EvidenceDocumentItem,
  EvidenceGpsRecord,
  EvidencePhotoItem,
  EvidenceVerificationFormState,
  EvidenceVerificationViewModel,
  EvidenceWeightSlip,
} from '../../../utils/evidenceVerificationHelpers';
import { statusBadgeTone } from '../../../utils/evidenceVerificationHelpers';
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

function StatusBadge({ label, toneKey }: { label: string; toneKey: string }) {
  const tone = statusBadgeTone(toneKey);
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
  return (
    <Pressable
      style={[
        styles.actionButton,
        variant === 'primary' && styles.actionPrimary,
        variant === 'danger' && styles.actionDanger,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === 'primary' && styles.actionPrimaryText,
          variant === 'danger' && styles.actionDangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function EvidenceVerificationTopCard({ data }: { data: EvidenceVerificationViewModel }) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.topCardHeader}>
        <Text style={styles.cardTitle}>Verification Summary</Text>
        <StatusBadge label={data.statusLabel} toneKey={data.statusKey} />
      </View>
      <DetailRow label="Visit ID" value={data.visitId} />
      <DetailRow label="Verification ID" value={data.verificationCode} />
      <DetailRow label="Farmer Name" value={data.farmerName} />
      <DetailRow label="Farmer ID" value={data.farmerId} />
      <DetailRow label="Farm Name" value={data.farmName} />
      <DetailRow label="Farm ID" value={data.farmId} />
      <DetailRow label="Project" value={data.projectName} />
      <DetailRow label="Officer Name" value={data.officerName} />
      <DetailRow label="Current Status" value="Pending Evidence Review" />
    </View>
  );
}

export function EvidenceSummaryCards({ summary }: { summary: Record<string, number> }) {
  return (
    <View style={styles.summaryGrid}>
      {EVIDENCE_SUMMARY_CARDS.map((item) => (
        <View key={item.key} style={styles.summaryCard}>
          <Text style={styles.summaryCount}>{summary[item.key] ?? 0}</Text>
          <Text style={styles.summaryLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function PhotoEvidenceCard({
  photo,
  reviewStatus,
  remark,
  extraRows,
  onViewFullscreen,
  onApprove,
  onReject,
  onRemarkChange,
}: {
  photo: EvidencePhotoItem;
  reviewStatus: string;
  remark: string;
  extraRows?: Array<{ label: string; value: string }>;
  onViewFullscreen: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRemarkChange: (text: string) => void;
}) {
  const statusLabel = reviewStatus === 'approved' ? 'Approved' : reviewStatus === 'rejected' ? 'Rejected' : 'Pending';

  return (
    <View style={styles.photoCard}>
      {photo.url ? (
        <Image source={{ uri: photo.url }} style={styles.photoThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.photoThumb, styles.photoPlaceholder]}>
          <BhuguardMaterialIcon name="landscape" size={28} color={officerTheme.outline} />
        </View>
      )}
      <View style={styles.photoMeta}>
        {photo.uploadedBy ? <DetailRow label="Uploaded by" value={photo.uploadedBy} /> : null}
        <DetailRow label="Uploaded" value={photo.uploadedLabel} />
        {extraRows?.map((row) => <DetailRow key={row.label} label={row.label} value={row.value} />)}
        {photo.hasGps ? <StatusBadge label="GPS Captured" toneKey="approved" /> : null}
        <StatusBadge label={statusLabel} toneKey={reviewStatus} />
        <TextInput
          value={remark}
          onChangeText={onRemarkChange}
          style={styles.remarkInput}
          placeholder="Add remark"
          placeholderTextColor={officerTheme.outline}
        />
        <View style={styles.actionRow}>
          <ActionButton label="View Fullscreen" onPress={onViewFullscreen} />
          <ActionButton label="Approve" onPress={onApprove} variant="primary" />
          <ActionButton label="Reject" onPress={onReject} variant="danger" />
        </View>
      </View>
    </View>
  );
}

export function FeedstockPhotosSection(props: {
  photos: EvidencePhotoItem[];
  reviews: EvidenceVerificationFormState['feedstockPhotoReviews'];
  onViewFullscreen: (url: string, title: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemarkChange: (id: string, text: string) => void;
}) {
  return (
    <SectionCard title="Section 1 — Feedstock Photos">
      {props.photos.map((photo) => (
        <PhotoEvidenceCard
          key={photo.id}
          photo={photo}
          reviewStatus={props.reviews[photo.id]?.status ?? photo.status}
          remark={props.reviews[photo.id]?.remark ?? photo.remark}
          onViewFullscreen={() => photo.url && props.onViewFullscreen(photo.url, 'Feedstock Photo')}
          onApprove={() => props.onApprove(photo.id)}
          onReject={() => props.onReject(photo.id)}
          onRemarkChange={(text) => props.onRemarkChange(photo.id, text)}
        />
      ))}
    </SectionCard>
  );
}

export function ProductionPhotosSection(props: {
  photos: EvidencePhotoItem[];
  reviews: EvidenceVerificationFormState['productionPhotoReviews'];
  onViewFullscreen: (url: string, title: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemarkChange: (id: string, text: string) => void;
}) {
  return (
    <SectionCard title="Section 2 — Production Photos">
      {props.photos.map((photo) => (
        <PhotoEvidenceCard
          key={photo.id}
          photo={photo}
          reviewStatus={props.reviews[photo.id]?.status ?? photo.status}
          remark={props.reviews[photo.id]?.remark ?? photo.remark}
          extraRows={[
            ...(photo.batchId ? [{ label: 'Batch ID', value: photo.batchId }] : []),
            ...(photo.label ? [{ label: 'Photo Type', value: photo.label }] : []),
          ]}
          onViewFullscreen={() => photo.url && props.onViewFullscreen(photo.url, 'Production Photo')}
          onApprove={() => props.onApprove(photo.id)}
          onReject={() => props.onReject(photo.id)}
          onRemarkChange={(text) => props.onRemarkChange(photo.id, text)}
        />
      ))}
    </SectionCard>
  );
}

export function ApplicationPhotosSection(props: {
  photos: EvidencePhotoItem[];
  reviews: EvidenceVerificationFormState['applicationPhotoReviews'];
  onViewFullscreen: (url: string, title: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemarkChange: (id: string, text: string) => void;
}) {
  const phases = ['before', 'during', 'after'] as const;
  const titles = ['Before Photo', 'During Photo', 'After Photo'];

  return (
    <SectionCard title="Section 3 — Application Photos">
      {phases.map((phase, index) => {
        const photo = props.photos.find((item) => item.phase === phase);
        if (!photo) {
          return (
            <View key={phase} style={styles.subSection}>
              <Text style={styles.subSectionTitle}>{titles[index]}</Text>
              <Text style={styles.emptyCopy}>No photo uploaded.</Text>
            </View>
          );
        }

        return (
          <View key={phase} style={styles.subSection}>
            <Text style={styles.subSectionTitle}>{titles[index]}</Text>
            <PhotoEvidenceCard
              photo={photo}
              reviewStatus={props.reviews[photo.id]?.status ?? photo.status}
              remark={props.reviews[photo.id]?.remark ?? photo.remark}
              extraRows={[
                ...(photo.plotId ? [{ label: 'Plot ID', value: photo.plotId }] : []),
                ...(photo.batchId ? [{ label: 'Batch ID', value: photo.batchId }] : []),
              ]}
              onViewFullscreen={() => photo.url && props.onViewFullscreen(photo.url, titles[index])}
              onApprove={() => props.onApprove(photo.id)}
              onReject={() => props.onReject(photo.id)}
              onRemarkChange={(text) => props.onRemarkChange(photo.id, text)}
            />
          </View>
        );
      })}
    </SectionCard>
  );
}

export function GpsRecordsSection(props: {
  records: EvidenceGpsRecord[];
  reviews: EvidenceVerificationFormState['gpsRecordReviews'];
  onViewMap: (record: EvidenceGpsRecord) => void;
  onVerifyGps: (id: string) => void;
  onFlagIssue: (id: string) => void;
  onRemarkChange: (id: string, text: string) => void;
}) {
  return (
    <SectionCard title="Section 4 — GPS Records">
      {props.records.map((record) => {
        const review = props.reviews[record.id];
        const status = review?.status ?? record.status;
        const statusKey = review?.statusKey ?? record.statusKey;

        return (
          <View key={record.id} style={styles.listCard}>
            <DetailRow label="GPS Record ID" value={record.recordId} />
            <DetailRow label="Latitude" value={record.latitude.toFixed(6)} />
            <DetailRow label="Longitude" value={record.longitude.toFixed(6)} />
            <DetailRow label="Accuracy" value={record.accuracyLabel} />
            <DetailRow label="Timestamp" value={record.timestampLabel} />
            <DetailRow label="Distance from Farm" value={record.distanceLabel} />
            <StatusBadge label={status} toneKey={statusKey} />
            <TextInput
              value={review?.remark ?? record.remark}
              onChangeText={(text) => props.onRemarkChange(record.id, text)}
              style={styles.remarkInput}
              placeholder="Add remark"
              placeholderTextColor={officerTheme.outline}
            />
            <View style={styles.actionRow}>
              <ActionButton label="View Map" onPress={() => props.onViewMap(record)} />
              <ActionButton label="Verify GPS" onPress={() => props.onVerifyGps(record.id)} variant="primary" />
              <ActionButton label="Flag Issue" onPress={() => props.onFlagIssue(record.id)} variant="danger" />
            </View>
          </View>
        );
      })}
    </SectionCard>
  );
}

export function WeightSlipSection(props: {
  weightSlip: EvidenceWeightSlip | null;
  review: EvidenceVerificationFormState['weightSlipReview'];
  onViewDocument: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRemarkChange: (text: string) => void;
}) {
  if (!props.weightSlip) {
    return (
      <SectionCard title="Section 5 — Weight Slip">
        <Text style={styles.emptyCopy}>No weight slip uploaded.</Text>
      </SectionCard>
    );
  }

  const slip = props.weightSlip;
  const status = props.review?.status ?? slip.status;
  const statusLabel = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';

  return (
    <SectionCard title="Section 5 — Weight Slip">
      <View style={styles.listCard}>
        <DetailRow label="File name" value={slip.fileName} />
        <DetailRow label="File type" value={slip.fileType} />
        <DetailRow label="Uploaded date" value={slip.uploadedLabel} />
        <DetailRow label="Quantity mentioned" value={slip.quantityMentioned} />
        <DetailRow label="Farmer name" value={slip.farmerName} />
        <StatusBadge label={statusLabel} toneKey={status} />
        <TextInput
          value={props.review?.remark ?? slip.remark}
          onChangeText={props.onRemarkChange}
          style={styles.remarkInput}
          placeholder="Add remark"
          placeholderTextColor={officerTheme.outline}
        />
        <View style={styles.actionRow}>
          <ActionButton label="View Document" onPress={props.onViewDocument} />
          <ActionButton label="Download" onPress={props.onDownload} />
          <ActionButton label="Approve Weight Slip" onPress={props.onApprove} variant="primary" />
          <ActionButton label="Reject Weight Slip" onPress={props.onReject} variant="danger" />
        </View>
      </View>
    </SectionCard>
  );
}

export function DocumentsSection(props: {
  documents: EvidenceDocumentItem[];
  reviews: EvidenceVerificationFormState['documentReviews'];
  onView: (doc: EvidenceDocumentItem) => void;
  onDownload: (doc: EvidenceDocumentItem) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRemarkChange: (id: string, text: string) => void;
}) {
  return (
    <SectionCard title="Section 6 — Documents">
      {props.documents.map((doc) => {
        const status = props.reviews[doc.id]?.status ?? doc.status;
        const statusLabel = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';

        return (
          <View key={doc.id} style={styles.listCard}>
            <Text style={styles.documentTitle}>{doc.title}</Text>
            <DetailRow label="File name" value={doc.fileName} />
            <DetailRow label="Uploaded date" value={doc.uploadedLabel} />
            <StatusBadge label={statusLabel} toneKey={status} />
            <TextInput
              value={props.reviews[doc.id]?.remark ?? doc.remark}
              onChangeText={(text) => props.onRemarkChange(doc.id, text)}
              style={styles.remarkInput}
              placeholder="Add remark"
              placeholderTextColor={officerTheme.outline}
            />
            <View style={styles.actionRow}>
              <ActionButton label="View" onPress={() => props.onView(doc)} />
              <ActionButton label="Download" onPress={() => props.onDownload(doc)} />
              <ActionButton label="Approve" onPress={() => props.onApprove(doc.id)} variant="primary" />
              <ActionButton label="Reject" onPress={() => props.onReject(doc.id)} variant="danger" />
            </View>
          </View>
        );
      })}
    </SectionCard>
  );
}

export function EvidenceCompletionSection(props: {
  checklist: EvidenceVerificationFormState['completionChecklist'];
  completionPercent: number;
  onToggle: (key: keyof EvidenceVerificationFormState['completionChecklist'], value: boolean) => void;
}) {
  return (
    <SectionCard title="Section 7 — Evidence Completion Checklist">
      {EVIDENCE_COMPLETION_CHECKLIST.map((item) => (
        <Pressable
          key={item.key}
          style={styles.checklistRow}
          onPress={() => props.onToggle(item.key, !props.checklist[item.key])}
        >
          <View style={[styles.checkbox, props.checklist[item.key] && styles.checkboxChecked]}>
            {props.checklist[item.key] ? (
              <BhuguardMaterialIcon name="verified" size={16} color={officerTheme.onPrimary} filled />
            ) : null}
          </View>
          <Text style={styles.checklistLabel}>{item.label}</Text>
        </Pressable>
      ))}
      <View style={styles.progressWrap}>
        <Text style={styles.progressLabel}>Completion</Text>
        <Text style={styles.progressValue}>{props.completionPercent}%</Text>
      </View>
    </SectionCard>
  );
}

export function EvidenceFinalResultSection(props: {
  verificationResult: VerificationResult | null;
  finalRemarks: string;
  correctionReason: string;
  requiredEvidence: string;
  correctionDueDate: string;
  rejectionReason: string;
  evidenceNotes: string;
  onSelectResult: (value: VerificationResult) => void;
  onFinalRemarksChange: (text: string) => void;
  onCorrectionReasonChange: (text: string) => void;
  onRequiredEvidenceChange: (text: string) => void;
  onCorrectionDueDateChange: (text: string) => void;
  onRejectionReasonChange: (text: string) => void;
  onEvidenceNotesChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 8 — Final Evidence Result">
      {EVIDENCE_RESULT_OPTIONS.map((option) => (
        <Pressable key={option.value} style={styles.radioRow} onPress={() => props.onSelectResult(option.value)}>
          <View style={[styles.radioOuter, props.verificationResult === option.value && styles.radioOuterSelected]}>
            {props.verificationResult === option.value ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}

      {props.verificationResult === 'correction_required' ? (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Correction reason</Text>
          <TextInput value={props.correctionReason} onChangeText={props.onCorrectionReasonChange} style={styles.input} multiline />
          <Text style={styles.fieldLabel}>Required evidence</Text>
          <TextInput value={props.requiredEvidence} onChangeText={props.onRequiredEvidenceChange} style={styles.input} multiline />
          <Text style={styles.fieldLabel}>Due date</Text>
          <TextInput value={props.correctionDueDate} onChangeText={props.onCorrectionDueDateChange} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={officerTheme.outline} />
        </View>
      ) : null}

      {props.verificationResult === 'rejected' ? (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Rejection reason</Text>
          <TextInput value={props.rejectionReason} onChangeText={props.onRejectionReasonChange} style={styles.input} multiline />
          <Text style={styles.fieldLabel}>Evidence notes</Text>
          <TextInput value={props.evidenceNotes} onChangeText={props.onEvidenceNotesChange} style={styles.input} multiline />
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Final Remarks</Text>
      <TextInput
        value={props.finalRemarks}
        onChangeText={props.onFinalRemarksChange}
        style={styles.finalRemarksInput}
        multiline
        textAlignVertical="top"
        placeholder="All evidence records reviewed. Feedstock, production, application photos, GPS and documents verified."
        placeholderTextColor={officerTheme.outline}
      />
    </SectionCard>
  );
}

export function EvidenceVerificationBottomActions(props: {
  saving: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.bottomActions}>
      <Pressable style={[styles.bottomButton, styles.bottomSecondary]} onPress={props.onSaveDraft} disabled={props.saving}>
        <Text style={styles.bottomSecondaryText}>Save Draft</Text>
      </Pressable>
      <Pressable style={[styles.bottomButton, styles.bottomPrimary]} onPress={props.onSubmit} disabled={props.saving}>
        <Text style={styles.bottomPrimaryText}>Submit Evidence Verification</Text>
      </Pressable>
      <Pressable style={[styles.bottomButton, styles.bottomSecondary]} onPress={props.onRequestCorrection} disabled={props.saving}>
        <Text style={styles.bottomSecondaryText}>Request Correction</Text>
      </Pressable>
      <Pressable style={[styles.bottomButton, styles.bottomDanger]} onPress={props.onReject} disabled={props.saving}>
        <Text style={styles.bottomDangerText}>Reject Evidence</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: officerTheme.surfaceLowest, borderRadius: 16, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.headingGreen },
  topCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  detailLabel: { fontSize: 13, color: officerTheme.onSurfaceVariant, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '700', color: officerTheme.onSurface, flex: 1.2, textAlign: 'right' },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  badgeApproved: { backgroundColor: '#E8F8EE' },
  badgeRejected: { backgroundColor: officerTheme.errorContainer },
  badgeCorrection: { backgroundColor: '#FFF8E1' },
  badgePending: { backgroundColor: officerTheme.surfaceContainer },
  badgeNeutral: { backgroundColor: officerTheme.surfaceLow },
  badgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurface },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: {
    width: '48%',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  summaryCount: { fontSize: 24, fontWeight: '800', color: officerTheme.primaryContainer },
  summaryLabel: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  photoCard: { gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: officerTheme.outlineVariant },
  photoThumb: { width: '100%', height: 160, borderRadius: 12, backgroundColor: officerTheme.surfaceLow },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  photoMeta: { gap: 6 },
  listCard: { gap: 6, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: officerTheme.outlineVariant },
  documentTitle: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface },
  subSection: { gap: 8, marginBottom: 8 },
  subSectionTitle: { fontSize: 14, fontWeight: '700', color: officerTheme.primary },
  emptyCopy: { fontSize: 14, color: officerTheme.onSurfaceVariant },
  remarkInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: officerTheme.onSurface,
    marginTop: 4,
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  actionButton: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: officerTheme.primaryContainer, borderColor: officerTheme.primaryContainer },
  actionDanger: { backgroundColor: officerTheme.errorContainer, borderColor: officerTheme.error },
  actionButtonText: { fontSize: 13, fontWeight: '700', color: officerTheme.primaryContainer, textAlign: 'center' },
  actionPrimaryText: { color: officerTheme.onPrimary },
  actionDangerText: { color: officerTheme.error },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: officerTheme.primaryContainer, borderColor: officerTheme.primaryContainer },
  checklistLabel: { flex: 1, fontSize: 14, color: officerTheme.onSurface },
  progressWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: officerTheme.outlineVariant },
  progressLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  progressValue: { fontSize: 18, fontWeight: '800', color: officerTheme.primaryContainer },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: officerTheme.primaryContainer },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: officerTheme.primaryContainer },
  radioLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  conditionalBlock: { gap: 8, marginTop: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: officerTheme.onSurfaceVariant },
  input: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: officerTheme.onSurface,
    minHeight: 44,
  },
  finalRemarksInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    color: officerTheme.onSurface,
  },
  bottomActions: { gap: 10, marginTop: 8 },
  bottomButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  bottomPrimary: { backgroundColor: officerTheme.primaryContainer },
  bottomSecondary: { borderWidth: 1, borderColor: officerTheme.outlineVariant, backgroundColor: officerTheme.surfaceLowest },
  bottomDanger: { backgroundColor: officerTheme.errorContainer },
  bottomPrimaryText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 15 },
  bottomSecondaryText: { color: officerTheme.primaryContainer, fontWeight: '700', fontSize: 14 },
  bottomDangerText: { color: officerTheme.error, fontWeight: '700', fontSize: 14 },
});
