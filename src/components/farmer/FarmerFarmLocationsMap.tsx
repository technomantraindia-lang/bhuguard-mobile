import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TurboModuleRegistry,
  View,
} from 'react-native';
import {
  Camera,
  Map,
  NetworkManager,
  ViewAnnotation,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';

import { BhuguardMaterialIcon } from '../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerFarmViewModel } from '../../utils/farmMapHelpers';
import { polygonBounds } from '../../utils/foBoundaryGeometry';
import {
  getActiveStyleId,
  getMapTilerStyleUrl,
  hasMapTilerKey,
  MAP_FALLBACK_CENTER,
  MAP_FALLBACK_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_ZOOM_ANIMATION_MS,
  type MapStyleMode,
} from '../../utils/foMapTiler';

const MAP_HEIGHT = 240;

export type FarmerFarmMapPin = FarmerFarmViewModel & {
  coordinates: NonNullable<FarmerFarmViewModel['coordinates']>;
};

type FarmerFarmLocationsMapInnerProps = {
  farms: FarmerFarmMapPin[];
  farmerDisplayId?: string;
  onOpenMaps: () => void;
};

function isMapLibreNativeAvailable(): boolean {
  try {
    return TurboModuleRegistry.get('MLRNCameraModule') != null;
  } catch {
    return false;
  }
}

function FarmLocationPin({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Farm location pin">
      <View style={[styles.pinOuter, selected && styles.pinOuterSelected]}>
        <View style={styles.pinInner}>
          <BhuguardMaterialIcon name="location_on" size={18} color="#FFFFFF" filled />
        </View>
      </View>
    </Pressable>
  );
}

function FarmPinPopup({
  farm,
  farmerDisplayId,
}: {
  farm: FarmerFarmMapPin;
  farmerDisplayId?: string;
}) {
  const farmerId = farmerDisplayId || farm.farmerDisplayId;

  return (
    <View style={styles.popupCard}>
      <Text style={styles.popupLine}>
        <Text style={styles.popupLabel}>Farm: </Text>
        <Text style={styles.popupValue}>{farm.name}</Text>
      </Text>
      {farm.farmerName ? (
        <Text style={styles.popupLine}>
          <Text style={styles.popupLabel}>Farmer: </Text>
          <Text style={styles.popupValue}>{farm.farmerName}</Text>
        </Text>
      ) : null}
      {farmerId ? (
        <Text style={styles.popupLine}>
          <Text style={styles.popupLabel}>Farmer ID: </Text>
          <Text style={styles.popupValue}>{farmerId}</Text>
        </Text>
      ) : null}
      <Text style={styles.popupLine}>
        <Text style={styles.popupLabel}>Farm ID: </Text>
        <Text style={styles.popupValue}>{farm.code}</Text>
      </Text>
      <Text style={styles.popupArea}>{farm.areaDisplay.acres}</Text>
      <Text style={styles.popupArea}>{farm.areaDisplay.hectares}</Text>
      <Text style={styles.popupArea}>{farm.areaDisplay.squareMeters}</Text>
    </View>
  );
}

const FarmerFarmLocationsMapInner = memo(function FarmerFarmLocationsMapInner({
  farms,
  farmerDisplayId = '',
  onOpenMaps,
}: FarmerFarmLocationsMapInnerProps) {
  const cameraRef = useRef<CameraRef>(null);
  const mapRef = useRef<MapRef>(null);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>('hybrid');
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const styleUrl = useMemo(() => getMapTilerStyleUrl(mapStyleMode), [mapStyleMode]);

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === selectedFarmId) ?? null,
    [farms, selectedFarmId],
  );

  const initialCenter = useMemo(() => {
    const first = farms[0]?.coordinates;
    if (first) {
      return [first.longitude, first.latitude] as [number, number];
    }
    return MAP_FALLBACK_CENTER;
  }, [farms]);

  const fitAllPins = useCallback(() => {
    const points = farms.map((farm) => farm.coordinates);
    const bounds = polygonBounds(points);
    if (!bounds || !cameraRef.current || !styleLoaded) {
      return;
    }

    try {
      cameraRef.current.fitBounds(bounds, {
        duration: MAP_ZOOM_ANIMATION_MS,
        padding: { top: 48, right: 40, bottom: 96, left: 40 },
      });
    } catch {
      // Ignore camera fit failures.
    }
  }, [farms, styleLoaded]);

  useEffect(() => {
    try {
      NetworkManager.setConnected(true);
    } catch {
      // Ignore.
    }
  }, []);

  useEffect(() => {
    if (!styleLoaded || farms.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      fitAllPins();
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [fitAllPins, farms.length, styleLoaded]);

  if (!styleUrl) {
    return (
      <View style={[styles.mapCard, styles.emptyMap]}>
        <Text style={styles.emptyText}>Map configuration is unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Farm Locations Map</Text>
        <Pressable style={styles.linkButton} onPress={onOpenMaps}>
          <Text style={styles.linkText}>Open in Google Maps</Text>
        </Pressable>
      </View>

      <View style={[styles.mapCard, dashboardShadow]}>
        <Map
          ref={mapRef}
          style={styles.map}
          mapStyle={styleUrl}
          onDidFinishLoadingStyle={() => setStyleLoaded(true)}
          attribution={false}
          logo={false}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{ center: initialCenter, zoom: MAP_FALLBACK_ZOOM }}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
          />

          {farms.map((farm) => (
            <ViewAnnotation
              key={`pin-${farm.id}`}
              id={`farm-pin-${farm.id}`}
              lngLat={[farm.coordinates.longitude, farm.coordinates.latitude]}
              anchor="bottom"
            >
              <FarmLocationPin
                selected={selectedFarmId === farm.id}
                onPress={() => setSelectedFarmId((current) => (current === farm.id ? null : farm.id))}
              />
            </ViewAnnotation>
          ))}

          {selectedFarm ? (
            <ViewAnnotation
              id="farm-popup"
              lngLat={[selectedFarm.coordinates.longitude, selectedFarm.coordinates.latitude]}
              anchor="top"
            >
              <FarmPinPopup farm={selectedFarm} farmerDisplayId={farmerDisplayId} />
            </ViewAnnotation>
          ) : null}
        </Map>

        {!styleLoaded ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={dashboardTheme.primaryContainer} />
          </View>
        ) : null}

        <View style={styles.mapControls}>
          <Pressable style={styles.controlButton} onPress={fitAllPins}>
            <Text style={styles.controlButtonText}>Fit</Text>
          </Pressable>
          <Pressable
            style={styles.controlButton}
            onPress={() => setMapStyleMode((mode) => (mode === 'hybrid' ? 'street' : 'hybrid'))}
          >
            <Text style={styles.controlButtonText}>{mapStyleMode === 'hybrid' ? 'Hybrid' : 'Street'}</Text>
          </Pressable>
        </View>

        <View style={styles.markerBadge}>
          <Text style={styles.markerBadgeText}>{farms.length} mapped</Text>
        </View>
      </View>
    </View>
  );
});

type FarmerFarmLocationsMapProps = {
  farms: FarmerFarmViewModel[];
  farmerDisplayId?: string;
  onOpenMaps: () => void;
};

export function FarmerFarmLocationsMap({
  farms,
  farmerDisplayId = '',
  onOpenMaps,
}: FarmerFarmLocationsMapProps) {
  const mappedFarms = useMemo(
    () =>
      farms.filter((farm): farm is FarmerFarmMapPin => farm.coordinates !== null),
    [farms],
  );

  if (mappedFarms.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Farm Locations Map</Text>
        <View style={[styles.mapCard, styles.emptyMap]}>
          <BhuguardMaterialIcon name="location_on" size={28} color={dashboardTheme.outline} />
          <Text style={styles.emptyText}>No mapped Farm locations available.</Text>
        </View>
      </View>
    );
  }

  if (!hasMapTilerKey() || !isMapLibreNativeAvailable()) {
    return (
      <View style={styles.wrap}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Farm Locations Map</Text>
          <Pressable style={styles.linkButton} onPress={onOpenMaps}>
            <Text style={styles.linkText}>Open in Google Maps</Text>
          </Pressable>
        </View>
        <View style={[styles.mapCard, styles.emptyMap]}>
          <Text style={styles.emptyText}>
            Interactive map is unavailable in this build. Use Open in Google Maps to view mapped farms.
          </Text>
          <Text style={styles.emptyMeta}>{mappedFarms.length} mapped farm locations</Text>
        </View>
      </View>
    );
  }

  return (
    <FarmerFarmLocationsMapInner
      farms={mappedFarms}
      farmerDisplayId={farmerDisplayId}
      onOpenMaps={onOpenMaps}
    />
  );
}

export { getActiveStyleId };

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
  mapCard: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceContainerLow,
  },
  map: {
    flex: 1,
  },
  emptyMap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  emptyText: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 250, 244, 0.55)',
  },
  mapControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  markerBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: 'rgba(11, 61, 46, 0.88)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  markerBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pinOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B6B3A',
  },
  pinOuterSelected: {
    borderColor: '#064D2E',
    transform: [{ scale: 1.08 }],
  },
  pinInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0B6B3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCard: {
    maxWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    marginTop: 8,
    shadowColor: '#0B1F12',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  popupLine: {
    fontSize: 12,
    lineHeight: 17,
    color: dashboardTheme.onSurface,
  },
  popupLabel: {
    fontWeight: '700',
    color: dashboardTheme.onSurfaceVariant,
  },
  popupValue: {
    fontWeight: '600',
    color: dashboardTheme.onSurface,
    flexShrink: 1,
  },
  popupArea: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
});
