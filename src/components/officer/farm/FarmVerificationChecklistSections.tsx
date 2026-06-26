import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { VerificationResult } from '../../../constants/feedstockVerificationChecklist';
import {
  BOUNDARY_ISSUE_OPTIONS,
  CROP_CONDITION_OPTIONS,
  FARM_ACTIVE_STATUS_CHECKLIST,
  FARM_BOUNDARY_CHECKLIST,
  FARM_CROP_CHECKLIST,
  FARM_CROP_PHOTO_KEYS,
  FARM_EXISTENCE_CHECKLIST,
  FARM_EXISTENCE_PHOTO_KEYS,
  FARM_LAND_AREA_CHECKLIST,
  FARM_PHOTO_LABELS,
  FARM_STATUS_OPTIONS,
  FARM_VERIFICATION_PROGRESS_STEPS,
  FARM_VERIFICATION_RESULT_OPTIONS,
  type BoundaryIssueType,
  type CropCondition,
  type FarmActiveStatus,
  type FarmPhotoKey,
} from '../../../constants/farmVerificationChecklist';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import {
  areaDifferenceTone,
  isFarmProgressStepComplete,
  type FarmVerificationState,
  type FarmVerificationViewModel,
} from '../../../utils/farmVerificationHelpers';
import { statusBadgeTone } from '../../../utils/mrvVerificationHelpers';
import { buildStaticMapPreviewUrl } from '../../../utils/officerGpsCapture';
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
      <Text style={styles.detailValue} numberOfLines={3}>
        {value}
      </Text>
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
        {checked ? (
          <BhuguardMaterialIcon name="verified" size={16} color={officerTheme.onPrimary} filled />
        ) : null}
      </View>
      <Text style={styles.checklistLabel}>{label}</Text>
    </Pressable>
  );
}

function RemarksInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  return (
    <>
      <Text style={styles.remarksLabel}>Officer Remarks</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Add officer remarks'}
        placeholderTextColor={officerTheme.outline}
        style={styles.remarksInput}
        multiline
      />
    </>
  );
}

function DropdownField<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onSelect: (value: T) => void;
}) {
  return (
    <>
      <Text style={styles.subheading}>{label}</Text>
      <View style={styles.dropdownWrap}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.dropdownOption, value === option.value && styles.dropdownOptionSelected]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[styles.dropdownOptionText, value === option.value && styles.dropdownOptionTextSelected]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function PhotoSlot({
  label,
  uri,
  onTakePhoto,
  onUploadGallery,
}: {
  label: string;
  uri: string | null;
  onTakePhoto: () => void;
  onUploadGallery: () => void;
}) {
  return (
    <View style={styles.photoSlot}>
      <Text style={styles.photoLabel}>{label}</Text>
      {uri ? <Image source={{ uri }} style={styles.photoPreview} resizeMode="cover" /> : null}
      <View style={styles.buttonRow}>
        <ActionButton label="Take Photo" onPress={onTakePhoto} variant="primary" />
        <ActionButton label="Upload Gallery" onPress={onUploadGallery} />
      </View>
    </View>
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

export function FarmVerificationTopCard({ data }: { data: FarmVerificationViewModel }) {
  return (
    <SectionCard title="Top Verification Card">
      <DetailRow label="Visit ID" value={data.visitId} />
      <DetailRow label="Farmer Name" value={data.farmerName} />
      <DetailRow label="Farmer ID" value={data.farmerId} />
      <DetailRow label="Farm Name" value={data.farmName} />
      <DetailRow label="Farm ID" value={data.farmId} />
      <DetailRow label="Project Name" value={data.projectName} />
      <DetailRow label="Project Type" value={data.projectType} />
      <DetailRow label="Village" value={data.village} />
      <DetailRow label="Taluka" value={data.taluka} />
      <DetailRow label="District" value={data.district} />
      <DetailRow label="Verification Date" value={data.verificationDateLabel} />
      <DetailRow label="Officer Name" value={data.officerName} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Current Status</Text>
        <StatusBadge label={data.statusLabel} statusKey={data.statusKey} />
      </View>
    </SectionCard>
  );
}

export function FarmExistenceSection(props: {
  state: FarmVerificationState['existence'];
  photos: FarmVerificationState['photos'];
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onTakePhoto: (key: FarmPhotoKey) => void;
  onUploadGallery: (key: FarmPhotoKey) => void;
}) {
  return (
    <SectionCard title="Section 1 — Farm Existence Verification">
      {FARM_EXISTENCE_CHECKLIST.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={props.state.items[item.key] === true}
          onToggle={() => props.onToggleItem(item.key)}
        />
      ))}
      <RemarksInput value={props.state.remarks} onChangeText={props.onRemarksChange} />
      <Text style={styles.subheading}>Photo Evidence</Text>
      {FARM_EXISTENCE_PHOTO_KEYS.map((key) => (
        <PhotoSlot
          key={key}
          label={FARM_PHOTO_LABELS[key]}
          uri={props.photos[key]}
          onTakePhoto={() => props.onTakePhoto(key)}
          onUploadGallery={() => props.onUploadGallery(key)}
        />
      ))}
    </SectionCard>
  );
}

export function FarmBoundarySection({
  data,
  state,
  onToggleItem,
  onRemarksChange,
  onViewBoundary,
  onOpenFarmMap,
  onVerifyBoundary,
  onIssueTypeChange,
  onCorrectionNotesChange,
}: {
  data: FarmVerificationViewModel;
  state: FarmVerificationState['boundary'];
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onViewBoundary: () => void;
  onOpenFarmMap: () => void;
  onVerifyBoundary: () => void;
  onIssueTypeChange: (value: BoundaryIssueType) => void;
  onCorrectionNotesChange: (text: string) => void;
}) {
  const mapUri =
    data.farmLatitude != null && data.farmLongitude != null
      ? buildStaticMapPreviewUrl(data.farmLatitude, data.farmLongitude, data.farmLatitude, data.farmLongitude)
      : null;

  const hasMismatch = state.items.boundary_matches_registration === false;

  return (
    <SectionCard title="Section 2 — Boundary Verification">
      <Text style={styles.subheading}>Registered Boundary Map</Text>
      <View style={styles.mapWrap}>
        {mapUri ? (
          <Image source={{ uri: mapUri }} style={styles.mapImage} resizeMode="cover" />
        ) : (
          <View style={styles.mapPlaceholder}>
            <BhuguardMaterialIcon name="map" size={32} color={officerTheme.outline} />
            <Text style={styles.mapPlaceholderText}>Boundary map unavailable</Text>
          </View>
        )}
      </View>
      <DetailRow label="Registered Area" value={data.registeredAreaLabel} />
      <DetailRow label="Current GPS Location" value={data.currentGpsLabel} />
      <View style={styles.buttonRow}>
        <ActionButton label="View Boundary" onPress={onViewBoundary} />
        <ActionButton label="Open Farm Map" onPress={onOpenFarmMap} />
      </View>
      <ActionButton label="Verify Boundary" onPress={onVerifyBoundary} variant="primary" />
      {state.boundaryVerified ? (
        <StatusBadge label="Boundary Verified" statusKey="verified" />
      ) : null}
      {FARM_BOUNDARY_CHECKLIST.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={state.items[item.key] === true}
          onToggle={() => onToggleItem(item.key)}
        />
      ))}
      <RemarksInput value={state.remarks} onChangeText={onRemarksChange} />
      {hasMismatch || state.boundaryIssueType ? (
        <>
          <DropdownField
            label="Boundary Issue Type"
            value={state.boundaryIssueType}
            options={[...BOUNDARY_ISSUE_OPTIONS]}
            onSelect={onIssueTypeChange}
          />
          <Text style={styles.remarksLabel}>Correction Notes</Text>
          <TextInput
            value={state.correctionNotes}
            onChangeText={onCorrectionNotesChange}
            placeholder="Describe boundary mismatch or correction needed"
            placeholderTextColor={officerTheme.outline}
            style={styles.remarksInput}
            multiline
          />
        </>
      ) : null}
    </SectionCard>
  );
}

export function FarmLandAreaSection({
  state,
  onToggleItem,
  onRemarksChange,
}: {
  state: FarmVerificationState['landArea'];
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
}) {
  const tone = areaDifferenceTone(state.differencePercent);
  const diffLabel =
    state.differencePercent != null ? `${state.differencePercent}%` : '—';

  return (
    <SectionCard title="Section 3 — Land Area Verification">
      <DetailRow label="Registered Area" value={state.registeredMetrics.label} />
      <DetailRow label="Current Survey Area" value={state.currentMetrics.label} />
      {FARM_LAND_AREA_CHECKLIST.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={state.items[item.key] === true}
          onToggle={() => onToggleItem(item.key)}
        />
      ))}
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Area Difference</Text>
        <StatusBadge
          label={diffLabel}
          statusKey={tone === 'success' ? 'verified' : 'correction'}
        />
      </View>
      <DetailRow
        label="Difference Rule"
        value={tone === 'success' ? 'Within 5% limit' : 'Exceeds 5% — review required'}
      />
      <RemarksInput value={state.remarks} onChangeText={onRemarksChange} />
    </SectionCard>
  );
}

export function FarmCropSection({
  data,
  state,
  photos,
  onToggleItem,
  onRemarksChange,
  onCropConditionChange,
  onTakePhoto,
  onUploadGallery,
}: {
  data: FarmVerificationViewModel;
  state: FarmVerificationState['crop'];
  photos: FarmVerificationState['photos'];
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onCropConditionChange: (value: CropCondition) => void;
  onTakePhoto: (key: FarmPhotoKey) => void;
  onUploadGallery: (key: FarmPhotoKey) => void;
}) {
  return (
    <SectionCard title="Section 4 — Crop Details Verification">
      <DetailRow label="Registered Crop" value={data.registeredCrop} />
      <DetailRow label="Crop Season" value={data.cropSeason} />
      <DetailRow label="Plantation Date" value={data.plantationDate} />
      {FARM_CROP_CHECKLIST.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={state.items[item.key] === true}
          onToggle={() => onToggleItem(item.key)}
        />
      ))}
      <DropdownField
        label="Crop Condition"
        value={state.cropCondition}
        options={[...CROP_CONDITION_OPTIONS]}
        onSelect={onCropConditionChange}
      />
      <RemarksInput value={state.remarks} onChangeText={onRemarksChange} />
      <Text style={styles.subheading}>Photo Evidence</Text>
      {FARM_CROP_PHOTO_KEYS.map((key) => (
        <PhotoSlot
          key={key}
          label={FARM_PHOTO_LABELS[key]}
          uri={photos[key]}
          onTakePhoto={() => onTakePhoto(key)}
          onUploadGallery={() => onUploadGallery(key)}
        />
      ))}
    </SectionCard>
  );
}

export function FarmActiveStatusSection({
  state,
  onToggleItem,
  onRemarksChange,
  onFarmStatusChange,
}: {
  state: FarmVerificationState['activeStatus'];
  onToggleItem: (key: string) => void;
  onRemarksChange: (text: string) => void;
  onFarmStatusChange: (value: FarmActiveStatus) => void;
}) {
  return (
    <SectionCard title="Section 5 — Farm Active Status">
      {FARM_ACTIVE_STATUS_CHECKLIST.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={state.items[item.key] === true}
          onToggle={() => onToggleItem(item.key)}
        />
      ))}
      <DropdownField
        label="Farm Status"
        value={state.farmStatus}
        options={[...FARM_STATUS_OPTIONS]}
        onSelect={onFarmStatusChange}
      />
      <RemarksInput value={state.remarks} onChangeText={onRemarksChange} placeholder="Remarks" />
    </SectionCard>
  );
}

export function FarmEvidenceSummarySection({
  evidence,
  onViewEvidence,
  onAddEvidence,
}: {
  evidence: FarmVerificationState['evidence'];
  onViewEvidence: () => void;
  onAddEvidence: () => void;
}) {
  return (
    <SectionCard title="Section 6 — Verification Evidence">
      <Text style={styles.subheading}>Evidence Summary</Text>
      <DetailRow label="GPS Captured" value={evidence.gpsCaptured ? 'Yes' : 'No'} />
      <DetailRow label="Boundary Verified" value={evidence.boundaryVerified ? 'Yes' : 'No'} />
      <DetailRow label="Photos Uploaded" value={String(evidence.photosUploaded)} />
      <DetailRow label="Documents Reviewed" value={evidence.documentsReviewed ? 'Yes' : 'No'} />
      <View style={styles.buttonRow}>
        <ActionButton label="View Evidence" onPress={onViewEvidence} />
        <ActionButton label="Add More Evidence" onPress={onAddEvidence} variant="primary" />
      </View>
    </SectionCard>
  );
}

export function FarmDigitalSignatureSection({
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
    <SectionCard title="Section 7 — Digital Signature">
      <SignaturePad
        title="Farmer Signature"
        captured={farmerCaptured}
        onCapture={onCaptureFarmer}
        onClear={onClearFarmer}
      />
      <SignaturePad
        title="Field Officer Signature"
        captured={officerCaptured}
        onCapture={onCaptureOfficer}
        onClear={onClearOfficer}
      />
    </SectionCard>
  );
}

export function FarmVerificationResultSection({
  state,
  completionPercent,
  verificationResult,
  onSelectResult,
}: {
  state: FarmVerificationState;
  completionPercent: number;
  verificationResult: VerificationResult;
  onSelectResult: (value: VerificationResult) => void;
}) {
  return (
    <SectionCard title="Section 8 — Verification Result">
      <Text style={styles.subheading}>Auto Progress</Text>
      {FARM_VERIFICATION_PROGRESS_STEPS.map((step) => {
        const done = isFarmProgressStepComplete(state, step.key);

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
      {FARM_VERIFICATION_RESULT_OPTIONS.map((option) => (
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

export function FarmFinalRemarksSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 9 — Final Remarks">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Farm physically verified. Boundary, area and crop details matched registered records."
        placeholderTextColor={officerTheme.outline}
        style={styles.finalRemarksInput}
        multiline
        textAlignVertical="top"
      />
    </SectionCard>
  );
}

export function FarmVerificationBottomActions({
  saving,
  onSaveDraft,
  onSubmitVerification,
  onRequestCorrection,
  onReject,
}: {
  saving: boolean;
  onSaveDraft: () => void;
  onSubmitVerification: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.bottomActions}>
      <ActionButton label={saving ? 'Saving…' : 'Save Draft'} onPress={onSaveDraft} />
      <ActionButton label="Submit Verification" onPress={onSubmitVerification} variant="primary" />
      <ActionButton label="Request Correction" onPress={onRequestCorrection} />
      <ActionButton label="Reject Verification" onPress={onReject} variant="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    gap: 10,
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
    alignItems: 'flex-start',
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: officerTheme.outline,
  },
  detailValue: {
    flex: 1.2,
    fontSize: 13,
    color: officerTheme.onSurface,
    textAlign: 'right',
    fontWeight: '600',
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  badgeApproved: { backgroundColor: '#D7F5E3' },
  badgeRejected: { backgroundColor: officerTheme.errorContainer },
  badgeCorrection: { backgroundColor: '#FFF3CD' },
  badgePending: { backgroundColor: officerTheme.surfaceContainer },
  badgeNeutral: { backgroundColor: officerTheme.surfaceLow },
  subheading: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onSurface,
    marginTop: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 48,
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
    fontSize: 14,
    color: officerTheme.onSurface,
    lineHeight: 20,
  },
  remarksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
    marginTop: 4,
  },
  remarksInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.surfaceLowest,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: officerTheme.primaryContainer },
  actionSecondary: {
    backgroundColor: officerTheme.surfaceLow,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
  },
  actionDanger: { backgroundColor: officerTheme.error },
  actionButtonText: { fontSize: 13, fontWeight: '700' },
  actionTextLight: { color: officerTheme.onPrimary },
  actionTextDark: { color: officerTheme.primary },
  mapWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: officerTheme.surfaceLow,
    minHeight: 160,
  },
  mapImage: { width: '100%', height: 160 },
  mapPlaceholder: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPlaceholderText: { fontSize: 13, color: officerTheme.outline },
  dropdownWrap: { gap: 8 },
  dropdownOption: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  dropdownOptionSelected: {
    borderColor: officerTheme.primaryContainer,
    backgroundColor: '#E8F8EE',
  },
  dropdownOptionText: { fontSize: 13, color: officerTheme.onSurface },
  dropdownOptionTextSelected: { color: officerTheme.primary, fontWeight: '700' },
  photoSlot: { gap: 8, marginTop: 4 },
  photoLabel: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  photoPreview: { width: '100%', height: 140, borderRadius: 12 },
  signatureBlock: { gap: 8 },
  signaturePad: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: officerTheme.surfaceLow,
  },
  signaturePadCaptured: {
    borderStyle: 'solid',
    borderColor: officerTheme.primaryContainer,
    backgroundColor: '#E8F8EE',
  },
  signatureHint: { fontSize: 13, color: officerTheme.outline },
  signatureCapturedText: { fontSize: 13, fontWeight: '700', color: officerTheme.primary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  progressLabel: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  progressLabelDone: { color: officerTheme.primary, fontWeight: '600' },
  completionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  completionLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  completionValue: { fontSize: 20, fontWeight: '800', color: officerTheme.primary },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, minHeight: 44 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: officerTheme.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: officerTheme.primaryContainer },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: officerTheme.primaryContainer,
  },
  radioLabel: { fontSize: 14, color: officerTheme.onSurface },
  finalRemarksInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.surfaceLowest,
  },
  bottomActions: { gap: 10, marginTop: 4, marginBottom: 8 },
});
