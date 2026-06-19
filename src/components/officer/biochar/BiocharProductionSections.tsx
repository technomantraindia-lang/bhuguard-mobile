import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BIOCHAR_EVIDENCE_SLOTS,
  BIOCHAR_OUTPUT_UNITS,
  BIOCHAR_VERIFICATION_OPTIONS,
  FEEDSTOCK_QUANTITY_UNITS,
  FEEDSTOCK_TYPES,
  type BiocharEvidenceKey,
  type BiocharOutputUnit,
  type BiocharVerificationResult,
} from '../../../constants/biocharProduction';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import {
  calculateYieldPercent,
  formatCoordinate,
  formatProductionDuration,
  formatTodayLabel,
  type ProductionUnitOption,
} from '../../../utils/biocharProductionHelpers';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../../shared/BhuguardMaterialIcon';

export interface BiocharEvidenceAsset {
  uri: string;
  name: string;
  mimeType?: string;
}

interface CardProps {
  children: React.ReactNode;
  style?: object;
}

function Card({ children, style }: CardProps) {
  return <View style={[styles.card, officerCardShadow, style]}>{children}</View>;
}

function SectionTitle({ icon, title, trailing }: { icon: BhuguardIconName; title: string; trailing?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionTitleLeft}>
        <BhuguardMaterialIcon name={icon} size={20} color={officerTheme.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

interface ProductionRecordCardProps {
  productionRecordCode: string;
  batchCode: string;
  officerName: string;
  statusLabel: string;
}

export function ProductionRecordCard({
  productionRecordCode,
  batchCode,
  officerName,
  statusLabel,
}: ProductionRecordCardProps) {
  return (
    <Card>
      <View style={styles.recordHeader}>
        <View>
          <Text style={styles.metaLabel}>Production Record ID</Text>
          <Text style={styles.recordCode}>{productionRecordCode || '—'}</Text>
        </View>
        <View style={styles.draftBadge}>
          <View style={styles.draftDot} />
          <Text style={styles.draftBadgeText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.recordGrid}>
        <View style={styles.recordCell}>
          <Text style={styles.metaLabel}>Project</Text>
          <Text style={styles.metaValue}>Biochar</Text>
        </View>
        <View style={styles.recordCell}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>{formatTodayLabel()}</Text>
        </View>
        <View style={[styles.recordCell, styles.recordCellFull]}>
          <Text style={styles.metaLabel}>Officer</Text>
          <View style={styles.officerRow}>
            <BhuguardMaterialIcon name="person" size={18} color={officerTheme.primary} />
            <Text style={styles.metaValue}>{officerName}</Text>
          </View>
        </View>
        <View style={[styles.recordCell, styles.recordCellFull]}>
          <Text style={styles.metaLabel}>Batch ID</Text>
          <Text style={styles.metaValue}>{batchCode || '—'}</Text>
        </View>
      </View>
    </Card>
  );
}

interface ProductionUnitSectionProps {
  units: ProductionUnitOption[];
  selectedUnitId: number | null;
  operatorName: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  gpsCaptured: boolean;
  onSelectUnit: (unitId: number) => void;
  onOperatorNameChange: (value: string) => void;
  onRecaptureGps: () => void;
}

export function ProductionUnitSection({
  units,
  selectedUnitId,
  operatorName,
  latitude,
  longitude,
  accuracyM,
  gpsCaptured,
  onSelectUnit,
  onOperatorNameChange,
  onRecaptureGps,
}: ProductionUnitSectionProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const selected = units.find((unit) => unit.id === selectedUnitId);

  return (
    <Card>
      <SectionTitle icon="eco" title="Production Unit" />
      <Text style={styles.fieldLabel}>Kiln ID</Text>
      <Pressable style={styles.selector} onPress={() => setPickerOpen(true)}>
        <Text style={styles.selectorText}>{selected?.label ?? 'Select kiln'}</Text>
        <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.onSurfaceVariant} />
      </Pressable>

      <Text style={styles.fieldLabel}>Operator Name</Text>
      <TextInput
        style={styles.input}
        value={operatorName}
        onChangeText={onOperatorNameChange}
        placeholder="Enter operator name"
        placeholderTextColor={officerTheme.outline}
      />

      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Text style={styles.gpsTitle}>Production Location</Text>
          {gpsCaptured ? (
            <View style={styles.capturedBadge}>
              <BhuguardMaterialIcon name="verified" size={14} color={officerTheme.primaryContainer} />
              <Text style={styles.capturedBadgeText}>Captured</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.gpsGrid}>
          <View style={styles.gpsCell}>
            <Text style={styles.metaLabel}>Lat/Long</Text>
            <Text style={styles.gpsValue}>
              {formatCoordinate(latitude, 'N')}
              {'\n'}
              {formatCoordinate(longitude, 'E')}
            </Text>
          </View>
          <View style={styles.gpsCell}>
            <Text style={styles.metaLabel}>Accuracy</Text>
            <Text style={styles.gpsValue}>{accuracyM != null ? `± ${accuracyM.toFixed(1)} meters` : '—'}</Text>
          </View>
        </View>
        <Pressable style={styles.recaptureButton} onPress={onRecaptureGps}>
          <BhuguardMaterialIcon name="location_on" size={18} color={officerTheme.primaryContainer} />
          <Text style={styles.recaptureButtonText}>Recapture GPS</Text>
        </Pressable>
      </View>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Kiln</Text>
            <ScrollView>
              {units.map((unit) => (
                <Pressable
                  key={unit.id}
                  style={styles.modalOption}
                  onPress={() => {
                    onSelectUnit(unit.id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{unit.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Card>
  );
}

interface ProductionBatchSectionProps {
  batchCode: string;
  feedstockQuantity: string;
  feedstockUnit: string;
  feedstockType: string;
  onGenerateBatchCode: () => void;
  onFeedstockQuantityChange: (value: string) => void;
  onFeedstockUnitChange: (value: string) => void;
  onFeedstockTypeChange: (value: string) => void;
}

export function ProductionBatchSection({
  batchCode,
  feedstockQuantity,
  feedstockUnit,
  feedstockType,
  onGenerateBatchCode,
  onFeedstockQuantityChange,
  onFeedstockUnitChange,
  onFeedstockTypeChange,
}: ProductionBatchSectionProps) {
  const [unitPickerOpen, setUnitPickerOpen] = React.useState(false);
  const [typePickerOpen, setTypePickerOpen] = React.useState(false);
  const typeLabel = FEEDSTOCK_TYPES.find((item) => item.value === feedstockType)?.label ?? feedstockType;
  const unitLabel = FEEDSTOCK_QUANTITY_UNITS.find((item) => item.value === feedstockUnit)?.label ?? feedstockUnit;

  return (
    <Card>
      <SectionTitle icon="assignment" title="Production Batch" />
      <Text style={styles.fieldLabel}>Batch ID</Text>
      <View style={styles.inlineRow}>
        <TextInput style={[styles.input, styles.readonlyInput, styles.flex1]} value={batchCode} editable={false} />
        <Pressable style={styles.generateButton} onPress={onGenerateBatchCode}>
          <Text style={styles.generateButtonText}>Generate</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Feedstock Quantity</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={feedstockQuantity}
          onChangeText={onFeedstockQuantityChange}
          keyboardType="decimal-pad"
          placeholder="Enter amount"
          placeholderTextColor={officerTheme.outline}
        />
        <Pressable style={styles.unitSelector} onPress={() => setUnitPickerOpen(true)}>
          <Text style={styles.selectorText}>{unitLabel}</Text>
          <BhuguardMaterialIcon name="chevron_right" size={18} color={officerTheme.onSurfaceVariant} />
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Feedstock Type</Text>
      <Pressable style={styles.selector} onPress={() => setTypePickerOpen(true)}>
        <Text style={styles.selectorText}>{typeLabel}</Text>
        <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.onSurfaceVariant} />
      </Pressable>

      <PickerModal
        visible={unitPickerOpen}
        title="Quantity Unit"
        options={FEEDSTOCK_QUANTITY_UNITS.map((item) => ({ value: item.value, label: item.label }))}
        onClose={() => setUnitPickerOpen(false)}
        onSelect={onFeedstockUnitChange}
      />
      <PickerModal
        visible={typePickerOpen}
        title="Feedstock Type"
        options={FEEDSTOCK_TYPES.map((item) => ({ value: item.value, label: item.label }))}
        onClose={() => setTypePickerOpen(false)}
        onSelect={onFeedstockTypeChange}
      />
    </Card>
  );
}

interface ProductionTimeSectionProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

export function ProductionTimeSection({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
}: ProductionTimeSectionProps) {
  const duration = formatProductionDuration(startTime, endTime);

  return (
    <Card>
      <SectionTitle
        icon="schedule"
        title="Production Time"
        trailing={duration ? <Text style={styles.durationBadge}>Total: {duration}</Text> : null}
      />
      <View style={styles.timeGrid}>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Start Time</Text>
          <TextInput style={styles.input} value={startTime} onChangeText={onStartTimeChange} placeholder="08:00" />
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>End Time</Text>
          <TextInput style={styles.input} value={endTime} onChangeText={onEndTimeChange} placeholder="12:30" />
        </View>
      </View>
    </Card>
  );
}

interface ProcessDataSectionProps {
  temperature: string;
  residenceTime: string;
  biocharOutput: string;
  biocharOutputUnit: BiocharOutputUnit;
  feedstockQuantity: string;
  onTemperatureChange: (value: string) => void;
  onResidenceTimeChange: (value: string) => void;
  onBiocharOutputChange: (value: string) => void;
  onBiocharOutputUnitChange: (value: BiocharOutputUnit) => void;
}

export function ProcessDataSection({
  temperature,
  residenceTime,
  biocharOutput,
  biocharOutputUnit,
  feedstockQuantity,
  onTemperatureChange,
  onResidenceTimeChange,
  onBiocharOutputChange,
  onBiocharOutputUnitChange,
}: ProcessDataSectionProps) {
  const [unitPickerOpen, setUnitPickerOpen] = React.useState(false);
  const yieldLabel = calculateYieldPercent(feedstockQuantity, biocharOutput) ?? '--';
  const outputUnitLabel = BIOCHAR_OUTPUT_UNITS.find((item) => item.value === biocharOutputUnit)?.label ?? biocharOutputUnit;

  return (
    <Card>
      <SectionTitle icon="science" title="Process Data" />
      <View style={styles.timeGrid}>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Temperature (°C)</Text>
          <TextInput
            style={styles.input}
            value={temperature}
            onChangeText={onTemperatureChange}
            keyboardType="decimal-pad"
            placeholder="450"
            placeholderTextColor={officerTheme.outline}
          />
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Residence Time</Text>
          <TextInput
            style={styles.input}
            value={residenceTime}
            onChangeText={onResidenceTimeChange}
            placeholder="2.5 Hrs"
            placeholderTextColor={officerTheme.outline}
          />
        </View>
      </View>
      <View style={styles.divider} />
      <Text style={styles.fieldLabel}>Biochar Output</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={biocharOutput}
          onChangeText={onBiocharOutputChange}
          keyboardType="decimal-pad"
          placeholder="Yield amount"
          placeholderTextColor={officerTheme.outline}
        />
        <Pressable style={styles.unitSelector} onPress={() => setUnitPickerOpen(true)}>
          <Text style={styles.selectorText}>{outputUnitLabel}</Text>
          <BhuguardMaterialIcon name="chevron_right" size={18} color={officerTheme.onSurfaceVariant} />
        </Pressable>
      </View>
      <Text style={styles.fieldLabel}>Calculated Yield %</Text>
      <View style={styles.yieldBox}>
        <Text style={styles.yieldText}>{yieldLabel}</Text>
        <BhuguardMaterialIcon name="analytics" size={18} color={officerTheme.outline} />
      </View>
      <PickerModal
        visible={unitPickerOpen}
        title="Output Unit"
        options={BIOCHAR_OUTPUT_UNITS.map((item) => ({ value: item.value, label: item.label }))}
        onClose={() => setUnitPickerOpen(false)}
        onSelect={(value) => onBiocharOutputUnitChange(value as BiocharOutputUnit)}
      />
    </Card>
  );
}

interface EvidenceCollectionSectionProps {
  evidence: Partial<Record<BiocharEvidenceKey, BiocharEvidenceAsset>>;
  onAddEvidence: (key: BiocharEvidenceKey) => void;
  onRemoveEvidence: (key: BiocharEvidenceKey) => void;
  onPreviewEvidence: (key: BiocharEvidenceKey) => void;
}

export function EvidenceCollectionSection({
  evidence,
  onAddEvidence,
  onRemoveEvidence,
  onPreviewEvidence,
}: EvidenceCollectionSectionProps) {
  const uploadedCount = BIOCHAR_EVIDENCE_SLOTS.filter((slot) => evidence[slot.key]).length;

  return (
    <Card>
      <SectionTitle
        icon="photo_camera"
        title="Evidence Collection"
        trailing={<Text style={styles.evidenceCount}>{uploadedCount}/4 Uploaded</Text>}
      />
      <View style={styles.evidenceGrid}>
        {BIOCHAR_EVIDENCE_SLOTS.map((slot) => {
          const asset = evidence[slot.key];

          if (asset) {
            return (
              <View key={slot.key} style={styles.evidenceTile}>
                <Text style={styles.evidenceLabel}>{slot.label}</Text>
                <Pressable style={styles.evidencePreview} onPress={() => onPreviewEvidence(slot.key)}>
                  {slot.kind === 'photo' ? (
                    <Image source={{ uri: asset.uri }} style={styles.evidenceImage} />
                  ) : (
                    <View style={styles.videoPlaceholder}>
                      <BhuguardMaterialIcon name="photo_camera" size={28} color={officerTheme.primaryContainer} />
                      <Text style={styles.videoLabel}>Video added</Text>
                    </View>
                  )}
                </Pressable>
                <View style={styles.evidenceActions}>
                  <Pressable style={styles.evidenceAction} onPress={() => onAddEvidence(slot.key)}>
                    <BhuguardMaterialIcon name="note_add" size={16} color={officerTheme.primaryContainer} />
                  </Pressable>
                  <Pressable style={[styles.evidenceAction, styles.evidenceDelete]} onPress={() => onRemoveEvidence(slot.key)}>
                    <BhuguardMaterialIcon name="cloud_off" size={16} color={officerTheme.onPrimary} />
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View key={slot.key} style={styles.evidenceEmpty}>
              <Text style={styles.evidenceLabel}>{slot.label}</Text>
              <BhuguardMaterialIcon name="photo_camera" size={32} color={officerTheme.outlineVariant} />
              <Pressable style={styles.addEvidenceButton} onPress={() => onAddEvidence(slot.key)}>
                <BhuguardMaterialIcon name="add_circle" size={14} color={officerTheme.primary} />
                <Text style={styles.addEvidenceText}>Add</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

interface OfficerNotesSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function OfficerNotesSection({ value, onChange }: OfficerNotesSectionProps) {
  return (
    <Card>
      <SectionTitle icon="description" title="Officer Notes" />
      <TextInput
        style={styles.notesInput}
        value={value}
        onChangeText={onChange}
        multiline
        textAlignVertical="top"
        placeholder="Add observations regarding feedstock quality, weather conditions, or operational issues..."
        placeholderTextColor={officerTheme.outline}
      />
    </Card>
  );
}

interface VerificationResultSectionProps {
  value: BiocharVerificationResult;
  onChange: (value: BiocharVerificationResult) => void;
}

export function VerificationResultSection({ value, onChange }: VerificationResultSectionProps) {
  return (
    <Card>
      <SectionTitle icon="fact_check" title="Verification Result" />
      {BIOCHAR_VERIFICATION_OPTIONS.map((option) => {
        const selected = value === option.value;

        return (
          <Pressable
            key={option.value}
            style={[styles.radioRow, selected && styles.radioRowSelected]}
            onPress={() => onChange(option.value)}
          >
            <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
              {selected ? <View style={styles.radioInner} /> : null}
            </View>
            <Text style={styles.radioLabel}>{option.label}</Text>
          </Pressable>
        );
      })}
    </Card>
  );
}

function PickerModal({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: Array<{ value: string; label: string }>;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView>
            {options.map((option) => (
              <Pressable
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 12,
    gap: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recordCode: { fontSize: 16, fontWeight: '700', color: officerTheme.primary, marginTop: 2 },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 201, 76, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  draftDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: officerTheme.tertiary },
  draftBadgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.tertiary },
  divider: { height: 1, backgroundColor: officerTheme.outlineVariant, opacity: 0.35 },
  recordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  recordCell: { width: '47%' },
  recordCellFull: { width: '100%' },
  metaValue: { fontSize: 15, color: officerTheme.onSurface, marginTop: 2 },
  officerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant, marginBottom: 4 },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    backgroundColor: officerTheme.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorText: { fontSize: 15, color: officerTheme.onSurface },
  input: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    backgroundColor: officerTheme.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: officerTheme.onSurface,
  },
  readonlyInput: { backgroundColor: officerTheme.surfaceLow, color: officerTheme.onSurfaceVariant },
  gpsCard: {
    backgroundColor: officerTheme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.2)',
    padding: 12,
    gap: 10,
  },
  gpsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gpsTitle: { fontSize: 12, fontWeight: '700', color: officerTheme.primary },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF7EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  capturedBadgeText: { fontSize: 11, fontWeight: '700', color: officerTheme.primaryContainer },
  gpsGrid: { flexDirection: 'row', gap: 8 },
  gpsCell: { flex: 1 },
  gpsValue: { fontSize: 13, color: officerTheme.onSurface, marginTop: 2, lineHeight: 18 },
  recaptureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: officerTheme.primaryContainer,
    borderRadius: 8,
    backgroundColor: officerTheme.surfaceLowest,
    paddingVertical: 10,
  },
  recaptureButtonText: { fontSize: 14, fontWeight: '700', color: officerTheme.primaryContainer },
  inlineRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex1: { flex: 1 },
  generateButton: {
    backgroundColor: '#EAF7EF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  generateButtonText: { fontSize: 14, fontWeight: '700', color: officerTheme.primaryContainer },
  unitSelector: {
    width: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    backgroundColor: officerTheme.surface,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  durationBadge: {
    backgroundColor: '#EAF7EF',
    color: officerTheme.primaryContainer,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeGrid: { flexDirection: 'row', gap: 12 },
  timeCell: { flex: 1 },
  yieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    backgroundColor: officerTheme.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  yieldText: { fontSize: 15, color: officerTheme.onSurfaceVariant },
  evidenceCount: { fontSize: 12, color: officerTheme.onSurfaceVariant, fontWeight: '600' },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  evidenceTile: {
    width: '47%',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    padding: 8,
    gap: 6,
  },
  evidenceEmpty: {
    width: '47%',
    minHeight: 140,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(249, 249, 255, 0.6)',
  },
  evidenceLabel: { fontSize: 11, fontWeight: '600', color: officerTheme.onSurfaceVariant, width: '100%' },
  evidencePreview: { width: '100%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden' },
  evidenceImage: { width: '100%', height: '100%' },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLow,
    gap: 4,
  },
  videoLabel: { fontSize: 11, color: officerTheme.primaryContainer, fontWeight: '600' },
  evidenceActions: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  evidenceAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceDelete: { backgroundColor: officerTheme.error },
  addEvidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 6,
    backgroundColor: officerTheme.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addEvidenceText: { fontSize: 12, fontWeight: '600', color: officerTheme.primary },
  notesInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    backgroundColor: officerTheme.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: officerTheme.onSurface,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    padding: 10,
  },
  radioRowSelected: { borderColor: 'rgba(11, 107, 58, 0.3)', backgroundColor: '#EAF7EF' },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: officerTheme.primaryContainer },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: officerTheme.primaryContainer },
  radioLabel: { fontSize: 15, color: officerTheme.onSurface },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 27, 43, 0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: officerTheme.surfaceLowest,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface, marginBottom: 8 },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: officerTheme.outlineVariant },
  modalOptionText: { fontSize: 15, color: officerTheme.onSurface },
});
