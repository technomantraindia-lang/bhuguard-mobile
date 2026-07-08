import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { GpsCaptureCard } from '../GpsCaptureCard';
import { AppButton } from '../AppButton';
import { AppCard } from '../AppCard';
import { LiveEvidenceCaptureCard } from '../evidence/LiveEvidenceCaptureCard';
import { EvidenceStampedImageFrame } from '../evidence/EvidenceStampedImageFrame';
import type { LiveCapturedEvidence } from '../../utils/liveEvidenceCapture';
import type { ArtisanGpsAccuracyTier } from '../../utils/artisanGpsAccuracy';
import { BIOCHAR_MIXING_STATES, type BiocharMixingEvidenceSlot } from '../../constants/biocharMixing';
import type { BiocharMixingEvidenceAsset } from '../../hooks/useBiocharMixingForm';
import { colors } from '../../theme/colors';

interface BiocharMixingBasicSectionProps {
  state: string;
  site: string;
  dateOfMixing: string;
  readOnly?: boolean;
  onStateChange: (value: string) => void;
  onSiteChange: (value: string) => void;
  onDateChange: (value: string) => void;
}

export function BiocharMixingBasicSection({
  state,
  site,
  dateOfMixing,
  readOnly = false,
  onStateChange,
  onSiteChange,
  onDateChange,
}: BiocharMixingBasicSectionProps) {
  return (
    <AppCard title="Basic Details" subtitle="State, site, and date of mixing.">
      <Text style={styles.label}>State</Text>
      <View style={styles.chipRow}>
        {BIOCHAR_MIXING_STATES.map((option) => {
          const active = state === option.value;
          return (
            <Pressable
              key={option.value}
              disabled={readOnly}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onStateChange(option.value)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Site</Text>
      <TextInput
        editable={!readOnly}
        style={styles.input}
        value={site}
        onChangeText={onSiteChange}
        placeholder="Enter site name"
      />

      <Text style={styles.label}>Date of Mixing</Text>
      <TextInput
        editable={!readOnly}
        style={styles.input}
        value={dateOfMixing}
        onChangeText={onDateChange}
        placeholder="YYYY-MM-DD"
      />
    </AppCard>
  );
}

interface BiocharMixingLocationSectionProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracyM: number | null;
  accuracyTier?: ArtisanGpsAccuracyTier;
  gpsCapturedAt?: string | null;
  capturing?: boolean;
  readOnly?: boolean;
  onCaptureGps: () => void;
}

export function BiocharMixingLocationSection({
  latitude,
  longitude,
  altitude,
  accuracyM,
  accuracyTier = 'unknown',
  gpsCapturedAt = null,
  capturing = false,
  readOnly = false,
  onCaptureGps,
}: BiocharMixingLocationSectionProps) {
  return (
    <AppCard title="Location of Mixing" subtitle="Capture high-accuracy GPS for the mixing site.">
      <GpsCaptureCard
        latitude={latitude != null ? String(latitude) : undefined}
        longitude={longitude != null ? String(longitude) : undefined}
        accuracy={accuracyM != null ? String(accuracyM) : undefined}
        accuracyTier={accuracyTier}
        capturedAt={gpsCapturedAt ?? undefined}
        captured={latitude != null && longitude != null}
        capturing={capturing}
        onCapture={readOnly ? () => undefined : onCaptureGps}
      />
      {altitude != null ? <Text style={styles.meta}>Altitude: {altitude} m</Text> : null}
    </AppCard>
  );
}

interface BiocharMixingFarmerSectionProps {
  farmerName: string;
  phoneNumber: string;
  acresOfCotton: string;
  readOnly?: boolean;
  onFarmerNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAcresChange: (value: string) => void;
}

export function BiocharMixingFarmerSection({
  farmerName,
  phoneNumber,
  acresOfCotton,
  readOnly = false,
  onFarmerNameChange,
  onPhoneChange,
  onAcresChange,
}: BiocharMixingFarmerSectionProps) {
  return (
    <AppCard title="Farmer Details" subtitle="Farmer identity and cotton production acres.">
      <Text style={styles.label}>Name of the Farmer</Text>
      <TextInput editable={!readOnly} style={styles.input} value={farmerName} onChangeText={onFarmerNameChange} />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput editable={!readOnly} style={styles.input} value={phoneNumber} onChangeText={onPhoneChange} keyboardType="phone-pad" />

      <Text style={styles.label}>Number of acres of Cotton Production</Text>
      <TextInput editable={!readOnly} style={styles.input} value={acresOfCotton} onChangeText={onAcresChange} keyboardType="decimal-pad" />
    </AppCard>
  );
}

interface BiocharMixingBatchSectionProps {
  batchNumbers: string;
  readOnly?: boolean;
  onBatchNumbersChange: (value: string) => void;
}

export function BiocharMixingBatchSection({ batchNumbers, readOnly = false, onBatchNumbersChange }: BiocharMixingBatchSectionProps) {
  return (
    <AppCard title="Batch Details" subtitle="Enter one or more batch numbers.">
      <TextInput
        editable={!readOnly}
        style={[styles.input, styles.textArea]}
        value={batchNumbers}
        onChangeText={onBatchNumbersChange}
        placeholder="e.g. BCH-2026-00001, BCH-2026-00002"
        multiline
      />
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
    state: 'Gujarat',
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
  textArea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
});
