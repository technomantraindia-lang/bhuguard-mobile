import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';

interface ArtisanProLiveCheckInCardProps {
  liveCheckin?: ApiRecord | null;
}

function formatAccuracy(value: unknown): string | null {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `${Math.round(numeric * 10) / 10} m`;
  }

  const label = String(value ?? '').trim();
  if (!label || label === '-' || label === 'null') {
    return null;
  }

  return /m\s*$/i.test(label) ? label : `${label} m`;
}

export function ArtisanProLiveCheckInCard({ liveCheckin }: ArtisanProLiveCheckInCardProps) {
  const session = useArtisanWorkSession();
  const isCheckedIn = session.isCheckedIn || liveCheckin?.is_checked_in === true;
  const village =
    session.session?.village_name?.trim()
    || pickString(liveCheckin ?? {}, 'village')
    || '—';
  const accuracy =
    formatAccuracy(session.session?.gps_accuracy)
    ?? formatAccuracy(session.gpsPreview?.accuracyM)
    ?? formatAccuracy(liveCheckin?.gps_accuracy);
  const statusLabel = isCheckedIn
    ? (session.statusLabel === 'Checked in' ? 'Checked In' : session.statusLabel)
    : 'Checked Out';

  return (
    <View style={[styles.card, officerCardShadow]}>
      <View style={styles.header}>
        <BhuguardMaterialIcon name="location_on" size={22} color={officerTheme.primary} filled />
        <Text style={styles.title}>Live Check-in</Text>
        <View style={[styles.badge, isCheckedIn ? styles.badgeIn : styles.badgeOut]}>
          <Text style={styles.badgeText}>{statusLabel}</Text>
        </View>
      </View>

      {session.hydrating && !session.session ? (
        <Text style={styles.metaLine}>Loading check-in status...</Text>
      ) : (
        <View style={styles.meta}>
          <Text style={styles.metaLine}>Village: {village !== '-' ? village : '—'}</Text>
          <Text style={styles.metaLine}>GPS accuracy: {accuracy ?? '—'}</Text>
        </View>
      )}

      <Pressable
        style={[styles.button, session.submitting && styles.buttonDisabled]}
        onPress={() => {
          void (isCheckedIn ? session.checkOut() : session.checkIn());
        }}
        disabled={session.submitting}
        accessibilityRole="button"
        accessibilityLabel={isCheckedIn ? 'Check Out' : 'Check In'}
      >
        <Text style={styles.buttonText}>
          {session.submitting ? 'Please wait...' : isCheckedIn ? 'Check Out' : 'Check In'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: officerTheme.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 58, 0.16)',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeIn: { backgroundColor: '#DCFCE7' },
  badgeOut: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12, fontWeight: '700', color: officerTheme.onSurface },
  meta: { gap: 4 },
  metaLine: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  button: {
    backgroundColor: officerTheme.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 15 },
});
