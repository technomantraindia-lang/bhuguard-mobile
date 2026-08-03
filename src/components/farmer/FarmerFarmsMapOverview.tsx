import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { buildStaticMapUrl, type FarmCoordinates, type FarmerFarmViewModel } from '../../utils/farmMapHelpers';

export type FarmMapLabelItem = {
  id: number;
  farmName: string;
  farmerName: string;
  farmId: string;
  coordinates: FarmCoordinates | null;
};

interface FarmerFarmsMapOverviewProps {
  coordinates: FarmCoordinates[];
  /** Phase 12.2 — labeled farms for the location map (Farm Name / Farmer Name / Farm ID). */
  farms?: Array<Pick<FarmerFarmViewModel, 'id' | 'name' | 'code' | 'coordinates'> & { farmerName?: string }>;
  farmerName?: string;
  onOpenMaps: () => void;
}

export function FarmerFarmsMapOverview({
  coordinates,
  farms = [],
  farmerName = '',
  onOpenMaps,
}: FarmerFarmsMapOverviewProps) {
  const mapUrl = buildStaticMapUrl(coordinates);
  const labeledFarms = farms.filter((farm) => farm.coordinates);

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

      {labeledFarms.length > 0 ? (
        <View style={styles.labelList}>
          {labeledFarms.map((farm) => (
            <View key={farm.id} style={styles.labelRow}>
              <BhuguardMaterialIcon name="location_on" size={16} color={dashboardTheme.primaryContainer} />
              <View style={styles.labelCopy}>
                <Text style={styles.labelFarmName}>{farm.name}</Text>
                <Text style={styles.labelMeta}>
                  {[farmerName || farm.farmerName, farm.code ? `Farm ID: ${farm.code}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
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
    padding: 16,
  },
  emptyText: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
    textAlign: 'center',
  },
  markerBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(3, 21, 13, 0.78)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  labelList: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 4,
  },
  labelCopy: {
    flex: 1,
    gap: 2,
  },
  labelFarmName: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  labelMeta: {
    fontSize: 12,
    color: dashboardTheme.onSurfaceVariant,
  },
});
