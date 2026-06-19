import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type {
  InventoryEvidenceKey,
  InventoryMovementStatus,
  InventoryMovementType,
} from '../../../constants/inventoryMovement';
import { INVENTORY_EVIDENCE_SLOTS, INVENTORY_MOVEMENT_TYPE_OPTIONS } from '../../../constants/inventoryMovement';
import { officerCardShadow, officerTheme } from '../../../theme/officerDashboardTheme';
import type { InventoryEvidenceAsset } from '../../../hooks/useInventoryMovementForm';
import type {
  BatchInventoryOption,
  DestinationFarmOption,
  StorageLocationOption,
} from '../../../utils/inventoryMovementHelpers';
import { formatInventoryQuantity } from '../../../utils/inventoryMovementHelpers';
import { BhuguardMaterialIcon, type BhuguardIconName } from '../../shared/BhuguardMaterialIcon';

function slotIcon(key: InventoryEvidenceKey): BhuguardIconName {
  switch (key) {
    case 'stock_loading':
      return 'upload';
    case 'transport_vehicle':
      return 'sync';
    case 'delivery_location':
      return 'location_on';
    case 'stock_receipt':
      return 'description';
    default:
      return 'photo_camera';
  }
}

function SectionTitle({ icon, title }: { icon: BhuguardIconName; title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <BhuguardMaterialIcon name={icon} size={20} color={officerTheme.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function SelectField({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <FieldLabel label={label} />
      <Pressable style={styles.selectField} onPress={onPress}>
        <Text style={styles.selectValue}>{value}</Text>
        <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

export function MovementRecordCard({
  movementCode,
  statusLabel,
  officerName,
}: {
  movementCode: string;
  statusLabel: string;
  officerName: string;
}) {
  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.recordTopRow}>
        <View>
          <Text style={styles.metaLabel}>Movement ID</Text>
          <Text style={styles.movementCode}>{movementCode}</Text>
        </View>
        <View style={styles.draftBadge}>
          <Text style={styles.draftBadgeText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.recordGrid}>
        <View style={styles.gridItem}>
          <Text style={styles.metaLabel}>Project</Text>
          <Text style={styles.gridValue}>Biochar</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.gridValue}>Today</Text>
        </View>
      </View>
      <View style={styles.officerRow}>
        <Text style={styles.metaLabel}>Officer</Text>
        <View style={styles.officerNameRow}>
          <BhuguardMaterialIcon name="person" size={16} color={officerTheme.primaryContainer} />
          <Text style={styles.gridValue}>{officerName}</Text>
        </View>
      </View>
    </View>
  );
}

export function BatchInformationSection({
  batches,
  selectedBatch,
  onCycleBatch,
}: {
  batches: BatchInventoryOption[];
  selectedBatch: BatchInventoryOption | null;
  onCycleBatch: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle icon="upload" title="Batch Information" />
      <SelectField label="Select Batch" value={selectedBatch?.batchCode ?? 'No batch'} onPress={onCycleBatch} />
      {selectedBatch ? (
        <View style={styles.infoPanel}>
          <View style={styles.recordGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Production Date</Text>
              <Text style={styles.gridValue}>{selectedBatch.productionDateLabel}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Feedstock Type</Text>
              <Text style={styles.gridValue}>{selectedBatch.feedstockType}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Production Qty</Text>
              <Text style={styles.gridValue}>{selectedBatch.productionQty}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.metaLabel}>Current Stock</Text>
              <Text style={[styles.gridValue, styles.stockValue]}>
                {formatInventoryQuantity(selectedBatch.currentStockKg)}
              </Text>
            </View>
          </View>
          <View style={styles.panelFooter}>
            <Text style={styles.metaLabel}>Storage Status</Text>
            <View style={styles.storedBadge}>
              <Text style={styles.storedBadgeText}>{selectedBatch.storageStatus}</Text>
            </View>
          </View>
        </View>
      ) : null}
      {batches.length === 0 ? (
        <Text style={styles.helperText}>No biochar batches with stock are available yet.</Text>
      ) : null}
    </View>
  );
}

export function StorageInformationSection({
  storage,
  onCycleStorage,
}: {
  storage: StorageLocationOption | null;
  onCycleStorage: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle icon="landscape" title="Storage Information" />
      <SelectField
        label="Storage Location"
        value={storage?.label ?? 'Central Warehouse'}
        onPress={onCycleStorage}
      />
      {storage ? (
        <View style={styles.capacityRow}>
          <View>
            <Text style={styles.metaLabel}>Storage Capacity</Text>
            <Text style={styles.gridValue}>{formatInventoryQuantity(storage.capacityKg)}</Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.metaLabel}>Available Space</Text>
            <Text style={[styles.gridValue, styles.stockValue]}>
              {formatInventoryQuantity(storage.availableSpaceKg)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function AvailabilitySummarySection({
  availableKg,
  reservedKg,
  movedKg,
  balanceKg,
}: {
  availableKg: number;
  reservedKg: number;
  movedKg: number;
  balanceKg: number;
}) {
  return (
    <View style={[styles.card, officerCardShadow, styles.summaryCard]}>
      <View style={styles.recordTopRow}>
        <Text style={styles.metaLabelUpper}>Availability Summary</Text>
        <View style={styles.availableBadge}>
          <View style={styles.availableDot} />
          <Text style={styles.availableBadgeText}>Available</Text>
        </View>
      </View>
      <View style={styles.summaryGrid}>
        <SummaryTile label="Available" value={formatInventoryQuantity(availableKg)} />
        <SummaryTile label="Reserved" value={formatInventoryQuantity(reservedKg)} accent="tertiary" />
        <SummaryTile label="Moved" value={formatInventoryQuantity(movedKg)} muted />
        <SummaryTile label="Balance" value={formatInventoryQuantity(balanceKg)} highlight />
      </View>
    </View>
  );
}

function SummaryTile({
  label,
  value,
  highlight = false,
  muted = false,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  accent?: 'tertiary';
}) {
  return (
    <View style={[styles.summaryTile, highlight && styles.summaryTileHighlight]}>
      <Text style={[styles.metaLabel, highlight && styles.summaryHighlightLabel]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          muted && styles.summaryMuted,
          accent === 'tertiary' && styles.summaryTertiary,
          highlight && styles.summaryHighlightValue,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function MovementDetailsSection({
  movementType,
  destination,
  onCycleMovementType,
  onCycleDestination,
}: {
  movementType: InventoryMovementType;
  destination: DestinationFarmOption | null;
  onCycleMovementType: () => void;
  onCycleDestination: () => void;
}) {
  const movementLabel =
    INVENTORY_MOVEMENT_TYPE_OPTIONS.find((option) => option.value === movementType)?.label ?? movementType;

  return (
    <View style={styles.section}>
      <SectionTitle icon="sync" title="Movement Details" />
      <SelectField label="Movement Type" value={movementLabel} onPress={onCycleMovementType} />
      {destination ? (
        <View style={styles.destinationCard}>
          <Text style={styles.destinationTitle}>
            <BhuguardMaterialIcon name="agriculture" size={16} color={officerTheme.primary} /> Destination Farm
          </Text>
          <DetailRow label="Farmer" value={destination.farmerName} />
          <Pressable onPress={onCycleDestination}>
            <DetailRow label="Farm ID" value={destination.farmCode} />
            <DetailRow label="Plot" value={destination.plotCode} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.gridValue}>{value}</Text>
    </View>
  );
}

export function QuantityTimingSection({
  movementDate,
  quantityMoved,
  quantityUnit,
  availableKg,
  remainingKg,
  quantityError,
  onChangeDate,
  onChangeQuantity,
  onCycleUnit,
}: {
  movementDate: string;
  quantityMoved: string;
  quantityUnit: string;
  availableKg: number;
  remainingKg: number;
  quantityError: string | null;
  onChangeDate: (value: string) => void;
  onChangeQuantity: (value: string) => void;
  onCycleUnit: () => void;
}) {
  return (
    <View style={[styles.card, officerCardShadow, styles.section]}>
      <SectionTitle icon="analytics" title="Quantity & Timing" />
      <View style={styles.fieldBlock}>
        <FieldLabel label="Movement Date" />
        <TextInput style={styles.input} value={movementDate} onChangeText={onChangeDate} placeholder="YYYY-MM-DD" />
      </View>
      <View style={styles.fieldBlock}>
        <FieldLabel label="Quantity Moved" />
        <View style={styles.quantityRow}>
          <TextInput
            style={[styles.input, styles.quantityInput]}
            value={quantityMoved}
            onChangeText={onChangeQuantity}
            keyboardType="decimal-pad"
            placeholder="Enter qty"
          />
          <Pressable style={styles.unitSelect} onPress={onCycleUnit}>
            <Text style={styles.selectValue}>{quantityUnit.toUpperCase()}</Text>
          </Pressable>
        </View>
        <View style={styles.infoBanner}>
          <BhuguardMaterialIcon name="description" size={14} color={officerTheme.onSurfaceVariant} />
          <Text style={styles.infoBannerText}>
            Requested: {quantityMoved || '0'} | Avail: {availableKg} | Rem: {remainingKg}
          </Text>
        </View>
        {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}
      </View>
    </View>
  );
}

export function TransportationSection({
  transportMethod,
  vehicleNumber,
  driverName,
  transportMethods,
  onCycleMethod,
  onChangeVehicle,
  onChangeDriver,
}: {
  transportMethod: string;
  vehicleNumber: string;
  driverName: string;
  transportMethods: Array<{ value: string; label: string }>;
  onCycleMethod: () => void;
  onChangeVehicle: (value: string) => void;
  onChangeDriver: (value: string) => void;
}) {
  const label = transportMethods.find((method) => method.value === transportMethod)?.label ?? transportMethod;

  return (
    <View style={styles.section}>
      <SectionTitle icon="upload" title="Transportation" />
      <SelectField label="Transport Method" value={label} onPress={onCycleMethod} />
      <View style={styles.fieldBlock}>
        <FieldLabel label="Vehicle Number" />
        <TextInput
          style={styles.input}
          value={vehicleNumber}
          onChangeText={onChangeVehicle}
          placeholder="e.g. GJ-01-AB-1234"
          autoCapitalize="characters"
        />
      </View>
      <View style={styles.fieldBlock}>
        <FieldLabel label="Driver Name" />
        <TextInput
          style={styles.input}
          value={driverName}
          onChangeText={onChangeDriver}
          placeholder="Enter driver name"
        />
      </View>
    </View>
  );
}

export function LocationVerificationSection({
  latitude,
  longitude,
  accuracyM,
  gpsVerified,
  onCaptureGps,
  onVerifyLocation,
}: {
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  gpsVerified: boolean;
  onCaptureGps: () => void;
  onVerifyLocation: () => void;
}) {
  return (
    <View style={styles.locationCard}>
      <Text style={styles.destinationTitle}>
        <BhuguardMaterialIcon name="share_location" size={16} color={officerTheme.primary} /> Location Verification
      </Text>
      <View style={styles.gpsPanel}>
        <View style={styles.detailRow}>
          <Text style={styles.metaLabel}>Coordinates</Text>
          {gpsVerified ? (
            <Text style={styles.verifiedText}>
              <BhuguardMaterialIcon name="verified" size={14} color={officerTheme.primaryContainer} /> Verified
            </Text>
          ) : null}
        </View>
        <Text style={styles.coordsText}>
          {latitude != null && longitude != null
            ? `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`
            : 'GPS not captured yet'}
        </Text>
        {accuracyM != null ? <Text style={styles.helperText}>Accuracy: ±{accuracyM.toFixed(0)} meters</Text> : null}
      </View>
      <View style={styles.gpsActions}>
        <Pressable style={styles.secondaryButton} onPress={onCaptureGps}>
          <BhuguardMaterialIcon name="share_location" size={16} color={officerTheme.onSurfaceVariant} />
          <Text style={styles.secondaryButtonText}>Capture GPS</Text>
        </Pressable>
        <Pressable style={styles.verifyButton} onPress={onVerifyLocation}>
          <BhuguardMaterialIcon name="verified" size={16} color={officerTheme.onSecondaryContainer} />
          <Text style={styles.verifyButtonText}>Verify Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EvidenceUploadSection({
  evidence,
  onCapture,
}: {
  evidence: Partial<Record<InventoryEvidenceKey, InventoryEvidenceAsset>>;
  onCapture: (key: InventoryEvidenceKey) => void;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle icon="photo_camera" title="Evidence Upload" />
      <View style={styles.evidenceGrid}>
        {INVENTORY_EVIDENCE_SLOTS.map((slot) => {
          const asset = evidence[slot.key];

          return (
            <Pressable key={slot.key} style={styles.evidenceSlot} onPress={() => onCapture(slot.key)}>
              {asset ? (
                <>
                  <Image source={{ uri: asset.uri }} style={styles.evidenceImage} />
                  <View style={styles.evidenceOverlay}>
                    <Text style={styles.evidenceLabel}>{slot.label}</Text>
                    <BhuguardMaterialIcon name="verified" size={18} color={officerTheme.onPrimary} />
                  </View>
                </>
              ) : (
                <>
                  <BhuguardMaterialIcon name={slotIcon(slot.key)} size={28} color={officerTheme.outline} />
                  <Text style={styles.evidenceEmptyLabel}>{slot.label}</Text>
                  <Text style={styles.addPhotoText}>+ Add Photo</Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ReceiverConfirmationSection({
  farmerName,
  receiverName,
  receiverMobile,
  receiverConfirmed,
  quantityMoved,
  onChangeReceiverName,
  onChangeReceiverMobile,
  onToggleConfirmed,
}: {
  farmerName: string;
  receiverName: string;
  receiverMobile: string;
  receiverConfirmed: boolean;
  quantityMoved: string;
  onChangeReceiverName: (value: string) => void;
  onChangeReceiverMobile: (value: string) => void;
  onToggleConfirmed: () => void;
}) {
  return (
    <View style={[styles.card, officerCardShadow, styles.section]}>
      <SectionTitle icon="description" title="Receiver Confirmation" />
      <View style={styles.fieldBlock}>
        <FieldLabel label="Farmer Name (Auto)" />
        <TextInput style={[styles.input, styles.inputDisabled]} value={farmerName} editable={false} />
      </View>
      <View style={styles.fieldBlock}>
        <FieldLabel label="Actual Receiver Name" />
        <TextInput
          style={styles.input}
          value={receiverName}
          onChangeText={onChangeReceiverName}
          placeholder="Name of person receiving"
        />
      </View>
      <View style={styles.fieldBlock}>
        <FieldLabel label="Receiver Mobile" />
        <TextInput
          style={styles.input}
          value={receiverMobile}
          onChangeText={onChangeReceiverMobile}
          placeholder="+91"
          keyboardType="phone-pad"
        />
      </View>
      <Pressable style={styles.confirmRow} onPress={onToggleConfirmed}>
        <View style={[styles.checkbox, receiverConfirmed && styles.checkboxChecked]}>
          {receiverConfirmed ? (
            <BhuguardMaterialIcon name="verified" size={14} color={officerTheme.onPrimary} />
          ) : null}
        </View>
        <Text style={styles.confirmText}>
          I confirm that the quantity of <Text style={styles.confirmStrong}>{quantityMoved || '0'} Kg</Text> has been
          received in good condition.
        </Text>
      </Pressable>
    </View>
  );
}

export function OfficerRemarksSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldBlock}>
      <FieldLabel label="Officer Verification Remarks" />
      <TextInput
        style={[styles.input, styles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder="Add any notes regarding the movement or stock condition..."
        multiline
      />
    </View>
  );
}

export function RecordStatusSection({
  status,
  onChange,
}: {
  status: InventoryMovementStatus;
  onChange: (status: InventoryMovementStatus) => void;
}) {
  return (
    <View style={styles.infoPanel}>
      <Text style={styles.gridValue}>Record Status</Text>
      <View style={styles.statusRow}>
        {(['draft', 'submitted'] as InventoryMovementStatus[]).map((option) => (
          <Pressable key={option} style={styles.statusOption} onPress={() => onChange(option)}>
            <View style={[styles.radio, status === option && styles.radioActive]} />
            <Text style={styles.statusOptionText}>{option === 'draft' ? 'Draft' : 'Submitted'}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    gap: 12,
  },
  summaryCard: { backgroundColor: officerTheme.surfaceLowest },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: officerTheme.primaryContainer },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant, marginLeft: 4 },
  selectField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: officerTheme.surfaceLowest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: { fontSize: 15, color: officerTheme.onSurface, fontWeight: '500' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: officerTheme.surfaceLowest,
    color: officerTheme.onSurface,
    fontSize: 15,
  },
  inputDisabled: { backgroundColor: officerTheme.surfaceLow, color: officerTheme.onSurfaceVariant },
  textArea: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
  recordTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metaLabel: { fontSize: 12, color: officerTheme.onSurfaceVariant, fontWeight: '600' },
  metaLabelUpper: {
    fontSize: 12,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  movementCode: { fontSize: 20, fontWeight: '700', color: officerTheme.primaryContainer },
  draftBadge: {
    backgroundColor: 'rgba(216, 200, 75, 0.2)',
    borderColor: 'rgba(216, 200, 75, 0.35)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  draftBadgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.tertiaryContainer },
  recordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '47%', gap: 2 },
  gridValue: { fontSize: 15, fontWeight: '600', color: officerTheme.onSurface },
  stockValue: { color: officerTheme.primaryContainer },
  officerRow: { gap: 4, marginTop: 4 },
  officerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoPanel: {
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    gap: 10,
  },
  panelFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(191, 201, 190, 0.25)' },
  storedBadge: { backgroundColor: officerTheme.secondaryContainer, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  storedBadgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSecondaryContainer, textTransform: 'capitalize' },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: officerTheme.surfaceLowest, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(191, 201, 190, 0.25)' },
  alignRight: { alignItems: 'flex-end' },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: officerTheme.secondaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(44, 106, 72, 0.2)',
  },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: officerTheme.primaryContainer },
  availableBadgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSecondaryContainer },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryTile: {
    width: '47%',
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    alignItems: 'center',
    gap: 4,
  },
  summaryTileHighlight: { backgroundColor: officerTheme.primaryContainer, borderColor: officerTheme.primary },
  summaryValue: { fontSize: 18, fontWeight: '700', color: officerTheme.onSurface },
  summaryMuted: { color: officerTheme.onSurfaceVariant },
  summaryTertiary: { color: officerTheme.tertiaryContainer },
  summaryHighlightValue: { color: officerTheme.onPrimary },
  summaryHighlightLabel: { color: 'rgba(255,255,255,0.85)' },
  destinationCard: {
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    gap: 8,
  },
  destinationTitle: { fontSize: 14, fontWeight: '700', color: officerTheme.onSurface, marginBottom: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityRow: { flexDirection: 'row', gap: 8 },
  quantityInput: { flex: 1, textAlign: 'right' },
  unitSelect: {
    width: 72,
    minHeight: 48,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: officerTheme.surfaceContainerHigh,
    borderRadius: 8,
    padding: 8,
  },
  infoBannerText: { flex: 1, fontSize: 12, color: officerTheme.onSurfaceVariant },
  errorText: { fontSize: 12, color: officerTheme.error, marginLeft: 4 },
  locationCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    gap: 12,
  },
  gpsPanel: {
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 201, 190, 0.25)',
    gap: 4,
  },
  coordsText: { fontSize: 14, fontWeight: '600', color: officerTheme.onSurface, fontFamily: 'monospace' },
  verifiedText: { fontSize: 12, fontWeight: '700', color: officerTheme.primaryContainer },
  gpsActions: { flexDirection: 'row', gap: 10 },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: officerTheme.surface,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  verifyButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: officerTheme.secondaryContainer,
  },
  verifyButtonText: { fontSize: 13, fontWeight: '700', color: officerTheme.onSecondaryContainer },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  evidenceSlot: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 4,
  },
  evidenceImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  evidenceOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  evidenceLabel: { color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 4 },
  evidenceEmptyLabel: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant, textAlign: 'center' },
  addPhotoText: { fontSize: 12, fontWeight: '700', color: officerTheme.primary },
  confirmRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(173, 238, 195, 0.25)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: officerTheme.secondaryContainer,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: officerTheme.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: officerTheme.primaryContainer, borderColor: officerTheme.primaryContainer },
  confirmText: { flex: 1, fontSize: 13, lineHeight: 18, color: officerTheme.onSurface },
  confirmStrong: { fontWeight: '700', color: officerTheme.primaryContainer },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: officerTheme.outlineVariant },
  radioActive: { borderColor: officerTheme.primary, backgroundColor: officerTheme.primary },
  statusOptionText: { fontSize: 14, color: officerTheme.onSurface },
  helperText: { fontSize: 12, color: officerTheme.onSurfaceVariant },
});
