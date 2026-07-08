import { StyleSheet, Text, View } from 'react-native';

import { artisanGpsAccuracyLabel, artisanGpsAccuracyTone, type ArtisanGpsAccuracyTier } from '../utils/artisanGpsAccuracy';
import { BIOCHAR_POOR_ACCURACY_MESSAGE } from '../utils/biocharGpsCapture';
import { colors } from '../theme/colors';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';

interface GpsCaptureCardProps {
  latitude?: string;
  longitude?: string;
  accuracy?: string;
  accuracyTier?: ArtisanGpsAccuracyTier;
  capturedAt?: string;
  captured: boolean;
  capturing?: boolean;
  onCapture: () => void;
}

export function GpsCaptureCard({
  latitude,
  longitude,
  accuracy,
  accuracyTier = 'unknown',
  capturedAt,
  captured,
  capturing = false,
  onCapture,
}: GpsCaptureCardProps) {
  const tone = artisanGpsAccuracyTone(accuracyTier);

  return (
    <AppCard title="GPS coordinates" subtitle="Capture current location at the farm boundary.">
      <View style={styles.badgeRow}>
        <StatusBadge label={captured ? 'Captured' : 'Pending'} tone={captured ? 'success' : 'warning'} />
      </View>
      <Text style={styles.line}>Latitude: {latitude || '-'}</Text>
      <Text style={styles.line}>Longitude: {longitude || '-'}</Text>
      <Text
        style={[
          styles.line,
          tone === 'success' && styles.accuracyGood,
          tone === 'warning' && styles.accuracyAcceptable,
          tone === 'danger' && styles.accuracyPoor,
        ]}
      >
        Accuracy: {accuracy ? `${accuracy} m (${artisanGpsAccuracyLabel(accuracyTier)})` : '-'}
      </Text>
      <Text style={styles.line}>Captured at: {capturedAt || '-'}</Text>
      {accuracyTier === 'poor' ? <Text style={styles.warning}>{BIOCHAR_POOR_ACCURACY_MESSAGE}</Text> : null}
      <AppButton
        label={captured ? 'Capture again' : 'Capture current location'}
        onPress={onCapture}
        loading={capturing}
        variant={captured ? 'secondary' : 'primary'}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  badgeRow: { marginBottom: 4 },
  line: { fontSize: 14, color: colors.text, marginTop: 4 },
  warning: { fontSize: 13, color: '#B45309', marginTop: 8, marginBottom: 4 },
  accuracyGood: { color: '#15803D' },
  accuracyAcceptable: { color: '#B45309' },
  accuracyPoor: { color: '#B91C1C' },
});
