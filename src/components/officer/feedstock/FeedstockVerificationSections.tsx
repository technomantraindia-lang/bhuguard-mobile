import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import type { FeedstockChecklistItem, VerificationResult } from '../../../constants/feedstockVerificationChecklist';
import { VERIFICATION_RESULT_OPTIONS } from '../../../constants/feedstockVerificationChecklist';
import type { FeedstockVerificationViewModel } from '../../../utils/feedstockVerificationHelpers';
import { statusBadgeTone } from '../../../utils/feedstockVerificationHelpers';

const MAP_PREVIEW_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBbvlBm6ityzuEKTJ3OHLv4IfgoyDNGIM9_cy8HRPuYl8rxce54xeMIgacJNhHEqkK_pHaVwh2-4qRKZG8pgQ3ZERL02nm9VukTD_0PWTEB7K2aMY9sW_TRdEyoY9u1EmG7Ua35MU1CbsGt7dT6Nm0JmyVkR9je8dov1AIhz7O-f_LMkIc7BmlEQjSrs_ucMr2M303qlPawDlf6dA8euR91jBaoyfdHeEfbe-TTAhm-rZPWGp3I_VD9HA';

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

export function VerificationStatusCard({ data }: { data: FeedstockVerificationViewModel }) {
  return (
    <SectionCard title="Verification Status">
      <DetailRow label="Verification ID" value={data.verificationCode} />
      <DetailRow label="Farmer" value={data.farmerName} />
      <DetailRow label="Farmer ID" value={data.farmerCode} />
      <DetailRow label="Farm" value={data.farmName} />
      <DetailRow label="Village" value={data.village} />
      <DetailRow label="Taluka" value={data.taluka} />
      <DetailRow label="District" value={data.district} />
      <DetailRow label="Project" value={data.projectName} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Current Status</Text>
        <StatusBadge label={data.verificationStatusLabel} statusKey={data.verificationStatus} />
      </View>
      <DetailRow label="Priority" value={data.priority.replace(/^\w/, (c) => c.toUpperCase())} />
      <DetailRow label="Verification Date" value={data.verificationDateLabel} />
    </SectionCard>
  );
}

export function FarmerCollectionRecordCard({ data }: { data: FeedstockVerificationViewModel }) {
  return (
    <SectionCard title="Farmer Collection Record">
      <DetailRow label="Feedstock Type" value={data.feedstockTypeLabel} />
      <DetailRow label="Quantity" value={data.quantityLabel} />
      <DetailRow label="Collection Date" value={data.collectionDateLabel} />
      <DetailRow label="Collection Method" value={data.collectionMethod} />
      <DetailRow label="Record Submitted" value={data.recordSubmittedLabel} />
    </SectionCard>
  );
}

interface ChecklistSectionProps {
  items: FeedstockChecklistItem[];
  onChange: (key: string, patch: Partial<FeedstockChecklistItem>) => void;
}

export function FeedstockChecklistSection({ items, onChange }: ChecklistSectionProps) {
  return (
    <SectionCard title="Feedstock Verification">
      {items.map((item) => (
        <View key={item.key} style={styles.checklistItem}>
          <Text style={styles.checklistLabel}>{item.label}</Text>
          <View style={styles.passFailRow}>
            <Pressable
              style={[styles.passFailButton, item.result === 'pass' && styles.passSelected]}
              onPress={() => onChange(item.key, { result: 'pass' })}
            >
              <Text style={[styles.passFailText, item.result === 'pass' && styles.passFailTextSelected]}>Pass</Text>
            </Pressable>
            <Pressable
              style={[styles.passFailButton, item.result === 'fail' && styles.failSelected]}
              onPress={() => onChange(item.key, { result: 'fail' })}
            >
              <Text style={[styles.passFailText, item.result === 'fail' && styles.passFailTextSelected]}>Fail</Text>
            </Pressable>
          </View>
          <TextInput
            value={item.remarks}
            onChangeText={(text) => onChange(item.key, { remarks: text })}
            placeholder="Remarks"
            placeholderTextColor={officerTheme.outline}
            style={styles.remarksInput}
          />
        </View>
      ))}
    </SectionCard>
  );
}

interface GpsSectionProps {
  gps: FeedstockVerificationViewModel['gps'];
  onOpenMap: () => void;
  onVerifyGps: () => void;
  onFlagGps: () => void;
  gpsVerified: boolean | null;
  gpsFlagged: boolean;
}

export function GpsVerificationCard({ gps, onOpenMap, onVerifyGps, onFlagGps, gpsVerified, gpsFlagged }: GpsSectionProps) {
  return (
    <SectionCard title="GPS Verification">
      <DetailRow label="Captured Latitude" value={gps.latitude?.toFixed(4) ?? '—'} />
      <DetailRow label="Captured Longitude" value={gps.longitude?.toFixed(4) ?? '—'} />
      <DetailRow label="GPS Accuracy" value={gps.accuracyM != null ? `${gps.accuracyM} m` : '—'} />
      <DetailRow
        label="Distance from Registered Farm"
        value={gps.distanceFromFarmKm != null ? `${gps.distanceFromFarmKm} km` : '—'}
      />
      <View style={styles.mapPreviewWrap}>
        <Image source={{ uri: MAP_PREVIEW_URI }} style={styles.mapPreview} resizeMode="cover" />
      </View>
      {gpsVerified ? (
        <View style={[styles.badge, styles.badgeApproved, styles.inlineBadge]}>
          <Text style={styles.badgeText}>GPS Verified</Text>
        </View>
      ) : null}
      {gpsFlagged ? (
        <View style={[styles.badge, styles.badgeRejected, styles.inlineBadge]}>
          <Text style={styles.badgeText}>GPS Issue Flagged</Text>
        </View>
      ) : null}
      <View style={styles.buttonRow}>
        <Pressable style={styles.outlineButton} onPress={onOpenMap}>
          <Text style={styles.outlineButtonText}>Open Map</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={onVerifyGps}>
          <Text style={styles.outlineButtonText}>Verify GPS</Text>
        </Pressable>
        <Pressable style={[styles.outlineButton, styles.dangerOutline]} onPress={onFlagGps}>
          <Text style={[styles.outlineButtonText, styles.dangerText]}>Flag GPS Issue</Text>
        </Pressable>
      </View>
    </SectionCard>
  );
}

interface EvidenceSectionProps {
  photos: FeedstockVerificationViewModel['photos'];
  photosCount: number;
  onPhotoPress: (photoId: number, url: string) => void;
  onApprovePhoto: (photoId: number) => void;
  onRejectPhoto: (photoId: number) => void;
}

export function EvidenceVerificationSection({
  photos,
  photosCount,
  onPhotoPress,
  onApprovePhoto,
  onRejectPhoto,
}: EvidenceSectionProps) {
  return (
    <SectionCard title="Evidence Verification">
      <Text style={styles.metaLabel}>Photos Uploaded: {photosCount}</Text>
      <View style={styles.photoGrid}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.photoTile}>
            <Pressable onPress={() => onPhotoPress(photo.id, photo.url)}>
              <Image source={{ uri: photo.url }} style={styles.photoThumb} resizeMode="cover" />
            </Pressable>
            <View style={styles.photoActions}>
              <Pressable style={styles.miniButton} onPress={() => onPhotoPress(photo.id, photo.url)}>
                <Text style={styles.miniButtonText}>Zoom</Text>
              </Pressable>
              <Pressable style={[styles.miniButton, photo.approved && styles.miniApproved]} onPress={() => onApprovePhoto(photo.id)}>
                <Text style={styles.miniButtonText}>Approve</Text>
              </Pressable>
              <Pressable style={[styles.miniButton, photo.rejected && styles.miniRejected]} onPress={() => onRejectPhoto(photo.id)}>
                <Text style={styles.miniButtonText}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

interface WeightSlipProps {
  weightSlip: FeedstockVerificationViewModel['weightSlip'];
  onView: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function WeightSlipVerificationCard({ weightSlip, onView, onDownload, onApprove, onReject }: WeightSlipProps) {
  return (
    <SectionCard title="Weight Slip Verification">
      <DetailRow label="Weight Slip File" value={weightSlip.available ? 'Available' : 'Not uploaded'} />
      <DetailRow label="Upload Date" value={weightSlip.uploadedLabel} />
      <DetailRow label="Farmer Name" value={weightSlip.farmerName} />
      <DetailRow label="Quantity Mentioned" value={weightSlip.quantityMentioned} />
      <View style={styles.buttonRow}>
        <Pressable style={styles.outlineButton} onPress={onView} disabled={!weightSlip.available}>
          <Text style={styles.outlineButtonText}>View Weight Slip</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={onDownload} disabled={!weightSlip.available}>
          <Text style={styles.outlineButtonText}>Download</Text>
        </Pressable>
      </View>
      <View style={styles.buttonRow}>
        <Pressable style={[styles.outlineButton, weightSlip.approved === true && styles.miniApproved]} onPress={onApprove}>
          <Text style={styles.outlineButtonText}>Approve Weight Slip</Text>
        </Pressable>
        <Pressable style={[styles.outlineButton, styles.dangerOutline, weightSlip.approved === false && styles.miniRejected]} onPress={onReject}>
          <Text style={[styles.outlineButtonText, styles.dangerText]}>Reject Weight Slip</Text>
        </Pressable>
      </View>
    </SectionCard>
  );
}

interface RemarksSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function OfficerRemarksSection({ value, onChange }: RemarksSectionProps) {
  return (
    <SectionCard title="Officer Remarks">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Add verification remarks"
        placeholderTextColor={officerTheme.outline}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
        style={styles.remarksArea}
      />
      <Text style={styles.helperText}>
        Example: Feedstock quantity verified physically. GPS and weight slip matched successfully.
      </Text>
    </SectionCard>
  );
}

interface ResultSectionProps {
  value: VerificationResult;
  onChange: (value: VerificationResult) => void;
  correctionNotes: string;
  onCorrectionNotesChange: (value: string) => void;
  requiredChanges: string;
  onRequiredChangesChange: (value: string) => void;
  rejectionReason: string;
  onRejectionReasonChange: (value: string) => void;
}

export function VerificationResultSection({
  value,
  onChange,
  correctionNotes,
  onCorrectionNotesChange,
  requiredChanges,
  onRequiredChangesChange,
  rejectionReason,
  onRejectionReasonChange,
}: ResultSectionProps) {
  return (
    <SectionCard title="Verification Result">
      {VERIFICATION_RESULT_OPTIONS.map((option) => (
        <Pressable key={option.value} style={styles.radioRow} onPress={() => onChange(option.value)}>
          <View style={[styles.radioOuter, value === option.value && styles.radioOuterSelected]}>
            {value === option.value ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}

      {value === 'correction_required' ? (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Correction Notes</Text>
          <TextInput
            value={correctionNotes}
            onChangeText={onCorrectionNotesChange}
            placeholder="Describe required corrections"
            placeholderTextColor={officerTheme.outline}
            multiline
            style={styles.remarksArea}
          />
          <Text style={styles.fieldLabel}>Required Changes</Text>
          <TextInput
            value={requiredChanges}
            onChangeText={onRequiredChangesChange}
            placeholder="List required changes for farmer"
            placeholderTextColor={officerTheme.outline}
            multiline
            style={styles.remarksArea}
          />
        </View>
      ) : null}

      {value === 'rejected' ? (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Rejection Reason</Text>
          <TextInput
            value={rejectionReason}
            onChangeText={onRejectionReasonChange}
            placeholder="Explain why this record is rejected"
            placeholderTextColor={officerTheme.outline}
            multiline
            style={styles.remarksArea}
          />
        </View>
      ) : null}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: officerTheme.primary,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 148,
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurfaceVariant,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: officerTheme.onSurface,
    textAlign: 'right',
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  inlineBadge: { alignSelf: 'flex-start' },
  badgePending: { backgroundColor: '#FEFCE8', borderWidth: 1, borderColor: '#CA8A04' },
  badgeApproved: { backgroundColor: officerTheme.secondaryContainer, borderWidth: 1, borderColor: officerTheme.secondary },
  badgeRejected: { backgroundColor: officerTheme.errorContainer, borderWidth: 1, borderColor: officerTheme.error },
  badgeCorrection: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: officerTheme.tertiaryContainer },
  badgeNeutral: { backgroundColor: officerTheme.surfaceContainer, borderWidth: 1, borderColor: officerTheme.outlineVariant },
  badgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurface },
  checklistItem: { gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: officerTheme.outlineVariant },
  checklistLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  passFailRow: { flexDirection: 'row', gap: 8 },
  passFailButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  passSelected: { backgroundColor: officerTheme.secondaryContainer, borderColor: officerTheme.primaryContainer },
  failSelected: { backgroundColor: officerTheme.errorContainer, borderColor: officerTheme.error },
  passFailText: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  passFailTextSelected: { color: officerTheme.primary },
  remarksInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.background,
  },
  mapPreviewWrap: { borderRadius: 12, overflow: 'hidden', height: 160, marginTop: 4 },
  mapPreview: { width: '100%', height: '100%' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outlineButton: {
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: officerTheme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLow,
  },
  dangerOutline: { borderColor: officerTheme.error },
  outlineButtonText: { fontSize: 13, fontWeight: '600', color: officerTheme.primaryContainer },
  dangerText: { color: officerTheme.error },
  metaLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoTile: { width: '47%', gap: 6 },
  photoThumb: { width: '100%', height: 110, borderRadius: 10, backgroundColor: officerTheme.surfaceContainer },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  miniButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: officerTheme.surfaceContainer,
  },
  miniApproved: { backgroundColor: officerTheme.secondaryContainer },
  miniRejected: { backgroundColor: officerTheme.errorContainer },
  miniButtonText: { fontSize: 11, fontWeight: '700', color: officerTheme.onSurface },
  remarksArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.background,
  },
  helperText: { fontSize: 12, color: officerTheme.outline, lineHeight: 18 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: officerTheme.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: officerTheme.primaryContainer },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: officerTheme.primaryContainer },
  radioLabel: { fontSize: 15, fontWeight: '600', color: officerTheme.onSurface },
  conditionalBlock: { gap: 8, marginTop: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
});
