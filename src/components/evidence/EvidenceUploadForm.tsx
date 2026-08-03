import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../AppButton';
import { LiveEvidenceCaptureCard } from './LiveEvidenceCaptureCard';
import type { EvidenceCategoryDefinition } from '../../constants/evidenceCategories';
import { useLiveEvidenceCapture } from '../../hooks/useLiveEvidenceCapture';
import { colors } from '../../theme/colors';
import type { LiveCapturedEvidence } from '../../utils/liveEvidenceCapture';
import { pickDocumentForEvidence } from '../../utils/liveEvidenceCapture';

export interface EvidenceUploadFormProps {
  categories: EvidenceCategoryDefinition[] | Array<{ key: string; label: string }>;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  title?: string;
  remarks?: string;
  onTitleChange?: (value: string) => void;
  onRemarksChange: (value: string) => void;
  uploading?: boolean;
  error?: string | null;
  onSubmit: (file: LiveCapturedEvidence | { uri: string; name: string; type: string }) => void | Promise<void>;
  submitLabel?: string;
  relationSection?: ReactNode;
  showDocumentPicker?: boolean;
  showWeightSlipFields?: boolean;
  slipNumber?: string;
  grossWeight?: string;
  tareWeight?: string;
  netWeight?: string;
  unit?: string;
  weighingDate?: string;
  onSlipNumberChange?: (value: string) => void;
  onGrossWeightChange?: (value: string) => void;
  onTareWeightChange?: (value: string) => void;
  onNetWeightChange?: (value: string) => void;
  onUnitChange?: (value: string) => void;
  onWeighingDateChange?: (value: string) => void;
}

export function EvidenceUploadForm({
  categories,
  selectedCategory,
  onCategoryChange,
  title,
  remarks,
  onTitleChange,
  onRemarksChange,
  uploading = false,
  error = null,
  onSubmit,
  submitLabel = 'Upload Evidence',
  relationSection,
  showDocumentPicker = true,
  showWeightSlipFields = false,
  slipNumber,
  grossWeight,
  tareWeight,
  netWeight,
  unit,
  weighingDate,
  onSlipNumberChange,
  onGrossWeightChange,
  onTareWeightChange,
  onNetWeightChange,
  onUnitChange,
  onWeighingDateChange,
}: EvidenceUploadFormProps) {
  const liveEvidence = useLiveEvidenceCapture({
    defaultName: 'evidence.jpg',
    allowsEditing: false,
    requireConfirm: true,
  });
  const [documentFile, setDocumentFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const displayError = error ?? liveEvidence.error ?? documentError;

  const handlePickDocument = async () => {
    setDocumentError(null);

    try {
      const picked = await pickDocumentForEvidence();

      if (!picked) {
        return;
      }

      setDocumentFile(picked);
      liveEvidence.clearEvidence();
    } catch (err) {
      setDocumentError(err instanceof Error ? err.message : 'Unable to pick document.');
    }
  };

  const handleSubmit = async () => {
    const activeFile = liveEvidence.evidence ?? documentFile;

    if (!activeFile) {
      setDocumentError('Capture or select a file before uploading.');
      return;
    }

    await onSubmit(activeFile);
  };

  return (
    <View style={styles.wrap}>
      {relationSection}

      <Text style={styles.label}>Evidence category</Text>
      <View style={styles.categoryRow}>
        {categories.map((category) => {
          const value = 'value' in category ? category.value : category.key;
          const label = category.label;
          const active = value === selectedCategory;

          return (
            <Pressable
              key={value}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => onCategoryChange(value)}
            >
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {onTitleChange ? (
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={onTitleChange}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textMuted}
        />
      ) : null}

      <LiveEvidenceCaptureCard
        evidence={liveEvidence.evidence}
        pendingEvidence={liveEvidence.pendingEvidence}
        capturing={liveEvidence.capturing}
        uploading={uploading}
        error={displayError}
        onOpenCamera={() => {
          setDocumentFile(null);
          void liveEvidence.captureEvidence();
        }}
        onRetake={() => {
          setDocumentFile(null);
          void liveEvidence.retakeEvidence();
        }}
        onConfirmPending={() => liveEvidence.confirmPending()}
        onRejectPending={() => liveEvidence.rejectPending()}
        onUpload={() => void handleSubmit()}
        uploadLabel={submitLabel}
        showUploadButton
      />

      {documentFile ? (
        <View style={styles.documentCard}>
          <Text style={styles.documentTitle}>Selected document</Text>
          <Text style={styles.documentName}>{documentFile.name}</Text>
        </View>
      ) : null}

      {showDocumentPicker ? (
        <AppButton label="Pick Document / PDF" variant="secondary" onPress={() => void handlePickDocument()} />
      ) : null}

      {showWeightSlipFields ? (
        <View style={styles.weightBlock}>
          <Text style={styles.label}>Weight slip details</Text>
          <TextInput
            style={styles.input}
            value={slipNumber}
            onChangeText={onSlipNumberChange}
            placeholder="Slip number"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={grossWeight}
              onChangeText={onGrossWeightChange}
              placeholder="Gross weight"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={tareWeight}
              onChangeText={onTareWeightChange}
              placeholder="Tare weight"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={netWeight}
              onChangeText={onNetWeightChange}
              placeholder="Net weight"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={unit}
              onChangeText={onUnitChange}
              placeholder="Unit"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <TextInput
            style={styles.input}
            value={weighingDate}
            onChangeText={onWeighingDateChange}
            placeholder="Weighing date"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      ) : null}

      <TextInput
        style={styles.notesInput}
        value={remarks}
        onChangeText={onRemarksChange}
        placeholder="Remarks (optional)"
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <AppButton
        label={uploading ? 'Uploading…' : submitLabel}
        loading={uploading}
        onPress={() => void handleSubmit()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  categoryChipActive: { borderColor: colors.primary, backgroundColor: colors.softGreen },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  categoryChipTextActive: { color: colors.primary },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
  },
  notesInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 46,
    color: colors.text,
  },
  documentCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  documentTitle: { fontSize: 12, color: colors.textMuted },
  documentName: { fontSize: 14, fontWeight: '600', color: colors.text },
  weightBlock: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
});
