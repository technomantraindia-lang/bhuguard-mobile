import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';

interface GpsCaptureCardProps {
  latitude?: string;
  longitude?: string;
  accuracy?: string;
  capturedAt?: string;
  captured: boolean;
  capturing?: boolean;
  onCapture: () => void;
}

export function GpsCaptureCard({
  latitude,
  longitude,
  accuracy,
  capturedAt,
  captured,
  capturing = false,
  onCapture,
}: GpsCaptureCardProps) {
  return (
    <AppCard title="GPS coordinates" subtitle="Capture current location at the farm boundary.">
      <View style={styles.badgeRow}>
        <StatusBadge label={captured ? 'Captured' : 'Pending'} tone={captured ? 'success' : 'warning'} />
      </View>
      <Text style={styles.line}>Latitude: {latitude || '-'}</Text>
      <Text style={styles.line}>Longitude: {longitude || '-'}</Text>
      <Text style={styles.line}>Accuracy: {accuracy ? `${accuracy} m` : '-'}</Text>
      <Text style={styles.line}>Captured at: {capturedAt || '-'}</Text>
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
});
