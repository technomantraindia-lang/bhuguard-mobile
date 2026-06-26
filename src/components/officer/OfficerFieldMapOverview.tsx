import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OfficerMapMarker } from '../../hooks/useFieldOfficerDashboardData';
import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { officerCardShadow, officerShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { openGoogleMaps } from '../../utils/officerGpsCapture';

interface OfficerFieldMapOverviewProps {
  markers: OfficerMapMarker[];
  onMarkerPress?: (marker: OfficerMapMarker) => void;
}

function markerColor(tone: OfficerMapMarker['tone']): string {
  switch (tone) {
    case 'alert':
      return officerTheme.error;
    case 'warning':
      return officerTheme.tertiary;
    default:
      return officerTheme.primary;
  }
}

function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

export function OfficerFieldMapOverview({ markers = [], onMarkerPress }: OfficerFieldMapOverviewProps) {
  const safeMarkers = Array.isArray(markers) ? markers : [];

  if (safeMarkers.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Visit GPS Locations</Text>
        <View style={[styles.emptyCard, officerCardShadow]}>
          <BhuguardMaterialIcon name="location_on" size={28} color={officerTheme.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>No GPS-enabled visits available yet.</Text>
          <Text style={styles.emptyMessage}>
            Assigned visits with farm or site coordinates will appear here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Visit GPS Locations</Text>
      <View style={styles.list}>
        {safeMarkers.map((marker) => (
          <Pressable
            key={marker.id}
            style={({ pressed }) => [styles.locationCard, officerCardShadow, pressed && styles.pressed]}
            onPress={() => onMarkerPress?.(marker)}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.statusDot, { backgroundColor: markerColor(marker.tone) }]} />
              <View style={styles.cardCopy}>
                <Text style={styles.farmName}>{marker.farmName}</Text>
                <Text style={styles.locationText}>{marker.location}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{marker.statusLabel}</Text>
              </View>
            </View>

            <View style={styles.coordsRow}>
              <Text style={styles.coordsLabel}>GPS</Text>
              <Text style={styles.coordsValue}>
                {formatCoordinate(marker.latitude)}, {formatCoordinate(marker.longitude)}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
              onPress={() => void openGoogleMaps(marker.latitude, marker.longitude)}
            >
              <BhuguardMaterialIcon name="map" size={16} color={officerTheme.primary} />
              <Text style={styles.mapButtonText}>Open in Maps</Text>
            </Pressable>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: officerTheme.onSurface,
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  locationCard: {
    backgroundColor: officerTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 14,
    gap: 10,
    ...officerShadow,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  farmName: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
  },
  locationText: {
    fontSize: 13,
    lineHeight: 18,
    color: officerTheme.onSurfaceVariant,
  },
  statusBadge: {
    backgroundColor: officerTheme.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: officerTheme.primary,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  coordsValue: {
    flex: 1,
    fontSize: 12,
    color: officerTheme.onSurface,
    fontVariant: ['tabular-nums'],
  },
  mapButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: officerTheme.surfaceContainer,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: officerTheme.primary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: officerTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: officerTheme.onSurface,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
