import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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

const MAP_HEIGHT = 260;
const MIN_SPAN_DEGREES = 0.012;

export type FarmerFarmMapPin = FarmerFarmViewModel & {
  coordinates: NonNullable<FarmerFarmViewModel['coordinates']>;
};

type FarmerFarmLocationsMapInnerProps = {
  farms: FarmerFarmMapPin[];
  farmerDisplayId?: string;
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

function FarmPreviewModal({
  farm,
  farmerDisplayId,
  visible,
  onClose,
}: {
  farm: FarmerFarmMapPin | null;
  farmerDisplayId?: string;
  visible: boolean;
  onClose: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [farm?.id, farm?.imageUrl]);

  if (!farm) {
    return null;
  }

  const farmerId = farmerDisplayId || farm.farmerDisplayId;
  const mappingLabel = farm.mappingBadge === 'mapped' ? 'Mapped' : 'Mapping Pending';
  const verificationLabel =
    farm.verificationBadge === 'verified'
      ? 'Verified'
      : farm.verificationBadge === 'draft'
        ? 'Draft'
        : 'Pending';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.previewCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.previewImageWrap}>
            {farm.imageUrl && !imageFailed ? (
              <Image
                source={{ uri: farm.imageUrl }}
                style={styles.previewImage}
                resizeMode="contain"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <View style={styles.previewPlaceholder}>
                <BhuguardMaterialIcon name="agriculture" size={42} color={dashboardTheme.primaryContainer} />
                <Text style={styles.previewPlaceholderText}>Bhuguard Farm</Text>
              </View>
            )}
          </View>

          <Text style={styles.previewTitle} numberOfLines={2}>
            {farm.name}
          </Text>
          <Text style={styles.previewMeta}>Farm ID: {farm.code}</Text>
          <Text style={styles.previewMeta}>Village: {farm.village}</Text>
          <Text style={styles.previewMeta}>Area: {farm.hectareLabel}</Text>
          <Text style={styles.previewMeta}>Mapping: {mappingLabel}</Text>
          <Text style={styles.previewMeta}>Verification: {verificationLabel}</Text>
          {farmerId ? <Text style={styles.previewMeta}>Farmer ID: {farmerId}</Text> : null}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const FarmerFarmLocationsMapInner = memo(function FarmerFarmLocationsMapInner({
  farms,
  farmerDisplayId = '',
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
    if (!cameraRef.current || !styleLoaded || farms.length === 0) {
      return;
    }

    try {
      const points = farms.map((farm) => farm.coordinates);
      const rawBounds = polygonBounds(points);
      let west: number;
      let south: number;
      let east: number;
      let north: number;

      if (rawBounds) {
        [west, south, east, north] = rawBounds;
      } else {
        const point = points[0];
        west = point.longitude - MIN_SPAN_DEGREES / 2;
        south = point.latitude - MIN_SPAN_DEGREES / 2;
        east = point.longitude + MIN_SPAN_DEGREES / 2;
        north = point.latitude + MIN_SPAN_DEGREES / 2;
      }

      const latSpan = Math.max(north - south, MIN_SPAN_DEGREES);
      const lngSpan = Math.max(east - west, MIN_SPAN_DEGREES);
      const centerLat = (north + south) / 2;
      const centerLng = (east + west) / 2;
      const bounds: [number, number, number, number] = [
        centerLng - lngSpan / 2,
        centerLat - latSpan / 2,
        centerLng + lngSpan / 2,
        centerLat + latSpan / 2,
      ];

      cameraRef.current.fitBounds(bounds, {
        duration: MAP_ZOOM_ANIMATION_MS,
        padding: {
          top: farms.length === 1 ? 64 : 56,
          right: farms.length === 1 ? 64 : 48,
          bottom: farms.length === 1 ? 64 : 72,
          left: farms.length === 1 ? 64 : 48,
        },
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
    }, 280);

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
      <Text style={styles.title}>Farm Locations Map</Text>

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
                onPress={() => setSelectedFarmId(farm.id)}
              />
            </ViewAnnotation>
          ))}
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

      <FarmPreviewModal
        farm={selectedFarm}
        farmerDisplayId={farmerDisplayId}
        visible={selectedFarm != null}
        onClose={() => setSelectedFarmId(null)}
      />
    </View>
  );
});

type FarmerFarmLocationsMapProps = {
  farms: FarmerFarmViewModel[];
  farmerDisplayId?: string;
};

export function FarmerFarmLocationsMap({
  farms,
  farmerDisplayId = '',
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
        <Text style={styles.title}>Farm Locations Map</Text>
        <View style={[styles.mapCard, styles.emptyMap]}>
          <Text style={styles.emptyText}>
            Interactive map is unavailable in this build. Mapped farm locations remain available in Farm detail.
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
    />
  );
}

export { getActiveStyleId };

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 31, 18, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  previewImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: dashboardTheme.surfaceContainerLow,
    marginBottom: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewPlaceholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  previewMeta: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
  },
  closeButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
});
