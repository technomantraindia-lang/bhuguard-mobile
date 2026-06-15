import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { buildStaticMapUrl, type FarmCoordinates } from '../../utils/farmMapHelpers';

interface FarmerFarmsMapOverviewProps {
  coordinates: FarmCoordinates[];
  onOpenMaps: () => void;
}

export function FarmerFarmsMapOverview({ coordinates, onOpenMaps }: FarmerFarmsMapOverviewProps) {
  const mapUrl = buildStaticMapUrl(coordinates);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Farm Locations Map</Text>
        <Pressable style={styles.linkButton} onPress={onOpenMaps} disabled={coordinates.length === 0}>
          <Text style={[styles.linkText, coordinates.length === 0 && styles.linkDisabled]}>Open in Google Maps</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.mapCard, dashboardShadow]}
        onPress={onOpenMaps}
        disabled={coordinates.length === 0}
      >
        {mapUrl ? (
          <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" />
        ) : (
          <View style={styles.emptyMap}>
            <BhuguardMaterialIcon name="location_on" size={28} color={dashboardTheme.outline} />
            <Text style={styles.emptyText}>No GPS coordinates mapped yet</Text>
          </View>
        )}

        {coordinates.length > 0 ? (
          <View style={styles.markerBadge}>
            <Text style={styles.markerBadgeText}>{coordinates.length} mapped</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  linkButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  linkDisabled: {
    opacity: 0.45,
  },
  mapCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  emptyMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
  },
  markerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: dashboardTheme.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  markerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
});
