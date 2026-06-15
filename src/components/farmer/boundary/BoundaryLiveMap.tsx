import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  buildEsriSatelliteUrl,
  getPolygonBounds,
  polygonCentroid,
  projectPolygonToPixels,
  projectToPixels,
  toSvgPath,
  type LatLng,
} from '../../../utils/farmSatelliteMap';
import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import { boundaryPointsToLatLng } from '../../../utils/boundaryGeometry';

interface BoundaryLiveMapProps {
  points: BoundaryPoint[];
  currentLocation?: LatLng | null;
  areaLabel?: string;
  showPolygon?: boolean;
  height?: number;
  width?: number;
  onCenterGps?: () => void;
  onToggleSatellite?: () => void;
  satelliteMode?: boolean;
}

export function BoundaryLiveMap({
  points,
  currentLocation,
  areaLabel,
  showPolygon = true,
  height = 420,
  width = 358,
  onCenterGps,
  onToggleSatellite,
  satelliteMode = true,
}: BoundaryLiveMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  const polygon = useMemo(() => {
    const latLng = boundaryPointsToLatLng(points);

    if (latLng.length >= 3) {
      return latLng;
    }

    if (currentLocation) {
      return [currentLocation];
    }

    return [{ latitude: 22.3379, longitude: 73.1739 }];
  }, [points, currentLocation]);

  const bounds = useMemo(() => getPolygonBounds(polygon, 0.35 / zoomLevel), [polygon, zoomLevel]);
  const mapUrl = useMemo(() => {
    if (!satelliteMode) {
      const bbox = `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
      return `https://staticmap.openstreetmap.de/staticmap.php?bbox=${encodeURIComponent(bbox)}&size=${width}x${height}&maptype=mapnik`;
    }

    return buildEsriSatelliteUrl(bounds, width, height);
  }, [bounds, height, width, satelliteMode]);

  const pixelPolygon = useMemo(
    () => (points.length >= 2 ? projectPolygonToPixels(boundaryPointsToLatLng(points), bounds, width, height) : []),
    [points, bounds, width, height],
  );

  const centroid = useMemo(() => {
    if (points.length >= 3) {
      return polygonCentroid(boundaryPointsToLatLng(points));
    }

    return currentLocation ?? polygon[0];
  }, [points, currentLocation, polygon]);

  const centroidPixel = useMemo(
    () => projectToPixels(centroid, bounds, width, height),
    [centroid, bounds, width, height],
  );

  const currentPixel = useMemo(() => {
    if (!currentLocation) {
      return null;
    }

    return projectToPixels(currentLocation, bounds, width, height);
  }, [currentLocation, bounds, width, height]);

  const linePath = useMemo(() => {
    if (pixelPolygon.length < 2) {
      return '';
    }

    return pixelPolygon.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  }, [pixelPolygon]);

  return (
    <View style={[styles.wrap, { height }]}>
      <Image source={{ uri: mapUrl }} style={[styles.mapImage, { width, height }]} resizeMode="cover" />

      <Svg width={width} height={height} style={styles.overlay}>
        <Defs>
          <LinearGradient id="boundaryFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B6B3A" stopOpacity="0.3" />
            <Stop offset="1" stopColor="#9FF5B7" stopOpacity="0.16" />
          </LinearGradient>
        </Defs>

        {linePath ? <Path d={linePath} stroke="#0B6B3A" strokeWidth={3} fill="none" strokeLinejoin="round" /> : null}

        {showPolygon && points.length >= 3 ? (
          <Path
            d={toSvgPath(pixelPolygon)}
            fill="url(#boundaryFill)"
            stroke="#0B6B3A"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ) : null}

        {pixelPolygon.map((point, index) => (
          <Circle key={`point-${index}`} cx={point.x} cy={point.y} r={11} fill="#FFFFFF" stroke="#0B6B3A" strokeWidth={2} />
        ))}

        {pixelPolygon.map((point, index) => (
          <SvgText
            key={`label-${index}`}
            x={point.x}
            y={point.y + 4}
            fontSize={10}
            fontWeight="700"
            fill="#0B6B3A"
            textAnchor="middle"
          >
            {index + 1}
          </SvgText>
        ))}

        {currentPixel ? (
          <>
            <Circle cx={currentPixel.x} cy={currentPixel.y} r={9} fill="#FFFFFF" stroke="#1D4ED8" strokeWidth={2.5} />
            <Circle cx={currentPixel.x} cy={currentPixel.y} r={3} fill="#1D4ED8" />
          </>
        ) : null}
      </Svg>

      {areaLabel && points.length >= 3 ? (
        <View style={[styles.areaLabel, { left: centroidPixel.x - 54, top: centroidPixel.y - 14 }]}>
          <Text style={styles.areaLabelText}>{areaLabel}</Text>
        </View>
      ) : null}

      <View style={styles.satelliteBadge}>
        <BhuguardMaterialIcon name="share_location" size={14} color={dashboardTheme.onPrimary} />
        <Text style={styles.satelliteBadgeText}>{satelliteMode ? 'Satellite' : 'Map'}</Text>
      </View>

      <View style={styles.controls}>
        {onToggleSatellite ? (
          <Pressable style={styles.controlButton} onPress={onToggleSatellite}>
            <Text style={styles.controlButtonText}>{satelliteMode ? 'Map' : 'Satellite'}</Text>
          </Pressable>
        ) : null}
        {onCenterGps ? (
          <Pressable style={styles.controlButton} onPress={onCenterGps}>
            <Text style={styles.controlButtonText}>Center GPS</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.controlButton} onPress={() => setZoomLevel((value) => Math.min(value + 0.2, 2))}>
          <Text style={styles.controlButtonText}>+</Text>
        </Pressable>
        <Pressable style={styles.controlButton} onPress={() => setZoomLevel((value) => Math.max(value - 0.2, 0.7))}>
          <Text style={styles.controlButtonText}>−</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: dashboardTheme.surfaceLow,
    ...dashboardShadow,
  },
  mapImage: {
    position: 'absolute',
    top: 0,
    left: 0,
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
    borderColor: dashboardTheme.secondaryContainer,
  },
  areaLabelText: {
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: 6,
  },
  satelliteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
    alignItems: 'flex-end',
  },
  controlButton: {
    minWidth: 42,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
});
