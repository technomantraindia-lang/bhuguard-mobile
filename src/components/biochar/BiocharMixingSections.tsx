import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { LiveEvidenceCaptureCard } from '../evidence/LiveEvidenceCaptureCard';
import { EvidenceStampedImageFrame } from '../evidence/EvidenceStampedImageFrame';
import { StatusBadge } from '../StatusBadge';
import type { LiveCapturedEvidence } from '../../utils/liveEvidenceCapture';
import type { ArtisanGpsAccuracyTier } from '../../utils/artisanGpsAccuracy';
import { artisanGpsAccuracyLabel, artisanGpsAccuracyTone } from '../../utils/artisanGpsAccuracy';
import { BIOCHAR_POOR_ACCURACY_MESSAGE } from '../../utils/biocharGpsCapture';
import { formatActivityDisplayDate } from '../../utils/activityDateHelpers';
import type { BiocharMixingEvidenceSlot } from '../../constants/biocharMixing';
import type { BiocharMixingEligibleBatch, BiocharMixingEvidenceAsset } from '../../hooks/useBiocharMixingForm';
import { colors } from '../../theme/colors';

interface BiocharMixingBasicSectionProps {
  site: string;
  dateOfMixing: string;
  readOnly?: boolean;
  siteEditable?: boolean;
  onSiteChange: (value: string) => void;
}

export function BiocharMixingBasicSection({
  site,
  dateOfMixing,
  readOnly = false,
  siteEditable = true,
  onSiteChange,
}: BiocharMixingBasicSectionProps) {
  const safeSite = typeof site === 'string' ? site : '';
  const safeDate = typeof dateOfMixing === 'string' && dateOfMixing.trim() !== ''
    ? dateOfMixing
    : new Date().toISOString().slice(0, 10);

  return (
    <AppCard title="Basic Details" subtitle="Site and date of mixing.">
      <Text style={styles.label}>Site</Text>
      <TextInput
        editable={!readOnly && siteEditable}
        style={[styles.input, (readOnly || !siteEditable) && styles.inputReadonly]}
        value={safeSite}
        onChangeText={onSiteChange}
        placeholder="Farm or village name"
      />

      <Text style={styles.label}>Date of Mixing</Text>
      <Text style={styles.readonlyValue}>{formatActivityDisplayDate(safeDate)}</Text>
      <Text style={styles.meta}>Uses today’s date. Future dates are not allowed.</Text>
    </AppCard>
  );
}

export type MixingLocationStatus =
  | 'pending'
  | 'capturing'
  | 'captured'
  | 'poor_accuracy'
  | 'permission_denied'
  | 'out_of_zone'
  | 'timeout'
  | 'error';

interface BiocharMixingLocationSectionProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracyM: number | null;
  accuracyTier?: ArtisanGpsAccuracyTier;
  gpsCapturedAt?: string | null;
  villageName?: string;
  talukaName?: string;
  districtName?: string;
  stateName?: string;
  locationStatus: MixingLocationStatus;
  capturing?: boolean;
  readOnly?: boolean;
  onCaptureGps: () => void;
}

function locationStatusLabel(status: MixingLocationStatus): string {
  switch (status) {
    case 'capturing':
      return 'Capturing Location';
    case 'captured':
      return 'Location Captured';
    case 'poor_accuracy':
      return 'Poor GPS Accuracy';
    case 'permission_denied':
      return 'Location Permission Denied';
    case 'out_of_zone':
      return 'Out of Zone';
    case 'timeout':
      return 'Location Timed Out';
    case 'error':
      return 'Location Failed';
    default:
      return 'Location Pending';
  }
}

function locationStatusTone(status: MixingLocationStatus): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'captured':
      return 'success';
    case 'capturing':
    case 'pending':
    case 'poor_accuracy':
    case 'permission_denied':
    case 'out_of_zone':
    case 'timeout':
    case 'error':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function BiocharMixingLocationSection({
  latitude,
  longitude,
  altitude,
  accuracyM,
  accuracyTier = 'unknown',
  gpsCapturedAt = null,
  villageName = '',
  talukaName = '',
  districtName = '',
  stateName = '',
  locationStatus,
  capturing = false,
  readOnly = false,
  onCaptureGps,
}: BiocharMixingLocationSectionProps) {
  const captured = latitude != null && longitude != null;
  const accuracyTone = artisanGpsAccuracyTone(accuracyTier);
  const buttonLabel = captured ? 'Refresh Location' : 'Capture Current Location';

  return (
    <AppCard title="Current Location" subtitle="Capture GPS for the mixing site. State is filled from location.">
      <View style={styles.badgeRow}>
        <StatusBadge label={locationStatusLabel(locationStatus)} tone={locationStatusTone(locationStatus)} />
      </View>

      <Text style={styles.line}>Location status: {locationStatusLabel(locationStatus)}</Text>
      <Text
        style={[
          styles.line,
          accuracyTone === 'success' && styles.accuracyGood,
          accuracyTone === 'warning' && styles.accuracyAcceptable,
          accuracyTone === 'danger' && styles.accuracyPoor,
        ]}
      >
        GPS Accuracy:{' '}
        {accuracyM != null ? `${accuracyM} m (${artisanGpsAccuracyLabel(accuracyTier)})` : '-'}
      </Text>
      <Text style={styles.line}>Village: {villageName || '-'}</Text>
      <Text style={styles.line}>Taluka: {talukaName || '-'}</Text>
      <Text style={styles.line}>District: {districtName || '-'}</Text>
      <Text style={styles.line}>State: {stateName || '-'}</Text>
      <Text style={styles.line}>Latitude: {latitude != null ? String(latitude) : '-'}</Text>
      <Text style={styles.line}>Longitude: {longitude != null ? String(longitude) : '-'}</Text>
      {altitude != null ? <Text style={styles.line}>Altitude: {altitude} m</Text> : null}
      <Text style={styles.line}>Captured At: {gpsCapturedAt || '-'}</Text>

      {captured ? <MixingLocationMapPreview latitude={latitude!} longitude={longitude!} /> : null}

      {accuracyTier === 'poor' ? <Text style={styles.warning}>{BIOCHAR_POOR_ACCURACY_MESSAGE}</Text> : null}
      {locationStatus === 'out_of_zone' ? (
        <Text style={styles.warning}>Out of Zone — submission is blocked until you capture a location in your assigned area.</Text>
      ) : null}
      {locationStatus === 'permission_denied' || locationStatus === 'timeout' || locationStatus === 'error' ? (
        <Text style={styles.warning}>Unable to capture location. Check permissions and try again.</Text>
      ) : null}

      {!readOnly ? (
        <AppButton
          label={
            locationStatus === 'permission_denied' || locationStatus === 'timeout' || locationStatus === 'error'
              ? 'Retry'
              : buttonLabel
          }
          onPress={onCaptureGps}
          loading={capturing}
          variant={captured ? 'secondary' : 'primary'}
        />
      ) : null}
    </AppCard>
  );
}

interface BiocharMixingFarmerSectionProps {
  farmerName: string;
  farmerCode: string;
  farmCode: string;
}

export function BiocharMixingFarmerSection({
  farmerName,
  farmerCode,
  farmCode,
}: BiocharMixingFarmerSectionProps) {
  return (
    <AppCard title="Farmer Details" subtitle="Resolved from the selected farm.">
      <Text style={styles.line}>Farm: {farmCode || '-'}</Text>
      <Text style={styles.line}>Farmer Name: {farmerName || '-'}</Text>
      <Text style={styles.line}>Farmer ID: {farmerCode || '-'}</Text>
    </AppCard>
  );
}

interface BiocharMixingBatchSectionProps {
  batches: BiocharMixingEligibleBatch[];
  selectedBatchIds: number[];
  selectedBatchCount: number;
  combinedSelectedQuantity: number;
  loadingBatches: boolean;
  batchesError: string | null;
  emptyMessage?: string | null;
  readOnly?: boolean;
  onToggleBatch: (batchId: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onRefresh: () => void;
  onGoBack?: () => void;
}

export function BiocharMixingBatchSection({
  batches,
  selectedBatchIds,
  selectedBatchCount,
  combinedSelectedQuantity,
  loadingBatches,
  batchesError,
  emptyMessage,
  readOnly = false,
  onToggleBatch,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  onGoBack,
}: BiocharMixingBatchSectionProps) {
  return (
    <AppCard title="Batch Details" subtitle="Select one or more eligible batches for this farm.">
      {loadingBatches ? <Text style={styles.meta}>Loading batches for this farm…</Text> : null}

      {!loadingBatches && batchesError ? <Text style={styles.warning}>{batchesError}</Text> : null}

      {!loadingBatches && !batchesError && batches.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.warning}>
            {emptyMessage || 'No approved Biochar Production Batch is available for this farm.'}
          </Text>
          <View style={styles.emptyActions}>
            <AppButton label="Refresh" variant="secondary" onPress={onRefresh} />
            {onGoBack ? <AppButton label="Go Back" variant="secondary" onPress={onGoBack} /> : null}
          </View>
        </View>
      ) : null}

      {!loadingBatches && batches.length > 0 ? (
        <>
          <Text style={styles.meta}>Selected: {selectedBatchCount} batch{selectedBatchCount === 1 ? '' : 'es'}</Text>
          {!readOnly && onSelectAll && onDeselectAll ? (
            <View style={styles.batchActions}>
              <AppButton label="Select All" variant="secondary" onPress={onSelectAll} />
              <AppButton label="Deselect All" variant="secondary" onPress={onDeselectAll} />
            </View>
          ) : null}
        </>
      ) : null}

      {!loadingBatches &&
        batches.map((batch) => {
          const active = selectedBatchIds.includes(batch.id);
          return (
            <Pressable
              key={batch.id}
              disabled={readOnly}
              style={[styles.detailBox, active && styles.batchCardActive]}
              onPress={() => onToggleBatch(batch.id)}
            >
              <Text style={styles.line}>
                {active ? '☑' : '☐'} Batch ID: {batch.batchCode || batch.id}
              </Text>
              <Text style={styles.line}>
                Production Date: {batch.productionDate ? formatActivityDisplayDate(batch.productionDate) : '-'}
              </Text>
            </Pressable>
          );
        })}

      {!loadingBatches && batches.length > 0 ? (
        <AppButton label="Refresh" variant="secondary" onPress={onRefresh} />
      ) : null}
    </AppCard>
  );
}

interface BiocharMixingEvidenceCardProps {
  slot: BiocharMixingEvidenceSlot;
  evidence?: BiocharMixingEvidenceAsset;
  readOnly?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onPreview?: (uri: string) => void;
}

export function BiocharMixingEvidenceCard({
  slot,
  evidence,
  readOnly = false,
  onAdd,
  onRemove,
  onPreview,
}: BiocharMixingEvidenceCardProps) {
  if (slot.kind === 'document' && evidence) {
    return (
      <AppCard title={slot.title} subtitle={slot.description}>
        <EvidenceStampedImageFrame uri={evidence.uri} onPress={onPreview ? () => onPreview(evidence.uri) : undefined} />
        {!readOnly ? <AppButton label="Replace document" variant="secondary" onPress={onAdd} /> : null}
      </AppCard>
    );
  }

  return (
    <AppCard title={slot.title} subtitle={slot.description}>
      <LiveEvidenceCaptureCard
        evidence={evidence ? toLiveEvidence(evidence) : null}
        onOpenCamera={onAdd}
        onRetake={onRemove}
        onOpenPreview={onPreview}
      />
    </AppCard>
  );
}

function MixingLocationMapPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <View style={styles.mapWrap}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderTitle}>Mixing Location</Text>
        <Text style={styles.mapPlaceholderText}>
          Map view will use MapLibre. Captured GPS is listed below.
        </Text>
        <Text style={styles.mapCoordinateText}>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </Text>
      </View>
    </View>
  );
}

function toLiveEvidence(asset: BiocharMixingEvidenceAsset): LiveCapturedEvidence {
  return {
    uri: asset.uri,
    previewUri: asset.uri,
    name: 'evidence.jpg',
    type: 'image/jpeg',
    label: 'Evidence',
    capturedAt: asset.capturedAt ?? new Date().toISOString(),
    latitude: asset.latitude ?? null,
    longitude: asset.longitude ?? null,
    accuracy: asset.accuracy ?? null,
    village: '',
    taluka: '',
    district: '',
    state: '',
    watermark: {
      capturedAtLabel: asset.capturedAt ?? '',
      latitudeLabel: asset.latitude != null ? `Lat ${asset.latitude}` : 'Lat -',
      longitudeLabel: asset.longitude != null ? `Lng ${asset.longitude}` : 'Lng -',
      accuracyLabel: asset.accuracy != null ? `Accuracy: ${Math.round(asset.accuracy)}m` : 'Accuracy: —',
      villageLabel: '',
      talukaLabel: '',
      districtLabel: '',
      stateLabel: '',
    },
  };
}

interface BiocharMixingNotesSectionProps {
  notes: string;
  readOnly?: boolean;
  onNotesChange: (value: string) => void;
}

export function BiocharMixingNotesSection({ notes, readOnly = false, onNotesChange }: BiocharMixingNotesSectionProps) {
  return (
    <AppCard title="Notes" subtitle="Optional remarks for this mixing record.">
      <TextInput
        editable={!readOnly}
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={onNotesChange}
        multiline
        placeholder="Add notes"
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0D8',
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputReadonly: {
    backgroundColor: '#F3F7F4',
  },
  readonlyValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#F3F7F4',
    borderColor: '#D7E0D8',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.softGreen,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
  line: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  badgeRow: { marginBottom: 4 },
  warning: { fontSize: 13, color: '#B45309', marginTop: 8, marginBottom: 4 },
  accuracyGood: { color: '#15803D' },
  accuracyAcceptable: { color: '#B45309' },
  accuracyPoor: { color: '#B91C1C' },
  emptyBox: { gap: 10, marginTop: 4 },
  emptyActions: { gap: 8 },
  detailBox: {
    backgroundColor: '#F7FAF7',
    borderColor: '#D7E0D8',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    padding: 12,
  },
  batchCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.softGreen,
  },
  batchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  mapWrap: {
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D7E0D8',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    padding: 16,
    backgroundColor: '#F3F7F4',
  },
  mapPlaceholderTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  mapPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  mapCoordinateText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
});
