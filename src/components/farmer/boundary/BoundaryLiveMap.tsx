import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, type MapType, type Region } from 'react-native-maps';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import { boundaryPointsToLatLng } from '../../../utils/boundaryGeometry';
import type { LatLng } from '../../../utils/farmSatelliteMap';

interface BoundaryLiveMapProps {
  points: BoundaryPoint[];
  walkingPoints?: BoundaryPoint[];
  currentLocation?: LatLng | null;
  areaLabel?: string;
  showPolygon?: boolean;
  height?: number;
  width?: number;
  onCenterGps?: () => void;
  onToggleSatellite?: () => void;
  satelliteMode?: boolean;
  editable?: boolean;
  followsUser?: boolean;
  isOutsideTolerance?: boolean;
  onVertexDragEnd?: (pointId: string, coordinate: LatLng) => void;
  onVertexLongPress?: (pointId: string) => void;
  onMapPress?: (coordinate: LatLng) => void;
}

const DEFAULT_REGION: Region = {
  latitude: 22.3379,
  longitude: 73.1739,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

export function BoundaryLiveMap({
  points,
  walkingPoints = [],
  currentLocation,
  areaLabel,
  showPolygon = true,
  height = 420,
  onCenterGps,
  onToggleSatellite,
  satelliteMode = true,
  editable = false,
  followsUser = false,
  isOutsideTolerance = false,
  onVertexDragEnd,
  onVertexLongPress,
  onMapPress,
}: BoundaryLiveMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [tileWarning, setTileWarning] = useState(false);
  const mapType: MapType = satelliteMode ? 'hybrid' : 'standard';
  const strokeColor = isOutsideTolerance ? '#DC2626' : '#0B6B3A';
  const fillColor = isOutsideTolerance ? 'rgba(220, 38, 38, 0.22)' : 'rgba(11, 107, 58, 0.22)';

  const region = useMemo((): Region => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      };
    }

    if (points[0]) {
      return {
        latitude: points[0].latitude,
        longitude: points[0].longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      };
    }

    return DEFAULT_REGION;
  }, [currentLocation, points]);

  const polygonCoords = useMemo(() => boundaryPointsToLatLng(points), [points]);
  const walkingCoords = useMemo(() => boundaryPointsToLatLng(walkingPoints), [walkingPoints]);

  useEffect(() => {
    let cancelled = false;

    async function checkConnectivity() {
      if (!satelliteMode) {
        setTileWarning(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
          { method: 'HEAD', signal: controller.signal },
        );
        clearTimeout(timeout);

        if (!cancelled) {
          setTileWarning(!response.ok);
        }
      } catch {
        if (!cancelled) {
          setTileWarning(true);
        }
      }
    }

    void checkConnectivity();

    return () => {
      cancelled = true;
    };
  }, [satelliteMode]);

  useEffect(() => {
    if (!currentLocation || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0025,
        longitudeDelta: 0.0025,
      },
      350,
    );
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType={mapType}
        initialRegion={region}
        showsUserLocation
        followsUserLocation={followsUser}
        showsMyLocationButton={false}
        showsCompass
        zoomEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
        onPress={(event) => {
          if (!onMapPress) {
            return;
          }

          onMapPress(event.nativeEvent.coordinate);
        }}
      >
        {walkingCoords.length >= 2 && !showPolygon ? (
          <Polyline coordinates={walkingCoords} strokeColor="#0B6B3A" strokeWidth={3} />
        ) : null}

        {points.length >= 2 && !showPolygon ? (
          <Polyline coordinates={polygonCoords} strokeColor="#0B6B3A" strokeWidth={3} />
        ) : null}

        {showPolygon && polygonCoords.length >= 3 ? (
          <Polygon
            coordinates={polygonCoords}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={2.5}
          />
        ) : null}

        {walkingCoords.length >= 2 && showPolygon ? (
          <Polyline coordinates={walkingCoords} strokeColor="#86EFAC" strokeWidth={2} lineDashPattern={[6, 4]} />
        ) : null}

        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            pinColor={isOutsideTolerance ? '#DC2626' : '#0B6B3A'}
            draggable={editable}
            onDragEnd={(event) => {
              onVertexDragEnd?.(point.id, event.nativeEvent.coordinate);
            }}
            onPress={() => {
              if (!editable || !onVertexLongPress) {
                return;
              }

              onVertexLongPress(point.id);
            }}
            title={editable ? `P${point.pointNo} · tap to delete` : `P${point.pointNo}`}
          />
        ))}
      </MapView>

      {tileWarning ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Satellite map requires internet connection.</Text>
        </View>
      ) : null}

      {areaLabel && points.length >= 3 ? (
        <View style={styles.areaLabel}>
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
          <Pressable
            style={styles.controlButton}
            onPress={() => {
              onCenterGps();
              if (currentLocation && mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.0025,
                    longitudeDelta: 0.0025,
                  },
                  350,
                );
              }
            }}
          >
            <Text style={styles.controlButtonText}>Center GPS</Text>
          </Pressable>
        ) : null}
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
  offlineBanner: {
    position: 'absolute',
    top: 44,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(127,29,29,0.92)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineText: {
    color: '#FEF2F2',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  areaLabel: {
    position: 'absolute',
    alignSelf: 'center',
    top: '46%',
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
