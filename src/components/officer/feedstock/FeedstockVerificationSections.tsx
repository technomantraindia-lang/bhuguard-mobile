import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  FEEDSTOCK_COLLECTION_DATE_CHECKLIST,
  FEEDSTOCK_GPS_CHECKLIST,
  FEEDSTOCK_PHOTOS_CHECKLIST,
  FEEDSTOCK_QUANTITY_CHECKLIST,
  FEEDSTOCK_TYPE_CHECKLIST,
  FEEDSTOCK_VERIFICATION_PROGRESS_STEPS,
  FEEDSTOCK_WEIGHT_SLIP_CHECKLIST,
  VERIFICATION_RESULT_OPTIONS,
  type FeedstockSectionChecklistDef,
  type SectionResult,
  type VerificationResult,
} from '../../../constants/feedstockVerificationChecklist';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import type { FeedstockVerificationFormState, FeedstockVerificationViewModel } from '../../../utils/feedstockVerificationHelpers';
import {
  isFeedstockProgressStepComplete,
  parseQuantityDifference,
  sectionResultBadgeTone,
  statusBadgeTone,
} from '../../../utils/feedstockVerificationHelpers';
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

function ResultBadge({ result }: { result: SectionResult }) {
  if (!result) {
    return null;
  }

  const label = result === 'pass' ? 'Pass' : result === 'fail' ? 'Fail' : 'Needs Correction';
  const tone = sectionResultBadgeTone(result);
  const toneStyle =
    tone === 'approved'
      ? styles.badgeApproved
      : tone === 'rejected'
        ? styles.badgeRejected
        : tone === 'correction'
          ? styles.badgeCorrection
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
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  const buttonStyle =
    variant === 'primary' ? styles.actionPrimary : variant === 'danger' ? styles.actionDanger : styles.actionSecondary;
  const textStyle =
    variant === 'primary' || variant === 'danger' ? styles.actionTextLight : styles.actionTextDark;

  return (
    <Pressable
      style={[styles.actionButton, buttonStyle, disabled && styles.actionDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
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

function SectionResultPicker({
  value,
  onChange,
}: {
  value: SectionResult;
  onChange: (result: SectionResult) => void;
}) {
  const options: Array<{ value: SectionResult; label: string }> = [
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' },
    { value: 'needs_correction', label: 'Needs Correction' },
  ];

  return (
    <View style={styles.resultPickerRow}>
      {options.map((option) => (
        <Pressable
          key={option.value ?? 'none'}
          style={[
            styles.resultChip,
            value === option.value &&
              (option.value === 'pass'
                ? styles.resultChipPass
                : option.value === 'fail'
                  ? styles.resultChipFail
                  : styles.resultChipCorrection),
          ]}
          onPress={() => onChange(option.value)}
        >
          <Text
            style={[
              styles.resultChipText,
              value === option.value && styles.resultChipTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function SectionChecklistBlock({
  defs,
  items,
  onToggle,
}: {
  defs: FeedstockSectionChecklistDef[];
  items: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <>
      {defs.map((item) => (
        <ChecklistRow
          key={item.key}
          label={item.label}
          checked={items[item.key] === true}
          onToggle={() => onToggle(item.key)}
        />
      ))}
    </>
  );
}

function RemarksField({
  value,
  onChangeText,
  placeholder = 'Add remarks',
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={officerTheme.outline}
      style={styles.remarksInput}
      multiline
      textAlignVertical="top"
    />
  );
}

export function FeedstockVerificationTopCard({ data }: { data: FeedstockVerificationViewModel }) {
  return (
    <SectionCard title="Top Verification Card">
      <DetailRow label="Visit ID" value={data.visitId} />
      <DetailRow label="Verification ID" value={data.verificationCode} />
      <DetailRow label="Farmer Name" value={data.farmerName} />
      <DetailRow label="Farmer ID" value={data.farmerCode} />
      <DetailRow label="Farm Name" value={data.farmName} />
      <DetailRow label="Farm ID" value={data.farmId} />
      <DetailRow label="Project" value={data.projectName} />
      <DetailRow label="Village" value={data.village} />
      <DetailRow label="Taluka" value={data.taluka} />
      <DetailRow label="District" value={data.district} />
      <DetailRow label="Officer Name" value={data.officerName} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Current Status</Text>
        <StatusBadge label={data.verificationStatusLabel} statusKey={data.verificationStatus} />
      </View>
    </SectionCard>
  );
}

export function SubmittedFeedstockRecordSection({ data }: { data: FeedstockVerificationViewModel }) {
  return (
    <SectionCard title="Section 1 — Submitted Feedstock Record">
      <DetailRow label="Feedstock Record ID" value={data.feedstockCode} />
      <DetailRow label="Feedstock Type" value={data.feedstockTypeLabel} />
      <DetailRow label="Quantity" value={data.quantityLabel} />
      <DetailRow label="Collection Date" value={data.collectionDateLabel} />
      <DetailRow label="Submitted Date" value={data.submittedDateLabel} />
      <DetailRow label="Submitted By" value={data.submittedBy} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Status</Text>
        <StatusBadge label={data.recordStatusLabel} statusKey={data.recordStatusLabel} />
      </View>
    </SectionCard>
  );
}

export function FeedstockTypeVerificationSection({
  state,
  onToggleItem,
  onResultChange,
  onRemarksChange,
}: {
  state: FeedstockVerificationFormState['sections']['typeVerification'];
  onToggleItem: (key: string) => void;
  onResultChange: (result: SectionResult) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 2 — Feedstock Type Verification">
      <SectionChecklistBlock
        defs={FEEDSTOCK_TYPE_CHECKLIST}
        items={state.items}
        onToggle={onToggleItem}
      />
      <Text style={styles.subheading}>Result</Text>
      <SectionResultPicker value={state.result} onChange={onResultChange} />
      {state.result ? <ResultBadge result={state.result} /> : null}
      <RemarksField value={state.remarks} onChangeText={onRemarksChange} />
    </SectionCard>
  );
}

export function QuantityVerificationSection({
  data,
  state,
  officerObservedQuantity,
  onObservedQuantityChange,
  onToggleItem,
  onResultChange,
  onRemarksChange,
}: {
  data: FeedstockVerificationViewModel;
  state: FeedstockVerificationFormState['sections']['quantityVerification'];
  officerObservedQuantity: string;
  onObservedQuantityChange: (value: string) => void;
  onToggleItem: (key: string) => void;
  onResultChange: (result: SectionResult) => void;
  onRemarksChange: (text: string) => void;
}) {
  const difference = parseQuantityDifference(data.quantityValue, officerObservedQuantity);

  return (
    <SectionCard title="Section 3 — Quantity Verification">
      <DetailRow label="Submitted Quantity" value={data.quantityLabel} />
      <DetailRow label="Weight Slip Quantity" value={data.weightSlipQuantityLabel} />
      <Text style={styles.fieldLabel}>Officer Observed Quantity</Text>
      <TextInput
        value={officerObservedQuantity}
        onChangeText={onObservedQuantityChange}
        placeholder="Enter observed quantity"
        placeholderTextColor={officerTheme.outline}
        keyboardType="decimal-pad"
        style={styles.singleLineInput}
      />
      <DetailRow label="Difference" value={`${difference} ${data.quantityUnit}`} />
      <SectionChecklistBlock
        defs={FEEDSTOCK_QUANTITY_CHECKLIST}
        items={state.items}
        onToggle={onToggleItem}
      />
      <Text style={styles.subheading}>Result</Text>
      <SectionResultPicker value={state.result} onChange={onResultChange} />
      {state.result ? <ResultBadge result={state.result} /> : null}
      <RemarksField value={state.remarks} onChangeText={onRemarksChange} />
    </SectionCard>
  );
}

export function CollectionDateVerificationSection({
  data,
  state,
  onToggleItem,
  onResultChange,
  onRemarksChange,
}: {
  data: FeedstockVerificationViewModel;
  state: FeedstockVerificationFormState['sections']['collectionDateVerification'];
  onToggleItem: (key: string) => void;
  onResultChange: (result: SectionResult) => void;
  onRemarksChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 4 — Collection Date Verification">
      <DetailRow label="Farmer Submitted Date" value={data.collectionDateLabel} />
      <DetailRow label="Officer Verified Date" value={data.officerVerifiedDateLabel} />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Time Window Status</Text>
        <StatusBadge label={data.timeWindowStatus} statusKey={data.timeWindowStatus} />
      </View>
      <SectionChecklistBlock
        defs={FEEDSTOCK_COLLECTION_DATE_CHECKLIST}
        items={state.items}
        onToggle={onToggleItem}
      />
      <Text style={styles.subheading}>Result</Text>
      <SectionResultPicker value={state.result} onChange={onResultChange} />
      {state.result ? <ResultBadge result={state.result} /> : null}
      <RemarksField value={state.remarks} onChangeText={onRemarksChange} placeholder="Add collection date remarks" />
    </SectionCard>
  );
}

export function WeightSlipVerificationSection({
  data,
  state,
  weightSlipApproved,
  weightSlipRejectionReason,
  onToggleItem,
  onResultChange,
  onRemarksChange,
  onView,
  onDownload,
  onApprove,
  onReject,
  onRejectionReasonChange,
}: {
  data: FeedstockVerificationViewModel;
  state: FeedstockVerificationFormState['sections']['weightSlipVerification'];
  weightSlipApproved: boolean | null;
  weightSlipRejectionReason: string;
  onToggleItem: (key: string) => void;
  onResultChange: (result: SectionResult) => void;
  onRemarksChange: (text: string) => void;
  onView: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRejectionReasonChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 5 — Weight Slip Verification">
      <DetailRow label="Weight Slip File" value={data.weightSlip.available ? 'Available' : 'Not uploaded'} />
      <DetailRow label="File Type" value={data.weightSlip.fileType} />
      <DetailRow label="Uploaded Date" value={data.weightSlip.uploadedLabel} />
      <DetailRow label="Farmer Name" value={data.weightSlip.farmerName} />
      <DetailRow label="Quantity Mentioned" value={data.weightSlip.quantityMentioned} />
      <View style={styles.buttonRow}>
        <ActionButton label="View Weight Slip" onPress={onView} disabled={!data.weightSlip.available} />
        <ActionButton label="Download" onPress={onDownload} disabled={!data.weightSlip.available} />
      </View>
      <View style={styles.buttonRow}>
        <ActionButton
          label="Approve Weight Slip"
          onPress={onApprove}
          variant={weightSlipApproved === true ? 'primary' : 'secondary'}
        />
        <ActionButton
          label="Reject Weight Slip"
          onPress={onReject}
          variant={weightSlipApproved === false ? 'danger' : 'secondary'}
        />
      </View>
      <SectionChecklistBlock
        defs={FEEDSTOCK_WEIGHT_SLIP_CHECKLIST}
        items={state.items}
        onToggle={onToggleItem}
      />
      <Text style={styles.subheading}>Result</Text>
      <SectionResultPicker value={state.result} onChange={onResultChange} />
      {weightSlipApproved === false ? (
        <>
          <Text style={styles.fieldLabel}>Rejection Reason *</Text>
          <RemarksField
            value={weightSlipRejectionReason}
            onChangeText={onRejectionReasonChange}
            placeholder="Explain why the weight slip is rejected"
          />
        </>
      ) : null}
      <RemarksField value={state.remarks} onChangeText={onRemarksChange} />
    </SectionCard>
  );
}

export function GpsVerificationSection({
  data,
  state,
  gpsVerified,
  gpsFlagged,
  gpsOverrideReason,
  gpsOverridePhotoUri,
  onToggleItem,
  onResultChange,
  onRemarksChange,
  onOpenMap,
  onVerifyGps,
  onFlagGps,
  onOverrideReasonChange,
  onCaptureOverridePhoto,
}: {
  data: FeedstockVerificationViewModel;
  state: FeedstockVerificationFormState['sections']['gpsVerification'];
  gpsVerified: boolean | null;
  gpsFlagged: boolean;
  gpsOverrideReason: string;
  gpsOverridePhotoUri: string | null;
  onToggleItem: (key: string) => void;
  onResultChange: (result: SectionResult) => void;
  onRemarksChange: (text: string) => void;
  onOpenMap: () => void;
  onVerifyGps: () => void;
  onFlagGps: () => void;
  onOverrideReasonChange: (text: string) => void;
  onCaptureOverridePhoto: () => void;
}) {
  const mapUri =
    data.gps.latitude != null && data.gps.longitude != null
      ? buildStaticMapPreviewUrl(
          data.gps.latitude,
          data.gps.longitude,
          data.gps.farmLatitude ?? data.gps.latitude,
          data.gps.farmLongitude ?? data.gps.longitude,
        )
      : null;

  const outsideRadius =
    data.gps.distanceFromFarmM != null && data.gps.distanceFromFarmM > data.gps.allowedRadiusM;

  return (
    <SectionCard title="Section 6 — GPS Verification">
      <DetailRow label="Feedstock Collection Latitude" value={data.gps.latitude?.toFixed(6) ?? '—'} />
      <DetailRow label="Feedstock Collection Longitude" value={data.gps.longitude?.toFixed(6) ?? '—'} />
      <DetailRow label="GPS Accuracy" value={data.gps.accuracyM != null ? `${data.gps.accuracyM} m` : '—'} />
      <DetailRow
        label="Distance from Registered Farm"
        value={
          data.gps.distanceFromFarmM != null
            ? `${data.gps.distanceFromFarmM} m`
            : data.gps.distanceFromFarmKm != null
              ? `${data.gps.distanceFromFarmKm} km`
              : '—'
        }
      />
      <View style={styles.inlineRow}>
        <Text style={styles.detailLabel}>Collection Location Status</Text>
        <StatusBadge label={data.gps.locationStatus} statusKey={data.gps.locationStatus} />
      </View>
      {mapUri ? (
        <View style={styles.mapPreviewWrap}>
          <Image source={{ uri: mapUri }} style={styles.mapPreview} resizeMode="cover" />
          <View style={styles.mapLegend}>
            <Text style={styles.mapLegendText}>Farm marker • Collection marker • Radius circle</Text>
          </View>
        </View>
      ) : null}
      {gpsVerified ? (
        <StatusBadge label="GPS Verified" statusKey="verified" />
      ) : null}
      {gpsFlagged ? (
        <StatusBadge label="GPS Issue Flagged" statusKey="correction" />
      ) : null}
      <View style={styles.buttonRow}>
        <ActionButton label="Open Map" onPress={onOpenMap} />
        <ActionButton label="Verify GPS" onPress={onVerifyGps} variant="primary" />
        <ActionButton label="Flag GPS Issue" onPress={onFlagGps} variant="danger" />
      </View>
      <SectionChecklistBlock defs={FEEDSTOCK_GPS_CHECKLIST} items={state.items} onToggle={onToggleItem} />
      <Text style={styles.subheading}>Result</Text>
      <SectionResultPicker value={state.result} onChange={onResultChange} />
      {(outsideRadius || gpsFlagged) && (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Override Reason *</Text>
          <RemarksField
            value={gpsOverrideReason}
            onChangeText={onOverrideReasonChange}
            placeholder="Explain GPS override reason"
          />
          <Text style={styles.fieldLabel}>Proof Photo Required *</Text>
          {gpsOverridePhotoUri ? (
            <Image source={{ uri: gpsOverridePhotoUri }} style={styles.overridePhoto} resizeMode="cover" />
          ) : null}
          <ActionButton label="Capture Proof Photo" onPress={onCaptureOverridePhoto} variant="primary" />
        </View>
      )}
      <RemarksField value={state.remarks} onChangeText={onRemarksChange} />
    </SectionCard>
  );
}

export function PhotosVerificationSection({
  data,
  state,
  photoReviews,
  onToggleItem,
  onResultChange,
  onRemarksChange,
  onPhotoPress,
  onApprovePhoto,
  onRejectPhoto,
  onPhotoRemarkChange,
  onPhotoRejectionReasonChange,
  onAddMoreEvidence,
}: {
  data: FeedstockVerificationViewModel;
  state: FeedstockVerificationFormState['sections']['photosVerification'];
  photoReviews: FeedstockVerificationFormState['photoReviews'];
  onToggleItem: (key: string) => void;
  onResultChange: (result: SectionResult) => void;
  onRemarksChange: (text: string) => void;
  onPhotoPress: (photoId: number, url: string) => void;
  onApprovePhoto: (photoId: number) => void;
  onRejectPhoto: (photoId: number) => void;
  onPhotoRemarkChange: (photoId: number, remark: string) => void;
  onPhotoRejectionReasonChange: (photoId: number, reason: string) => void;
  onAddMoreEvidence: () => void;
}) {
  return (
    <SectionCard title="Section 7 — Photos Verification">
      <Text style={styles.metaLabel}>Photo Evidence ({data.photosCount})</Text>
      <View style={styles.photoGrid}>
        {data.photos.map((photo, index) => {
          const review = photoReviews.find((item) => item.photoId === photo.id);

          return (
            <View key={photo.id} style={styles.photoCard}>
              <Text style={styles.photoCardTitle}>Photo {index + 1}</Text>
              <Pressable onPress={() => onPhotoPress(photo.id, photo.url)}>
                <Image source={{ uri: photo.url }} style={styles.photoThumb} resizeMode="cover" />
              </Pressable>
              <View style={styles.photoActions}>
                <ActionButton label="View Fullscreen" onPress={() => onPhotoPress(photo.id, photo.url)} />
                <ActionButton
                  label="Approve"
                  onPress={() => onApprovePhoto(photo.id)}
                  variant={review?.approved ? 'primary' : 'secondary'}
                />
                <ActionButton
                  label="Reject"
                  onPress={() => onRejectPhoto(photo.id)}
                  variant={review?.rejected ? 'danger' : 'secondary'}
                />
              </View>
              <TextInput
                value={review?.remark ?? ''}
                onChangeText={(text) => onPhotoRemarkChange(photo.id, text)}
                placeholder="Add remark"
                placeholderTextColor={officerTheme.outline}
                style={styles.photoRemarkInput}
              />
              {review?.rejected ? (
                <TextInput
                  value={review.rejectionReason}
                  onChangeText={(text) => onPhotoRejectionReasonChange(photo.id, text)}
                  placeholder="Rejection reason *"
                  placeholderTextColor={officerTheme.outline}
                  style={styles.photoRemarkInput}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <ActionButton label="Add More Evidence" onPress={onAddMoreEvidence} variant="primary" />
      <SectionChecklistBlock defs={FEEDSTOCK_PHOTOS_CHECKLIST} items={state.items} onToggle={onToggleItem} />
      <Text style={styles.subheading}>Result</Text>
      <SectionResultPicker value={state.result} onChange={onResultChange} />
      <RemarksField value={state.remarks} onChangeText={onRemarksChange} />
    </SectionCard>
  );
}

export function OfficerAdditionalEvidenceSection({
  evidencePhotos,
  onCaptureFeedstockPhoto,
  onUploadAdditionalPhoto,
  onCaptureGpsAgain,
  onAddDocument,
}: {
  evidencePhotos: string[];
  onCaptureFeedstockPhoto: () => void;
  onUploadAdditionalPhoto: () => void;
  onCaptureGpsAgain: () => void;
  onAddDocument: () => void;
}) {
  return (
    <SectionCard title="Section 8 — Officer Additional Evidence">
      <Text style={styles.helperText}>Optional uploads to support verification audit trail.</Text>
      <View style={styles.buttonRow}>
        <ActionButton label="Capture Feedstock Photo" onPress={onCaptureFeedstockPhoto} variant="primary" />
        <ActionButton label="Upload Additional Photo" onPress={onUploadAdditionalPhoto} />
      </View>
      <View style={styles.buttonRow}>
        <ActionButton label="Capture GPS Again" onPress={onCaptureGpsAgain} />
        <ActionButton label="Add Document" onPress={onAddDocument} />
      </View>
      {evidencePhotos.length > 0 ? (
        <View style={styles.photoGrid}>
          {evidencePhotos.map((uri, index) => (
            <Image key={`${uri}-${index}`} source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
          ))}
        </View>
      ) : null}
    </SectionCard>
  );
}

export function VerificationSummarySection({
  formState,
  data,
  completionPercent,
}: {
  formState: FeedstockVerificationFormState;
  data: FeedstockVerificationViewModel;
  completionPercent: number;
}) {
  return (
    <SectionCard title="Section 9 — Verification Summary">
      <Text style={styles.subheading}>Auto Progress</Text>
      {FEEDSTOCK_VERIFICATION_PROGRESS_STEPS.map((step) => {
        const done = isFeedstockProgressStepComplete(formState, step.key, data);

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
    </SectionCard>
  );
}

export function FinalVerificationResultSection({
  verificationResult,
  correctionNotes,
  requiredChanges,
  correctionDueDate,
  rejectionReason,
  evidenceNotes,
  finalRemarks,
  onSelectResult,
  onCorrectionNotesChange,
  onRequiredChangesChange,
  onCorrectionDueDateChange,
  onRejectionReasonChange,
  onEvidenceNotesChange,
  onFinalRemarksChange,
}: {
  verificationResult: VerificationResult;
  correctionNotes: string;
  requiredChanges: string;
  correctionDueDate: string;
  rejectionReason: string;
  evidenceNotes: string;
  finalRemarks: string;
  onSelectResult: (value: VerificationResult) => void;
  onCorrectionNotesChange: (text: string) => void;
  onRequiredChangesChange: (text: string) => void;
  onCorrectionDueDateChange: (text: string) => void;
  onRejectionReasonChange: (text: string) => void;
  onEvidenceNotesChange: (text: string) => void;
  onFinalRemarksChange: (text: string) => void;
}) {
  return (
    <SectionCard title="Section 10 — Final Verification Result">
      {VERIFICATION_RESULT_OPTIONS.map((option) => (
        <Pressable key={option.value ?? 'none'} style={styles.radioRow} onPress={() => onSelectResult(option.value)}>
          <View style={[styles.radioOuter, verificationResult === option.value && styles.radioOuterSelected]}>
            {verificationResult === option.value ? <View style={styles.radioInner} /> : null}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}

      {verificationResult === 'correction_required' ? (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Correction Reason *</Text>
          <RemarksField value={correctionNotes} onChangeText={onCorrectionNotesChange} placeholder="Describe correction reason" />
          <Text style={styles.fieldLabel}>Required Action from Farmer *</Text>
          <RemarksField value={requiredChanges} onChangeText={onRequiredChangesChange} placeholder="List required farmer actions" />
          <Text style={styles.fieldLabel}>Due Date</Text>
          <TextInput
            value={correctionDueDate}
            onChangeText={onCorrectionDueDateChange}
            placeholder="DD MMM YYYY"
            placeholderTextColor={officerTheme.outline}
            style={styles.singleLineInput}
          />
        </View>
      ) : null}

      {verificationResult === 'rejected' ? (
        <View style={styles.conditionalBlock}>
          <Text style={styles.fieldLabel}>Rejection Reason *</Text>
          <RemarksField value={rejectionReason} onChangeText={onRejectionReasonChange} placeholder="Explain rejection" />
          <Text style={styles.fieldLabel}>Evidence Notes</Text>
          <RemarksField value={evidenceNotes} onChangeText={onEvidenceNotesChange} placeholder="Supporting evidence notes" />
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>Final Remarks *</Text>
      <TextInput
        value={finalRemarks}
        onChangeText={onFinalRemarksChange}
        placeholder="Feedstock quantity, GPS, photos and weight slip verified successfully."
        placeholderTextColor={officerTheme.outline}
        style={styles.finalRemarksInput}
        multiline
        textAlignVertical="top"
      />
    </SectionCard>
  );
}

export function FeedstockVerificationBottomActions({
  savingDraft,
  submitting,
  onSaveDraft,
  onSubmitVerification,
  onRequestCorrection,
  onReject,
}: {
  savingDraft: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmitVerification: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.bottomActions}>
      <ActionButton label={savingDraft ? 'Saving…' : 'Save Draft'} onPress={onSaveDraft} />
      <ActionButton
        label={submitting ? 'Submitting…' : 'Submit Verification'}
        onPress={onSubmitVerification}
        variant="primary"
      />
      <ActionButton label="Request Correction" onPress={onRequestCorrection} />
      <ActionButton label="Reject Record" onPress={onReject} variant="danger" />
    </View>
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
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.headingGreen ?? officerTheme.primary,
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
    flex: 1,
    fontSize: 13,
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
  badgePending: { backgroundColor: '#FEFCE8', borderWidth: 1, borderColor: '#CA8A04' },
  badgeApproved: { backgroundColor: officerTheme.secondaryContainer, borderWidth: 1, borderColor: officerTheme.secondary },
  badgeRejected: { backgroundColor: officerTheme.errorContainer, borderWidth: 1, borderColor: officerTheme.error },
  badgeCorrection: { backgroundColor: '#FEF9C3', borderWidth: 1, borderColor: officerTheme.tertiaryContainer },
  badgeNeutral: { backgroundColor: officerTheme.surfaceContainer, borderWidth: 1, borderColor: officerTheme.outlineVariant },
  badgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurface },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: officerTheme.primaryContainer,
    borderColor: officerTheme.primaryContainer,
  },
  checklistLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: officerTheme.onSurface,
    lineHeight: 20,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  resultPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resultChip: {
    flexGrow: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLow,
  },
  resultChipPass: {
    backgroundColor: officerTheme.secondaryContainer,
    borderColor: officerTheme.primaryContainer,
  },
  resultChipFail: {
    backgroundColor: officerTheme.errorContainer,
    borderColor: officerTheme.error,
  },
  resultChipCorrection: {
    backgroundColor: '#FEF9C3',
    borderColor: '#CA8A04',
  },
  resultChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.onSurfaceVariant,
  },
  resultChipTextSelected: {
    color: officerTheme.primary,
    fontWeight: '700',
  },
  remarksInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.background,
  },
  singleLineInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.background,
  },
  mapPreviewWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 160,
    marginTop: 4,
    position: 'relative',
  },
  mapPreview: { width: '100%', height: '100%' },
  mapLegend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapLegendText: { fontSize: 11, color: officerTheme.onSurfaceVariant, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: {
    flexGrow: 1,
    minWidth: '45%',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: officerTheme.primaryContainer,
    borderColor: officerTheme.primaryContainer,
  },
  actionSecondary: {
    backgroundColor: officerTheme.surfaceLow,
    borderColor: officerTheme.primaryContainer,
  },
  actionDanger: {
    backgroundColor: officerTheme.error,
    borderColor: officerTheme.error,
  },
  actionDisabled: { opacity: 0.45 },
  actionButtonText: { fontSize: 13, fontWeight: '700' },
  actionTextLight: { color: officerTheme.onPrimary },
  actionTextDark: { color: officerTheme.primaryContainer },
  metaLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: {
    width: '100%',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: officerTheme.surfaceContainer,
  },
  photoCardTitle: { fontSize: 13, fontWeight: '700', color: officerTheme.onSurface },
  photoThumb: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: officerTheme.surfaceLow,
  },
  photoActions: { gap: 6 },
  photoRemarkInput: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.surfaceLowest,
  },
  overridePhoto: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  helperText: { fontSize: 13, color: officerTheme.outline, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  progressLabel: { fontSize: 14, color: officerTheme.onSurfaceVariant },
  progressLabelDone: { color: officerTheme.primary, fontWeight: '600' },
  completionBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: officerTheme.secondaryContainer,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionLabel: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface },
  completionValue: { fontSize: 22, fontWeight: '800', color: officerTheme.primaryContainer },
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
  conditionalBlock: { gap: 8, marginTop: 4 },
  finalRemarksInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: officerTheme.onSurface,
    backgroundColor: officerTheme.background,
  },
  bottomActions: { gap: 10, marginTop: 8, marginBottom: 8 },
});
