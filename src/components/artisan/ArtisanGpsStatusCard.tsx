import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import {
  artisanGpsAccuracyLabel,
  artisanGpsAccuracyTone,
  formatArtisanGpsCoordinate,
  formatArtisanGpsTimestamp,
  type ArtisanGpsAccuracyTier,
} from '../../utils/artisanGpsAccuracy';
import { colors, spacing } from '../../theme';

interface ArtisanGpsStatusCardProps {
  title?: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  accuracyTier: ArtisanGpsAccuracyTier;
  lastCapturedAt: string | null;
  capturing: boolean;
  isPoorAccuracy: boolean;
  onCaptureGps: () => void;
  onRetryGps: () => void;
}

function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const backgroundColor =
    tone === 'success'
      ? '#DCFCE7'
      : tone === 'warning'
        ? '#FEF3C7'
        : tone === 'danger'
          ? '#FEE2E2'
          : '#F3F4F6';
  const color =
    tone === 'success'
      ? '#166534'
      : tone === 'warning'
        ? '#92400E'
        : tone === 'danger'
          ? '#B91C1C'
          : colors.textMuted;

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function ArtisanGpsStatusCard({
  title = 'GPS Status',
  latitude,
  longitude,
  accuracyM,
  accuracyTier,
  lastCapturedAt,
  capturing,
  isPoorAccuracy,
  onCaptureGps,
  onRetryGps,
}: ArtisanGpsStatusCardProps) {
  const captured = latitude != null && longitude != null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {captured ? (
          <View style={styles.capturedBadge}>
            <BhuguardMaterialIcon name="verified" size={14} color={colors.primary} />
            <Text style={styles.capturedBadgeText}>Captured</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Latitude</Text>
        <Text style={styles.value}>{formatArtisanGpsCoordinate(latitude, 'N')}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Longitude</Text>
        <Text style={styles.value}>{formatArtisanGpsCoordinate(longitude, 'E')}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Accuracy</Text>
        <Text style={styles.value}>
          {accuracyM != null ? `${accuracyM.toFixed(1)} m (${artisanGpsAccuracyLabel(accuracyTier)})` : '—'}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Accuracy Status</Text>
        <StatusPill label={artisanGpsAccuracyLabel(accuracyTier)} tone={artisanGpsAccuracyTone(accuracyTier)} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Last Captured</Text>
        <Text style={styles.value}>{formatArtisanGpsTimestamp(lastCapturedAt)}</Text>
      </View>

      {isPoorAccuracy ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>GPS accuracy is low. Please wait for better location accuracy.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={onCaptureGps} disabled={capturing}>
          <BhuguardMaterialIcon name="location_on" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>{capturing ? 'Capturing…' : 'Capture GPS'}</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onRetryGps} disabled={capturing}>
          <BhuguardMaterialIcon name="sync" size={18} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Retry GPS</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  capturedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EAF7EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  capturedBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    color: colors.textMuted,
    flex: 1,
  },
  value: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  warningText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EAF7EF',
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
});
