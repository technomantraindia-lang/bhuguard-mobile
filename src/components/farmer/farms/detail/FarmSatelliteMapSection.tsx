import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';
import type { ApiRecord } from '../../../../utils/apiHelpers';
import {
  buildEsriSatelliteUrl,
  getPolygonBounds,
  parseFarmPolygon,
  polygonCentroid,
  projectPolygonToPixels,
  projectToPixels,
  toSvgPath,
  type LatLng,
} from '../../../../utils/farmSatelliteMap';

const MAP_WIDTH = 358;
const MAP_HEIGHT = 300;

interface FarmSatelliteMapSectionProps {
  farmRecord: ApiRecord;
  areaLabel: string;
  center: LatLng;
  polygonCoordinatesLabel: string;
  onOpenGoogleMaps?: () => void;
  onOpenFullScreen: () => void;
  onRefresh: () => void;
  onEditBoundary?: () => void;
  onCaptureBoundaryWithCamera?: () => void;
  onViewBoundaryPhotos?: () => void;
  onRecaptureBoundary?: () => void;
  mapHeight?: number;
}

export function FarmSatelliteMapSection({
  farmRecord,
  areaLabel,
  center,
  polygonCoordinatesLabel,
  onOpenGoogleMaps,
  onOpenFullScreen,
  onRefresh,
  onEditBoundary,
  onCaptureBoundaryWithCamera,
  onViewBoundaryPhotos,
  onRecaptureBoundary,
  mapHeight = MAP_HEIGHT,
}: FarmSatelliteMapSectionProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  const polygon = useMemo(() => parseFarmPolygon(farmRecord, center), [farmRecord, center]);
  const bounds = useMemo(() => getPolygonBounds(polygon, 0.28 / zoomLevel), [polygon, zoomLevel]);
  const mapUrl = useMemo(
    () => buildEsriSatelliteUrl(bounds, MAP_WIDTH, mapHeight),
    [bounds, mapHeight],
  );
  const pixelPolygon = useMemo(
    () => projectPolygonToPixels(polygon, bounds, MAP_WIDTH, mapHeight),
    [polygon, bounds, mapHeight],
  );
  const centroid = useMemo(() => polygonCentroid(polygon), [polygon]);
  const centroidPixel = useMemo(
    () => projectToPixels(centroid, bounds, MAP_WIDTH, mapHeight),
    [centroid, bounds, mapHeight],
  );
  const markerPixel = useMemo(
    () => projectToPixels(center, bounds, MAP_WIDTH, mapHeight),
    [center, bounds, mapHeight],
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.mapCard, dashboardShadow, { height: mapHeight }]}>
        <Image source={{ uri: mapUrl }} style={[styles.mapImage, { height: mapHeight }]} resizeMode="cover" />

        <Svg width={MAP_WIDTH} height={mapHeight} style={styles.overlay}>
          <Defs>
            <LinearGradient id="farmFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0B6B3A" stopOpacity={heatmapEnabled ? '0.42' : '0.28'} />
              <Stop offset="1" stopColor="#9FF5B7" stopOpacity={heatmapEnabled ? '0.24' : '0.14'} />
            </LinearGradient>
          </Defs>

          <Path
            d={toSvgPath(pixelPolygon)}
            fill="url(#farmFill)"
            stroke="#0B6B3A"
            strokeWidth={heatmapEnabled ? 3.5 : 2.5}
            strokeLinejoin="round"
          />

          {heatmapEnabled
            ? pixelPolygon.map((point, index) => (
                <Circle
                  key={`heat-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={18}
                  fill="rgba(202, 138, 4, 0.18)"
                />
              ))
            : null}

          <Circle cx={markerPixel.x} cy={markerPixel.y} r={7} fill="#FFFFFF" stroke="#0B6B3A" strokeWidth={2} />
          <Circle cx={markerPixel.x} cy={markerPixel.y} r={2.5} fill="#0B6B3A" />

          {pixelPolygon.map((point, index) => (
            <Circle key={`vertex-${index}`} cx={point.x} cy={point.y} r={9} fill="#FFFFFF" stroke="#0B6B3A" strokeWidth={2} />
          ))}
          {pixelPolygon.map((point, index) => (
            <SvgText
              key={`vertex-label-${index}`}
              x={point.x}
              y={point.y + 4}
              fontSize={9}
              fontWeight="700"
              fill="#0B6B3A"
              textAnchor="middle"
            >
              {index + 1}
            </SvgText>
          ))}
        </Svg>

        <View style={[styles.areaLabel, { left: centroidPixel.x - 52, top: centroidPixel.y - 14 }]}>
          <Text style={styles.areaLabelText}>{areaLabel}</Text>
        </View>

        <View style={styles.satelliteBadge}>
          <BhuguardMaterialIcon name="share_location" size={14} color={dashboardTheme.onPrimary} />
          <Text style={styles.satelliteBadgeText}>Satellite</Text>
        </View>

        <View style={styles.northBadge}>
          <View style={styles.northCircle}>
            <View style={styles.northArrow} />
            <Text style={styles.northLabel}>N</Text>
          </View>
        </View>

        <View style={styles.zoomControls}>
          <Pressable
            style={styles.zoomButton}
            onPress={() => setZoomLevel((value) => Math.min(value + 0.25, 2.2))}
            accessibilityLabel="Zoom in"
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </Pressable>
          <Pressable
            style={styles.zoomButton}
            onPress={() => setZoomLevel((value) => Math.max(value - 0.25, 0.75))}
            accessibilityLabel="Zoom out"
          >
            <Text style={styles.zoomButtonText}>−</Text>
          </Pressable>
        </View>

        <View style={styles.coordsBar}>
          <Text style={styles.coordsText} numberOfLines={2}>
            {polygonCoordinatesLabel}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onOpenGoogleMaps ? <MapActionChip icon="map" label="Google Maps" onPress={onOpenGoogleMaps} /> : null}
        <MapActionChip icon="landscape" label="Full Screen" onPress={onOpenFullScreen} />
        <MapActionChip icon="location_on" label="Refresh" onPress={onRefresh} />
        {onEditBoundary ? <MapActionChip icon="assignment" label="Edit Boundary" onPress={onEditBoundary} /> : null}
        {onCaptureBoundaryWithCamera ? (
          <MapActionChip icon="photo_camera" label="Capture with Camera" onPress={onCaptureBoundaryWithCamera} />
        ) : null}
        {onViewBoundaryPhotos ? (
          <MapActionChip icon="landscape" label="View Photos" onPress={onViewBoundaryPhotos} />
        ) : null}
        {onRecaptureBoundary ? (
          <MapActionChip icon="share_location" label="Re-Capture" onPress={onRecaptureBoundary} />
        ) : null}
        <MapActionChip
          icon="analytics"
          label="Heatmap"
          active={heatmapEnabled}
          onPress={() => setHeatmapEnabled((value) => !value)}
        />
      </View>
    </View>
  );
}

function MapActionChip({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: 'map' | 'landscape' | 'location_on' | 'analytics' | 'assignment' | 'photo_camera' | 'share_location';
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionChip, active && styles.actionChipActive]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <BhuguardMaterialIcon
        name={icon}
        size={16}
        color={active ? dashboardTheme.onPrimary : dashboardTheme.primaryContainer}
      />
      <Text style={[styles.actionChipText, active && styles.actionChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  mapCard: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    alignSelf: 'center',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: '#1E2A22',
  },
  mapImage: {
    ...StyleSheet.absoluteFill,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  areaLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#ADEEC3',
  },
  areaLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: dashboardTheme.primaryContainer,
  },
  satelliteBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  satelliteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  northBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  northCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#D1E7DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  northArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: dashboardTheme.primaryContainer,
    marginBottom: 1,
  },
  northLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: dashboardTheme.textMuted,
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 52,
    gap: 6,
  },
  zoomButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  zoomButtonText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  coordsBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 43, 28, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordsText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    color: '#EAF7EF',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: dashboardTheme.surfaceLowest,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionChipActive: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderColor: dashboardTheme.primaryContainer,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  actionChipTextActive: {
    color: dashboardTheme.onPrimary,
  },
});
