import React from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  BIOCHAR_OUTPUT_UNITS,
  BIOCHAR_PROCESS_FEEDSTOCK_UNITS,
  BIOCHAR_VERIFICATION_OPTIONS,
  FEEDSTOCK_QUANTITY_UNITS,
  FEEDSTOCK_SIZE_OPTIONS,
  FEEDSTOCK_TYPES,
  type BiocharEvidenceKey,
  type BiocharEvidenceSlot,
  type BiocharOutputUnit,
  type BiocharVerificationResult,
} from '../../../constants/biocharProduction';
import { formatFarmerDisplayId } from '../../../utils/displayIds';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import {
  calculateYieldPercent,
  formatCoordinate,
  formatProductionDuration,
  ARTISAN_KILN_PREFIX,
  DEFAULT_ARTISAN_KILN_ID,
  type ProductionUnitOption,
} from '../../../utils/biocharProductionHelpers';
import { formatActivityDisplayDate } from '../../../utils/activityDateHelpers';
import { artisanGpsAccuracyLabel, artisanGpsAccuracyTone, type ArtisanGpsAccuracyTier } from '../../../utils/artisanGpsAccuracy';
import { BIOCHAR_POOR_ACCURACY_MESSAGE } from '../../../utils/biocharGpsCapture';
import {
  isMoistureReadingComplete,
  isValidMoistureReadingValue,
  moistureReadingValidationError,
} from '../../../utils/moistureReadingValidation';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../../shared/BhuguardMaterialIcon';
import { EvidenceStampedImageFrame } from '../../evidence/EvidenceStampedImageFrame';

export interface BiocharEvidenceAsset {
  uri: string;
  name: string;
  mimeType?: string;
  capturedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  localMediaUuid?: string;
  localUri?: string;
  remoteUrl?: string;
  evidenceId?: string | number;
  evidenceUuid?: string;
  source?: 'local' | 'remote';
  uploadStatus?: 'local_pending' | 'uploading' | 'uploaded' | 'failed';
  syncError?: string;
  isStamped?: boolean;
  isRequired?: boolean;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
}

export interface BiocharMoistureReadingDraft {
  key: string;
  sequence: number;
  moistureReading: string;
  notes: string;
  photo?: BiocharEvidenceAsset;
  readingId?: number | null;
  evidenceId?: number | null;
  uploadStatus?: 'idle' | 'local_pending' | 'uploading' | 'uploaded' | 'failed';
  error?: string | null;
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

export interface BiocharFarmerOption {
  id: number;
  name: string;
  mobile?: string;
}

interface FarmerAssignmentSectionProps {
  farmers: BiocharFarmerOption[];
  selectedFarmerId: number | null;
  readOnly?: boolean;
  onSelectFarmer: (farmerId: number) => void;
}

export function FarmerAssignmentSection({
  farmers,
  selectedFarmerId,
  readOnly = false,
  onSelectFarmer,
}: FarmerAssignmentSectionProps) {
  if (readOnly || selectedFarmerId != null) {
    return null;
  }

  return (
    <Card>
      <Text style={styles.sectionTitle}>Select Farmer</Text>
      <Text style={styles.sectionHint}>
        Choose the farmer for this Biochar production record before saving or submitting.
      </Text>
      {farmers.length === 0 ? (
        <Text style={styles.warningText}>
          No assigned farmers found. Register or onboard a farmer first, then return to this form.
        </Text>
      ) : (
        <View style={styles.farmerList}>
          {farmers.map((farmer) => (
            <Pressable
              key={farmer.id}
              style={styles.farmerOption}
              onPress={() => onSelectFarmer(farmer.id)}
            >
              <View style={styles.farmerOptionText}>
                <Text style={styles.farmerOptionName}>{farmer.name}</Text>
                <Text style={styles.farmerOptionMeta}>
                  {`FRM${String(farmer.id).padStart(3, '0')}`}
                  {farmer.mobile ? ` · ${farmer.mobile}` : ''}
                </Text>
              </View>
              <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.primary} />
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}

interface ProductionRecordCardProps {
  productionRecordCode: string;
  batchCode: string;
  officerName: string;
  farmerId?: number | null;
  farmerName?: string;
  productionDate: string;
  onProductionDateChange?: (value: string) => void;
  statusLabel: string | null;
}

export function ProductionRecordCard({
  productionRecordCode,
  batchCode,
  officerName,
  farmerId,
  farmerName,
  productionDate,
  onProductionDateChange,
  statusLabel,
}: ProductionRecordCardProps) {
  return (
    <Card>
      <View style={styles.recordHeader}>
        <View>
          <Text style={styles.metaLabel}>Production Record ID</Text>
          <Text style={styles.recordCode}>{productionRecordCode || '—'}</Text>
        </View>
        {statusLabel ? (
          <View style={styles.draftBadge}>
            <View style={styles.draftDot} />
            <Text style={styles.draftBadgeText}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.divider} />
      <View style={styles.recordGrid}>
        <View style={styles.recordCell}>
          <Text style={styles.metaLabel}>Project</Text>
          <Text style={styles.metaValue}>Biochar</Text>
        </View>
        <View style={styles.recordCell}>
          <Text style={styles.metaLabel}>Activity Date</Text>
          {onProductionDateChange ? (
            <TextInput
              style={styles.input}
              value={productionDate}
              onChangeText={onProductionDateChange}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={officerTheme.outline}
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <Text style={styles.metaValue}>{formatActivityDisplayDate(productionDate)}</Text>
          )}
        </View>
        <View style={[styles.recordCell, styles.recordCellFull]}>
          <Text style={styles.metaLabel}>Officer / Producer / Operator</Text>
          <View style={styles.officerRow}>
            <BhuguardMaterialIcon name="person" size={18} color={officerTheme.primary} />
            <Text style={styles.metaValue}>{officerName || '—'}</Text>
          </View>
        </View>
        <View style={[styles.recordCell, styles.recordCellFull]}>
          <Text style={styles.metaLabel}>Batch ID</Text>
          <Text style={styles.metaValue}>{batchCode || '—'}</Text>
        </View>
        <View style={[styles.recordCell, styles.recordCellFull]}>
          <Text style={styles.metaLabel}>Farmer ID</Text>
          <Text style={styles.metaValue}>{farmerId != null ? `FRM${String(farmerId).padStart(3, '0')}` : '—'}</Text>
        </View>
        <View style={[styles.recordCell, styles.recordCellFull]}>
          <Text style={styles.metaLabel}>Farmer Name</Text>
          <Text style={styles.metaValue}>{farmerName?.trim() ? farmerName : '—'}</Text>
        </View>
      </View>
    </Card>
  );
}

interface InitialDataSectionProps {
  timestampDate: string;
  timestampTime: string;
  altitude: number | null;
  villageName: string;
  talukaName: string;
  districtName: string;
  stateName: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  accuracyTier?: ArtisanGpsAccuracyTier;
  farmerCode?: string | null;
  farmCode?: string | null;
  onTimestampDateChange: (value: string) => void;
  onTimestampTimeChange: (value: string) => void;
  onAltitudeChange: (value: string) => void;
  onVillageNameChange: (value: string) => void;
  onTalukaNameChange: (value: string) => void;
  onDistrictNameChange: (value: string) => void;
  onStateNameChange: (value: string) => void;
  onCaptureGps: () => void;
  onRecaptureGps: () => void;
  mapPreviewUrl?: string;
  gpsError?: string | null;
}

export function InitialDataSection({
  timestampDate,
  timestampTime,
  altitude,
  villageName,
  talukaName,
  districtName,
  stateName,
  latitude,
  longitude,
  accuracyM,
  accuracyTier = 'unknown',
  farmerCode,
  farmCode,
  onTimestampDateChange,
  onTimestampTimeChange,
  onAltitudeChange,
  onVillageNameChange,
  onTalukaNameChange,
  onDistrictNameChange,
  onStateNameChange,
  onCaptureGps,
  onRecaptureGps,
  mapPreviewUrl,
  gpsError = null,
}: InitialDataSectionProps) {
  const accuracyLabel =
    accuracyM != null
      ? `± ${accuracyM.toFixed(1)} meters (${artisanGpsAccuracyLabel(accuracyTier)})`
      : '—';
  const accuracyTone = artisanGpsAccuracyTone(accuracyTier);

  return (
    <Card>
      <SectionTitle icon="location_on" title="Initial Data" />
      <Text style={styles.fieldLabel}>Time Stamp</Text>
      <View style={styles.timeGrid}>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Date</Text>
          <TextInput style={styles.input} value={timestampDate} onChangeText={onTimestampDateChange} placeholder="YYYY-MM-DD" />
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Time</Text>
          <TextInput style={styles.input} value={timestampTime} onChangeText={onTimestampTimeChange} placeholder="HH:MM" />
        </View>
      </View>

      <View style={styles.timeGrid}>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Altitude</Text>
          <TextInput
            style={styles.input}
            value={altitude != null ? String(altitude) : ''}
            onChangeText={onAltitudeChange}
            keyboardType="decimal-pad"
            placeholder="Meters"
          />
        </View>
        <View style={styles.timeCell}>
          <Text style={styles.fieldLabel}>Accuracy</Text>
          <Text
            style={[
              styles.metaValue,
              accuracyTone === 'success' && styles.accuracyExcellent,
              accuracyTone === 'warning' && styles.accuracyAcceptable,
              accuracyTone === 'danger' && styles.accuracyPoor,
            ]}
          >
            {accuracyLabel}
          </Text>
        </View>
      </View>

      {accuracyTier === 'poor' ? (
        <Text style={styles.gpsWarningText}>{BIOCHAR_POOR_ACCURACY_MESSAGE}</Text>
      ) : null}

      {(farmerCode || farmCode) ? (
        <View style={styles.recordGrid}>
          {farmerCode ? (
            <View style={styles.recordCell}>
              <Text style={styles.metaLabel}>Farmer ID</Text>
              <Text style={styles.metaValue}>{farmerCode}</Text>
            </View>
          ) : null}
          {farmCode ? (
            <View style={styles.recordCell}>
              <Text style={styles.metaLabel}>Farm ID</Text>
              <Text style={styles.metaValue}>{farmCode}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.gpsCard}>
        <View style={styles.gpsHeader}>
          <Text style={styles.gpsTitle}>Captured Location</Text>
          <View style={styles.gpsActionRow}>
            <Pressable style={styles.captureGpsButton} onPress={onCaptureGps}>
              <BhuguardMaterialIcon name="location_on" size={18} color={officerTheme.onPrimary} />
              <Text style={styles.captureGpsButtonText}>Capture GPS</Text>
            </Pressable>
            <Pressable style={styles.recaptureButton} onPress={onRecaptureGps}>
              <BhuguardMaterialIcon name="location_on" size={18} color={officerTheme.primaryContainer} />
              <Text style={styles.recaptureButtonText}>Recapture GPS</Text>
            </Pressable>
          </View>
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
            <Text
              style={[
                styles.gpsValue,
                accuracyTone === 'success' && styles.accuracyExcellent,
                accuracyTone === 'warning' && styles.accuracyAcceptable,
                accuracyTone === 'danger' && styles.accuracyPoor,
              ]}
            >
              {accuracyLabel}
            </Text>
          </View>
        </View>
        <View style={styles.mapPreview}>
          <Text style={styles.metaLabel}>Map Preview</Text>
          {mapPreviewUrl ? (
            <Pressable style={styles.mapPreviewButton} onPress={() => void Linking.openURL(mapPreviewUrl)}>
              <Text style={styles.mapPreviewButtonText}>Open Map Preview</Text>
            </Pressable>
          ) : (
            <Text style={styles.mapPreviewText}>Map preview unavailable until GPS is captured.</Text>
          )}
        </View>
        {gpsError ? (
          <View style={styles.gpsErrorBlock}>
            <Text style={styles.gpsWarningText}>{gpsError}</Text>
            <Pressable style={styles.recaptureButton} onPress={onRecaptureGps}>
              <BhuguardMaterialIcon name="location_on" size={18} color={officerTheme.primaryContainer} />
              <Text style={styles.recaptureButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Text style={styles.fieldLabel}>Village Name</Text>
      <TextInput style={styles.input} value={villageName} onChangeText={onVillageNameChange} placeholder="Village name" />
      <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Taluka Name</Text>
      <TextInput style={styles.input} value={talukaName} onChangeText={onTalukaNameChange} placeholder="Taluka name" />
      <Text style={[styles.fieldLabel, styles.fieldSpacing]}>District Name</Text>
      <TextInput style={styles.input} value={districtName} onChangeText={onDistrictNameChange} placeholder="District name" />
      <Text style={[styles.fieldLabel, styles.fieldSpacing]}>State Name</Text>
      <TextInput style={styles.input} value={stateName} onChangeText={onStateNameChange} placeholder="State name" />
    </Card>
  );
}

interface ProductionUnitSectionProps {
  units: ProductionUnitOption[];
  kilnId: string;
  operatorName: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  gpsCaptured: boolean;
  onKilnIdChange: (value: string) => void;
  onSelectUnit: (unitId: number) => void;
  onOperatorNameChange: (value: string) => void;
  onRecaptureGps: () => void;
}

export function ProductionUnitSection({
  units,
  kilnId,
  operatorName,
  latitude,
  longitude,
  accuracyM,
  gpsCaptured,
  onKilnIdChange,
  onSelectUnit,
  onOperatorNameChange,
  onRecaptureGps,
}: ProductionUnitSectionProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  return (
    <Card>
      <SectionTitle icon="eco" title="Production Unit" />
      <Text style={styles.fieldLabel}>Kiln ID</Text>
      <View style={styles.kilnInputRow}>
        <TextInput
          style={[styles.input, styles.kilnInput]}
          value={kilnId}
          onChangeText={onKilnIdChange}
          placeholder="Enter Kiln ID"
          placeholderTextColor={officerTheme.outline}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {units.length > 0 ? (
          <Pressable
            style={styles.kilnSuggestButton}
            onPress={() => setPickerOpen(true)}
            accessibilityLabel="Choose kiln from list"
          >
            <BhuguardMaterialIcon name="menu" size={20} color={officerTheme.primaryContainer} />
          </Pressable>
        ) : null}
      </View>

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
                    onKilnIdChange(unit.kilnId || unit.label);
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

interface BatchDetailsSectionProps {
  batchCode: string;
  kilnId?: string;
  kilnIdError?: string | null;
  farmerId?: number | null;
  farmerCode?: string | null;
  batchCodeError?: string | null;
  units?: Array<{ id: number; label: string; kilnId?: string; kilnType?: string; village?: string; status?: string }>;
  selectedUnitId?: number | null;
  onSelectUnit?: (unitId: number) => void;
  onKilnIdChange?: (value: string) => void;
  onGenerateBatchCode: () => void;
  onBatchCodeChange: (value: string) => void;
  readOnly?: boolean;
  allowKilnSelect?: boolean;
}

export function BatchDetailsSection({
  batchCode,
  kilnId = '',
  kilnIdError = null,
  farmerId,
  farmerCode,
  batchCodeError,
  units = [],
  selectedUnitId = null,
  onSelectUnit,
  onKilnIdChange,
  onGenerateBatchCode,
  onBatchCodeChange,
  readOnly = false,
  allowKilnSelect = false,
}: BatchDetailsSectionProps) {
  const [kilnPickerOpen, setKilnPickerOpen] = React.useState(false);
  const farmerLabel = formatFarmerDisplayId({ farmer_code: farmerCode });
  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);
  const kilnLabel = selectedUnit
    ? [
        selectedUnit.kilnId || selectedUnit.label,
        selectedUnit.kilnType,
        selectedUnit.village,
        selectedUnit.status,
      ]
        .filter(Boolean)
        .join(' · ')
    : kilnId.trim()
      ? kilnId.trim()
      : '—';

  return (
    <Card>
      <SectionTitle icon="assignment" title="Batch Details" />
      <Text style={styles.fieldLabel}>Batch ID</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={batchCode}
          onChangeText={onBatchCodeChange}
          placeholder="BHG-FRM-000003-BCH-20260708-001"
          placeholderTextColor={officerTheme.outline}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!readOnly}
        />
        {!readOnly ? (
          <Pressable style={styles.generateButton} onPress={onGenerateBatchCode}>
            <Text style={styles.generateButtonText}>Generate Batch ID</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.helperText}>
        Generated by backend using format {`{FARMER_ID}-BCH-{YYYYMMDD}-{SEQUENCE}`}.
      </Text>
      {batchCodeError ? <Text style={styles.errorText}>{batchCodeError}</Text> : null}
      <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Kiln ID / Pyrolysis Unit</Text>
      {allowKilnSelect && !readOnly ? (
        <>
          <Pressable
            style={styles.kilnSelectExistingButton}
            onPress={() => (units.length > 0 ? setKilnPickerOpen(true) : undefined)}
            accessibilityLabel="Select Assigned Kiln"
            disabled={units.length === 0}
          >
            <BhuguardMaterialIcon name="assignment" size={18} color={officerTheme.primaryContainer} />
            <Text style={styles.kilnSelectExistingText}>
              {selectedUnit
                ? [selectedUnit.kilnId || selectedUnit.label, selectedUnit.kilnType, selectedUnit.village, selectedUnit.status]
                    .filter(Boolean)
                    .join(' · ')
                : 'Select Assigned Kiln'}
            </Text>
          </Pressable>
          {units.length === 0 ? (
            <Text style={styles.helperText}>No assigned kilns found for your account yet.</Text>
          ) : null}
          {kilnIdError ? <Text style={styles.errorText}>{kilnIdError}</Text> : null}
        </>
      ) : (
        <Text style={styles.metaValue}>{kilnLabel}</Text>
      )}
      <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Farmer ID</Text>
      <Text style={styles.metaValue}>{farmerLabel}</Text>
      {allowKilnSelect ? (
        <PickerModal
          visible={kilnPickerOpen}
          title="Select Kiln ID / Pyrolysis Unit"
          options={units.map((unit) => ({
            value: String(unit.id),
            label: [
              unit.kilnId || unit.label,
              unit.kilnType,
              unit.village,
              unit.status,
            ]
              .filter(Boolean)
              .join(' · '),
          }))}
          onClose={() => setKilnPickerOpen(false)}
          onSelect={(value) => onSelectUnit?.(Number(value))}
        />
      ) : null}
    </Card>
  );
}

interface FeedstockQuantitySectionProps {
  feedstockQuantity: string;
  feedstockUnit: string;
  feedstockType?: string;
  feedstockSize?: string;
  onFeedstockQuantityChange: (value: string) => void;
  onFeedstockUnitChange: (value: string) => void;
  onFeedstockTypeChange?: (value: string) => void;
  onFeedstockSizeChange?: (value: string) => void;
  readOnly?: boolean;
  showFeedstockType?: boolean;
  showFeedstockSize?: boolean;
  sizeInputMode?: 'options' | 'cm';
}

export function FeedstockQuantitySection({
  feedstockQuantity,
  feedstockUnit,
  feedstockType = '',
  feedstockSize = '',
  onFeedstockQuantityChange,
  onFeedstockUnitChange,
  onFeedstockTypeChange,
  onFeedstockSizeChange,
  readOnly = false,
  showFeedstockType = true,
  showFeedstockSize = false,
  sizeInputMode = 'options',
}: FeedstockQuantitySectionProps) {
  const [unitPickerOpen, setUnitPickerOpen] = React.useState(false);
  const [typePickerOpen, setTypePickerOpen] = React.useState(false);
  const [sizePickerOpen, setSizePickerOpen] = React.useState(false);
  const unitLabel =
    BIOCHAR_PROCESS_FEEDSTOCK_UNITS.find((item) => item.value === feedstockUnit)?.label ??
    FEEDSTOCK_QUANTITY_UNITS.find((item) => item.value === feedstockUnit)?.label ??
    feedstockUnit;
  const typeLabel = FEEDSTOCK_TYPES.find((item) => item.value === feedstockType)?.label ?? feedstockType;
  const sizeLabel = FEEDSTOCK_SIZE_OPTIONS.find((item) => item.value === feedstockSize)?.label ?? feedstockSize;

  return (
    <Card>
      <SectionTitle icon="agriculture" title="Feedstock Details" />
      <Text style={styles.fieldLabel}>Feedstock Quantity</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={feedstockQuantity}
          onChangeText={onFeedstockQuantityChange}
          keyboardType="decimal-pad"
          placeholder="Enter quantity"
          placeholderTextColor={officerTheme.outline}
          editable={!readOnly}
        />
        <Pressable
          style={styles.unitSelector}
          onPress={() => !readOnly && setUnitPickerOpen(true)}
          disabled={readOnly}
        >
          <Text style={styles.selectorText}>{unitLabel}</Text>
          <BhuguardMaterialIcon name="chevron_right" size={18} color={officerTheme.onSurfaceVariant} />
        </Pressable>
      </View>
      {showFeedstockSize && onFeedstockSizeChange ? (
        <>
          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>
            {sizeInputMode === 'cm' ? 'Feedstock Size (cm)' : 'Feedstock Size'}
          </Text>
          {sizeInputMode === 'cm' ? (
            <TextInput
              style={styles.input}
              value={feedstockSize}
              onChangeText={onFeedstockSizeChange}
              keyboardType="decimal-pad"
              placeholder="Enter size in cm"
              placeholderTextColor={officerTheme.outline}
              editable={!readOnly}
            />
          ) : (
            <Pressable style={styles.selector} onPress={() => !readOnly && setSizePickerOpen(true)} disabled={readOnly}>
              <Text style={styles.selectorText}>{sizeLabel || 'Select feedstock size'}</Text>
              <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.onSurfaceVariant} />
            </Pressable>
          )}
        </>
      ) : null}
      {showFeedstockType && onFeedstockTypeChange ? (
        <>
          <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Feedstock Type</Text>
          <Pressable style={styles.selector} onPress={() => !readOnly && setTypePickerOpen(true)} disabled={readOnly}>
            <Text style={styles.selectorText}>{typeLabel || 'Select feedstock type'}</Text>
            <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.onSurfaceVariant} />
          </Pressable>
        </>
      ) : null}
      <PickerModal
        visible={unitPickerOpen}
        title="Quantity Unit"
        options={BIOCHAR_PROCESS_FEEDSTOCK_UNITS.map((item) => ({ value: item.value, label: item.label }))}
        onClose={() => setUnitPickerOpen(false)}
        onSelect={onFeedstockUnitChange}
      />
      {showFeedstockSize && onFeedstockSizeChange && sizeInputMode === 'options' ? (
        <PickerModal
          visible={sizePickerOpen}
          title="Feedstock Size"
          options={FEEDSTOCK_SIZE_OPTIONS.map((item) => ({ value: item.value, label: item.label }))}
          onClose={() => setSizePickerOpen(false)}
          onSelect={onFeedstockSizeChange}
        />
      ) : null}
      {showFeedstockType && onFeedstockTypeChange ? (
        <PickerModal
          visible={typePickerOpen}
          title="Feedstock Type"
          options={FEEDSTOCK_TYPES.map((item) => ({ value: item.value, label: item.label }))}
          onClose={() => setTypePickerOpen(false)}
          onSelect={onFeedstockTypeChange}
        />
      ) : null}
    </Card>
  );
}

interface ProductionBatchSectionProps {
  kilnId?: string;
  batchCode: string;
  farmerId?: number | null;
  farmerName?: string;
  feedstockQuantity: string;
  feedstockUnit: string;
  feedstockType: string;
  onKilnIdChange?: (value: string) => void;
  onGenerateBatchCode: () => void;
  onBatchCodeChange: (value: string) => void;
  onFeedstockQuantityChange: (value: string) => void;
  onFeedstockUnitChange: (value: string) => void;
  onFeedstockTypeChange: (value: string) => void;
}

export function ProductionBatchSection({
  kilnId = '',
  batchCode,
  farmerId,
  farmerName,
  feedstockQuantity,
  feedstockUnit,
  feedstockType,
  onKilnIdChange,
  onGenerateBatchCode,
  onBatchCodeChange,
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
      <Text style={styles.fieldLabel}>Kiln ID / Supply ID</Text>
      <TextInput
        style={styles.input}
        value={kilnId}
        onChangeText={onKilnIdChange}
        placeholder="Enter kiln or supply ID"
        placeholderTextColor={officerTheme.outline}
        autoCapitalize="characters"
        editable={Boolean(onKilnIdChange)}
      />
      <Text style={styles.fieldLabel}>Batch ID</Text>
      <View style={styles.inlineRow}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={batchCode}
          onChangeText={onBatchCodeChange}
          placeholder="BIO-FRM001-20260701-001"
          placeholderTextColor={officerTheme.outline}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Pressable style={styles.generateButton} onPress={onGenerateBatchCode}>
          <Text style={styles.generateButtonText}>Generate</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>Farmer ID</Text>
      <Text style={styles.metaValue}>{farmerId != null ? `FRM${String(farmerId).padStart(3, '0')}` : '—'}</Text>
      <Text style={styles.fieldLabel}>Farmer Name</Text>
      <Text style={styles.metaValue}>{farmerName?.trim() ? farmerName : '—'}</Text>

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

      <Text style={styles.fieldLabel}>Feedstock Size</Text>
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

interface MoistureSectionProps {
  moistureValue: string;
  onMoistureValueChange: (value: string) => void;
  readOnly?: boolean;
}

export function MoistureSection({
  moistureValue,
  onMoistureValueChange,
  readOnly = false,
}: MoistureSectionProps) {
  return (
    <Card>
      <SectionTitle icon="water_drop" title="Moisture Details" />
      <Text style={styles.fieldLabel}>Moisture Reading</Text>
      <TextInput
        style={styles.input}
        value={moistureValue}
        onChangeText={onMoistureValueChange}
        placeholder="e.g. 12.5"
        keyboardType="decimal-pad"
        editable={!readOnly}
      />
    </Card>
  );
}

interface MoistureReadingsSectionProps {
  readings: BiocharMoistureReadingDraft[];
  readOnly?: boolean;
  showNotes?: boolean;
  fixedCount?: number;
  focusSequence?: number;
  liveCameraOnly?: boolean;
  sequentialUnlock?: boolean;
  saving?: boolean;
  stepError?: string | null;
  onAddReading: () => void;
  onRemoveReading: (key: string) => void;
  onChangeReading: (key: string, value: string) => void;
  onChangeNotes: (key: string, value: string) => void;
  onCapturePhoto: (key: string) => void;
  onUploadPhoto: (key: string) => void;
  onCompleteStep?: () => void;
  onRetryFailed?: () => void;
}

export function MoistureReadingsSection({
  readings,
  readOnly = false,
  showNotes = true,
  fixedCount,
  focusSequence,
  liveCameraOnly = false,
  sequentialUnlock = false,
  saving = false,
  stepError = null,
  onAddReading,
  onRemoveReading,
  onChangeReading,
  onChangeNotes,
  onCapturePhoto,
  onUploadPhoto,
  onCompleteStep,
  onRetryFailed,
}: MoistureReadingsSectionProps) {
  const allowAdd = !fixedCount;
  const allowRemove = !fixedCount;
  const failedCount = readings.filter((reading) => reading.uploadStatus === 'failed').length;
  const visibleReadings = focusSequence
    ? readings.filter((reading, index) => (reading.sequence || index + 1) === focusSequence)
    : readings;
  const allLocallyReady =
    Boolean(fixedCount) &&
    readings.length >= (fixedCount ?? 0) &&
    readings.every((reading) =>
      isMoistureReadingComplete(
        reading.moistureReading,
        Boolean(reading.photo?.localUri || reading.photo?.uri || reading.photo?.remoteUrl),
      ),
    );

  const isReadingUnlocked = (index: number): boolean => {
    if (!sequentialUnlock || index === 0) {
      return true;
    }
    const prior = readings[index - 1];
    return isMoistureReadingComplete(
      prior?.moistureReading ?? '',
      Boolean(prior?.photo?.localUri || prior?.photo?.uri || prior?.photo?.remoteUrl),
    );
  };

  return (
    <Card>
      <SectionTitle
        icon="water_drop"
        title="Moisture Reading"
        trailing={
          !readOnly && allowAdd ? (
            <Pressable style={styles.addReadingButton} onPress={onAddReading}>
              <Text style={styles.addReadingButtonText}>Add Reading</Text>
            </Pressable>
          ) : null
        }
      />
      <View style={styles.readingList}>
        {visibleReadings.map((reading) => {
          const index = Math.max(0, readings.findIndex((item) => item.key === reading.key));
          const unlocked = isReadingUnlocked(index);
          const readingLabel = `Moisture Reading ${reading.sequence || index + 1}`;

          return (
          <View
            key={reading.key}
            style={[
              styles.readingCard,
              reading.uploadStatus === 'failed' ? styles.readingCardFailed : null,
              !unlocked ? styles.readingCardLocked : null,
            ]}
          >
            <View style={styles.readingHeader}>
              <View style={styles.readingTitleRow}>
                <Text style={styles.readingTitle}>{readingLabel}</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              </View>
              {!readOnly && allowRemove && readings.length > 1 ? (
                <Pressable onPress={() => onRemoveReading(reading.key)}>
                  <Text style={styles.removeReadingText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
            {!unlocked ? (
              <Text style={styles.readingLockedHint}>
                Complete Moisture Reading {index} before starting this reading.
              </Text>
            ) : null}
            {reading.uploadStatus && reading.uploadStatus !== 'idle' ? (
              <Text
                style={[
                  styles.readingStatus,
                  reading.uploadStatus === 'failed' ? styles.readingStatusFailed : null,
                  reading.uploadStatus === 'uploaded' ? styles.readingStatusUploaded : null,
                ]}
              >
                {reading.uploadStatus === 'uploading'
                  ? 'Uploading…'
                  : reading.uploadStatus === 'uploaded'
                    ? 'Synced'
                    : reading.uploadStatus === 'failed'
                      ? 'Upload failed'
                      : 'Saved locally'}
              </Text>
            ) : null}
            <Text style={styles.fieldLabel}>Moisture %</Text>
            {(() => {
              const valueError = unlocked
                ? moistureReadingValidationError(reading.moistureReading)
                : null;
              const showInvalid =
                Boolean(reading.moistureReading.trim()) &&
                !isValidMoistureReadingValue(reading.moistureReading);

              return (
                <>
                  <TextInput
                    style={[
                      styles.input,
                      showInvalid || (valueError && reading.moistureReading.trim())
                        ? styles.inputInvalid
                        : null,
                    ]}
                    value={reading.moistureReading}
                    onChangeText={(value) => onChangeReading(reading.key, value)}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 12.5"
                    editable={!readOnly && !saving && unlocked}
                  />
                  {showInvalid || (valueError && reading.moistureReading.trim()) ? (
                    <Text style={styles.readingError}>
                      {valueError || 'Moisture Reading must be less than 20.'}
                    </Text>
                  ) : null}
                </>
              );
            })()}
            {showNotes ? (
              <>
                <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={reading.notes}
                  onChangeText={(value) => onChangeNotes(reading.key, value)}
                  multiline
                  placeholder="Optional reading notes"
                  editable={!readOnly && !saving && unlocked}
                />
              </>
            ) : null}
            <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Live Photo</Text>
            {reading.photo ? (
              <EvidenceStampedImageFrame
                uri={reading.photo.localUri || reading.photo.uri || reading.photo.remoteUrl || ''}
                frameStyle={styles.singleEvidencePreview}
                imageStyle={styles.singleEvidenceImage}
              />
            ) : null}
            {reading.error ? <Text style={styles.readingError}>{reading.error}</Text> : null}
            {!readOnly && unlocked ? (
              <View style={styles.singleEvidenceActions}>
                <Pressable
                  style={styles.retakeButton}
                  onPress={() => onCapturePhoto(reading.key)}
                  disabled={saving}
                >
                  <BhuguardMaterialIcon name="photo_camera" size={18} color={officerTheme.primaryContainer} />
                  <Text style={styles.retakeButtonText}>{reading.photo ? 'Retake Photo' : 'Capture Live Photo'}</Text>
                </Pressable>
                {!liveCameraOnly ? (
                  <Pressable style={styles.retakeButton} onPress={() => onUploadPhoto(reading.key)} disabled={saving}>
                    <BhuguardMaterialIcon name="upload" size={18} color={officerTheme.primaryContainer} />
                    <Text style={styles.retakeButtonText}>Upload</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
          );
        })}
      </View>
      {stepError ? <Text style={styles.readingStepError}>{stepError}</Text> : null}
      {!readOnly && onCompleteStep && (!focusSequence || focusSequence === fixedCount) ? (
        <View style={styles.moistureActions}>
          {failedCount > 0 && onRetryFailed ? (
            <Pressable style={styles.moistureRetryButton} onPress={onRetryFailed} disabled={saving}>
              <Text style={styles.moistureRetryButtonText}>
                {saving ? 'Saving Moisture Readings...' : 'Retry Failed Uploads'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.moistureCompleteButton, (!allLocallyReady || saving) && styles.moistureCompleteButtonDisabled]}
            onPress={onCompleteStep}
            disabled={!allLocallyReady || saving}
          >
            <Text style={styles.moistureCompleteButtonText}>
              {saving ? 'Saving Moisture Readings...' : 'Complete Moisture Readings'}
            </Text>
          </Pressable>
        </View>
      ) : null}
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

interface FinalStageSectionProps {
  finalStageTime: string;
  quenchingTime: string;
  onFinalStageTimeChange: (value: string) => void;
  onQuenchingTimeChange: (value: string) => void;
}

export function FinalStageSection({
  finalStageTime,
  quenchingTime,
  onFinalStageTimeChange,
  onQuenchingTimeChange,
}: FinalStageSectionProps) {
  return (
    <>
      <FinalStageTimeSection finalStageTime={finalStageTime} onFinalStageTimeChange={onFinalStageTimeChange} />
      <QuenchingTimeSection quenchingTime={quenchingTime} onQuenchingTimeChange={onQuenchingTimeChange} />
    </>
  );
}

interface FinalStageTimeSectionProps {
  finalStageTime: string;
  onFinalStageTimeChange: (value: string) => void;
  readOnly?: boolean;
}

export function FinalStageTimeSection({
  finalStageTime,
  onFinalStageTimeChange,
  readOnly = false,
}: FinalStageTimeSectionProps) {
  return (
    <Card>
      <SectionTitle icon="schedule" title="Final Stage Time" />
      <TextInput
        style={styles.input}
        value={finalStageTime}
        onChangeText={onFinalStageTimeChange}
        placeholder="HH:MM"
        placeholderTextColor={officerTheme.outline}
        editable={!readOnly}
      />
    </Card>
  );
}

interface QuenchingTimeSectionProps {
  quenchingTime: string;
  onQuenchingTimeChange: (value: string) => void;
  readOnly?: boolean;
}

export function QuenchingTimeSection({
  quenchingTime,
  onQuenchingTimeChange,
  readOnly = false,
}: QuenchingTimeSectionProps) {
  return (
    <Card>
      <SectionTitle icon="schedule" title="Quenching Time" />
      <TextInput
        style={styles.input}
        value={quenchingTime}
        onChangeText={onQuenchingTimeChange}
        placeholder="HH:MM"
        placeholderTextColor={officerTheme.outline}
        editable={!readOnly}
      />
    </Card>
  );
}

interface LegacyFinalStageSectionProps {
  finalStageTime: string;
  quenchingTime: string;
  onFinalStageTimeChange: (value: string) => void;
  onQuenchingTimeChange: (value: string) => void;
}

function LegacyFinalStageCombinedSection({
  finalStageTime,
  quenchingTime,
  onFinalStageTimeChange,
  onQuenchingTimeChange,
}: LegacyFinalStageSectionProps) {
  return (
    <Card>
      <SectionTitle icon="schedule" title="Final Stage" />
      <Text style={styles.fieldLabel}>Final Stage Time</Text>
      <TextInput
        style={styles.input}
        value={finalStageTime}
        onChangeText={onFinalStageTimeChange}
        placeholder="HH:MM"
        placeholderTextColor={officerTheme.outline}
      />
      <Text style={[styles.fieldLabel, styles.fieldSpacing]}>Quenching Time</Text>
      <TextInput
        style={styles.input}
        value={quenchingTime}
        onChangeText={onQuenchingTimeChange}
        placeholder="HH:MM"
        placeholderTextColor={officerTheme.outline}
      />
    </Card>
  );
}

// Keep export name stable for any legacy imports — now renders split sections.
export { LegacyFinalStageCombinedSection as FinalStageSectionLegacy };

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

interface BiocharEvidenceCaptureSectionProps {
  slot: BiocharEvidenceSlot;
  evidence?: BiocharEvidenceAsset;
  readOnly?: boolean;
  liveCameraOnly?: boolean;
  processing?: boolean;
  processingLabel?: string;
  processError?: string | null;
  pendingOfflineLabel?: boolean;
  onRetryProcessing?: () => void;
  onAddEvidence: (key: BiocharEvidenceKey) => void;
  onUploadEvidence: (key: BiocharEvidenceKey) => void;
  onRemoveEvidence: (key: BiocharEvidenceKey) => void;
  onPreviewEvidence: (key: BiocharEvidenceKey) => void;
}

export function BiocharEvidenceCaptureSection({
  slot,
  evidence,
  readOnly = false,
  liveCameraOnly = false,
  processing = false,
  processingLabel,
  processError = null,
  pendingOfflineLabel = false,
  onRetryProcessing,
  onAddEvidence,
  onUploadEvidence,
  onRemoveEvidence,
  onPreviewEvidence,
}: BiocharEvidenceCaptureSectionProps) {
  const previewUri = evidence?.localUri || evidence?.uri || evidence?.remoteUrl;
  const statusLabel =
    evidence?.evidenceId != null ||
    (evidence?.uploadStatus === 'uploaded' && Boolean(evidence?.remoteUrl)) ||
    evidence?.source === 'remote'
      ? 'Uploaded'
      : evidence?.uploadStatus === 'failed'
        ? 'Upload Failed - Retry Upload'
        : evidence?.uploadStatus === 'local_pending' && pendingOfflineLabel
          ? 'Saved Offline · Pending Sync'
          : evidence
            ? 'Photo Captured'
            : null;

  return (
    <Card>
      <View style={styles.evidenceTitleRow}>
        <View style={styles.evidenceTitleCopy}>
          <SectionTitle icon="photo_camera" title={slot.title} />
        </View>
        <View style={styles.requiredBadge}>
          <Text style={styles.requiredBadgeText}>Required</Text>
        </View>
      </View>
      <Text style={styles.evidenceDescription}>{slot.description}</Text>
      {statusLabel ? (
        <Text
          style={[
            styles.evidenceStatusText,
            evidence?.uploadStatus === 'failed' ? styles.evidenceStatusError : null,
          ]}
        >
          {statusLabel}
          {evidence?.capturedAt ? ` · ${evidence.capturedAt}` : ''}
          {pendingOfflineLabel && evidence?.latitude != null && evidence?.longitude != null
            ? ' · GPS ready'
            : ''}
        </Text>
      ) : null}
      {processing ? (
        <Text style={styles.evidenceStatusText}>{processingLabel || 'Processing image…'}</Text>
      ) : null}
      {processError ? <Text style={styles.errorText}>{processError}</Text> : null}
      {evidence?.syncError ? <Text style={styles.errorText}>{evidence.syncError}</Text> : null}

      {evidence && previewUri ? (
        <View style={styles.singleEvidenceWrap}>
          {slot.kind === 'photo' ? (
            <EvidenceStampedImageFrame
              uri={previewUri}
              onPress={() => onPreviewEvidence(slot.key)}
              frameStyle={styles.singleEvidencePreview}
              imageStyle={styles.singleEvidenceImage}
            />
          ) : (
            <Pressable style={styles.singleEvidencePreview} onPress={() => onPreviewEvidence(slot.key)}>
              <View style={styles.videoPlaceholderLarge}>
                <BhuguardMaterialIcon name="photo_camera" size={36} color={officerTheme.primaryContainer} />
                <Text style={styles.videoLabel}>Video captured</Text>
              </View>
            </Pressable>
          )}
          {!readOnly ? (
            <View style={styles.singleEvidenceActions}>
              <Pressable
                style={styles.retakeButton}
                onPress={() => onAddEvidence(slot.key)}
                disabled={processing}
              >
                <BhuguardMaterialIcon name="photo_camera" size={18} color={officerTheme.primaryContainer} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </Pressable>
              {slot.kind === 'photo' && (!liveCameraOnly || evidence.uploadStatus === 'failed') ? (
                <Pressable
                  style={styles.retakeButton}
                  onPress={() => onUploadEvidence(slot.key)}
                  disabled={processing}
                >
                  <BhuguardMaterialIcon name="upload" size={18} color={officerTheme.primaryContainer} />
                  <Text style={styles.retakeButtonText}>
                    {evidence.uploadStatus === 'failed' ? 'Retry Upload' : 'Upload'}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.removeEvidenceButton} onPress={() => onRemoveEvidence(slot.key)}>
                <BhuguardMaterialIcon name="cloud_off" size={18} color={officerTheme.onPrimary} />
                <Text style={styles.removeEvidenceText}>Remove</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.captureChoiceColumn}>
          {processError && onRetryProcessing && !readOnly ? (
            <Pressable
              style={[styles.uploadButton, styles.captureButtonFull, processing && styles.captureButtonDisabled]}
              onPress={onRetryProcessing}
              disabled={processing}
            >
              <BhuguardMaterialIcon name="sync" size={22} color={officerTheme.primaryContainer} />
              <Text style={styles.uploadButtonText}>Retry Processing</Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[
              styles.captureButton,
              styles.captureButtonFull,
              (readOnly || processing) && styles.captureButtonDisabled,
            ]}
            onPress={() => onAddEvidence(slot.key)}
            disabled={readOnly || processing}
          >
            <BhuguardMaterialIcon
              name="photo_camera"
              size={22}
              color={officerTheme.onPrimary}
            />
            <Text style={styles.captureButtonText}>
              {slot.kind === 'video'
                ? 'Record Live Video'
                : processError
                  ? 'Retake Photo'
                  : 'Capture Live Image'}
            </Text>
          </Pressable>
          {slot.kind === 'photo' && !liveCameraOnly ? (
            <Pressable
              style={[styles.uploadButton, styles.captureButtonFull, readOnly && styles.captureButtonDisabled]}
              onPress={() => onUploadEvidence(slot.key)}
              disabled={readOnly}
            >
              <BhuguardMaterialIcon name="upload" size={22} color={officerTheme.primaryContainer} />
              <Text style={styles.uploadButtonText}>Upload from Gallery</Text>
            </Pressable>
          ) : null}
        </View>
      )}
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
      <SectionTitle icon="description" title="Notes" />
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
  sectionHint: { fontSize: 13, color: officerTheme.onSurfaceVariant, lineHeight: 18 },
  warningText: { fontSize: 14, color: officerTheme.error, lineHeight: 20 },
  farmerList: { gap: 8 },
  farmerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: officerTheme.surface,
  },
  farmerOptionText: { flex: 1, gap: 2, paddingRight: 8 },
  farmerOptionName: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface },
  farmerOptionMeta: { fontSize: 12, color: officerTheme.onSurfaceVariant },
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
  helperText: { fontSize: 12, color: officerTheme.onSurfaceVariant, marginTop: 6, marginBottom: 8 },
  errorText: { fontSize: 13, color: '#B91C1C', marginTop: 6 },
  gpsWarningText: { fontSize: 13, color: '#B45309', marginTop: 8, marginBottom: 8 },
  accuracyExcellent: { color: '#15803D' },
  accuracyAcceptable: { color: '#B45309' },
  accuracyPoor: { color: '#B91C1C' },
  fieldSpacing: { marginTop: 10 },
  textArea: { minHeight: 72, textAlignVertical: 'top' },
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
  inputInvalid: {
    borderColor: officerTheme.error,
    color: officerTheme.error,
  },
  kilnInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kilnInput: {
    flex: 1,
    minWidth: 0,
  },
  kilnSuggestButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kilnPrefixLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.onSurface,
    paddingHorizontal: 4,
  },
  kilnSuffixInput: {
    flex: 1,
    minWidth: 72,
  },
  kilnSelectExistingButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surfaceLow,
  },
  kilnSelectExistingText: {
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.primaryContainer,
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
  gpsHeader: { gap: 10 },
  gpsErrorBlock: {
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
  },
  gpsTitle: { fontSize: 12, fontWeight: '700', color: officerTheme.primary },
  gpsActionRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
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
  gpsCell: { flex: 1, minWidth: 120 },
  gpsValue: { fontSize: 13, color: officerTheme.onSurface, marginTop: 2, lineHeight: 18 },
  captureGpsButton: {
    flex: 1,
    minWidth: 136,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: officerTheme.primary,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  recaptureButton: {
    flex: 1,
    minWidth: 148,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: officerTheme.primaryContainer,
    borderRadius: 8,
    backgroundColor: officerTheme.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  captureGpsButtonText: { fontSize: 14, fontWeight: '700', color: officerTheme.onPrimary },
  recaptureButtonText: { fontSize: 14, fontWeight: '700', color: officerTheme.primaryContainer },
  mapPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(11, 107, 58, 0.14)',
    paddingTop: 10,
    gap: 8,
  },
  mapPreviewButton: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#EAF7EF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapPreviewButtonText: { fontSize: 13, fontWeight: '700', color: officerTheme.primaryContainer },
  mapPreviewText: { fontSize: 13, color: officerTheme.onSurfaceVariant, lineHeight: 18 },
  addReadingButton: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addReadingButtonText: { fontSize: 12, fontWeight: '700', color: officerTheme.onPrimary },
  readingList: { gap: 12 },
  readingCard: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    backgroundColor: officerTheme.surfaceLowest,
  },
  readingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readingTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  readingTitle: { fontSize: 14, fontWeight: '700', color: officerTheme.onSurface },
  readingCardLocked: { opacity: 0.55 },
  readingLockedHint: { fontSize: 12, color: officerTheme.onSurfaceVariant, fontStyle: 'italic' },
  readingCardFailed: { borderColor: officerTheme.error, backgroundColor: '#FFF5F5' },
  readingStatus: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  readingStatusFailed: { color: officerTheme.error },
  readingStatusUploaded: { color: officerTheme.primaryContainer },
  readingError: { fontSize: 12, fontWeight: '600', color: officerTheme.error, lineHeight: 16 },
  readingStepError: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: officerTheme.error,
    lineHeight: 18,
  },
  moistureActions: { marginTop: 12, gap: 8 },
  moistureCompleteButton: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  moistureCompleteButtonDisabled: { opacity: 0.55 },
  moistureCompleteButtonText: { color: officerTheme.onPrimary, fontWeight: '800', fontSize: 14 },
  moistureRetryButton: {
    borderWidth: 1,
    borderColor: officerTheme.error,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  moistureRetryButtonText: { color: officerTheme.error, fontWeight: '800', fontSize: 14 },
  removeReadingText: { fontSize: 12, fontWeight: '700', color: officerTheme.error },
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
  evidenceTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  evidenceTitleCopy: { flex: 1, minWidth: 0 },
  requiredBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(11, 107, 58, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  requiredBadgeText: { fontSize: 11, fontWeight: '700', color: officerTheme.primaryContainer },
  evidenceStatusText: { fontSize: 12, color: officerTheme.onSurfaceVariant, marginBottom: 8, fontWeight: '600' },
  evidenceStatusError: { color: officerTheme.error },
  evidenceDescription: { fontSize: 13, color: officerTheme.onSurfaceVariant, marginBottom: 12, lineHeight: 18 },
  captureChoiceColumn: { gap: 10 },
  captureButtonFull: { width: '100%', minWidth: 0, flexDirection: 'row', paddingVertical: 14 },
  singleEvidenceWrap: { gap: 10, width: '100%', alignSelf: 'stretch' },
  singleEvidencePreview: {
    width: '100%',
    alignSelf: 'stretch',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  singleEvidenceImage: { width: '100%', height: '100%', alignSelf: 'center' },
  videoPlaceholderLarge: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLow,
    gap: 8,
  },
  singleEvidenceActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  retakeButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EAF7EF',
    borderRadius: 10,
    paddingVertical: 12,
  },
  retakeButtonText: { color: officerTheme.primaryContainer, fontWeight: '700', fontSize: 14 },
  removeEvidenceButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: officerTheme.error,
    borderRadius: 10,
    paddingVertical: 12,
  },
  removeEvidenceText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 14 },
  captureButton: {
    flex: 1,
    minWidth: 140,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  captureButtonDisabled: { opacity: 0.5 },
  captureButtonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 16 },
  captureChoiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  uploadButton: {
    flex: 1,
    minWidth: 140,
    borderWidth: 1,
    borderColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: officerTheme.surfaceLowest,
  },
  uploadButtonText: { color: officerTheme.primaryContainer, fontWeight: '700', fontSize: 16 },
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
