import { type ComponentType, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TurboModuleRegistry, View } from 'react-native';

import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import type { FarmIdentityLabelData } from '../../../utils/farmIdentityMapLabel';
import type { LatLng } from '../../../utils/farmSatelliteMap';
import type { LngLat } from '../../../utils/lngLat';
import type { ManualDrawingPhase } from '../../../utils/manualBoundaryVisuals';
import {
  hasMapTilerApiKey,
  MAPTILER_CONFIG_INCOMPLETE_MESSAGE,
  type MapTilerStyleMode,
} from '../../../utils/mapTilerConfig';

export interface ManualBoundaryMapFitPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ManualBoundaryMapProps {
  points: BoundaryPoint[];
  currentLocation?: LatLng | null;
  /** Optional farm GPS used for initial camera when no boundary points exist. */
  farmLocation?: LatLng | null;
  /** Selected-farm identity label shown over the polygon on read-only View Mapping. */
  farmIdentityLabel?: FarmIdentityLabelData | null;
  phase: ManualDrawingPhase;
  isValid: boolean;
  showPolygon?: boolean;
  selectedPointId?: string | null;
  selectedVertexIndex?: number | null;
  invalidVertexIndex?: number | null;
  editableLngLats?: LngLat[];
  isDraggingVertex?: boolean;
  mapStyleMode?: MapTilerStyleMode;
  onMapStyleModeChange?: (mode: MapTilerStyleMode) => void;
  onMapPress?: (coordinate: LatLng) => void;
  onSelectVertex?: (pointId: string) => void;
  onSelectVertexIndex?: (index: number) => void;
  onVertexDragStart?: (index: number) => void;
  onVertexDrag?: (index: number, lngLat: LngLat) => void;
  onVertexDragEnd?: (index: number, lngLat: LngLat | null) => void;
  onCenterGps?: () => void;
  followGps?: boolean;
  onUserPanAway?: () => void;
  onRegionCenterChange?: (coordinate: LatLng) => void;
  /** Fired when Hybrid/Street style successfully loads (true) or becomes unusable (false). */
  onMapUsableChange?: (usable: boolean) => void;
  requestFitToPolygon?: number;
  autoFitOnLoad?: boolean;
  showRecenterButton?: boolean;
  showFitBoundaryButton?: boolean;
  showCenterGpsButton?: boolean;
  readOnly?: boolean;
  fitPadding?: ManualBoundaryMapFitPadding;
  areaPillLabel?: string | null;
  height?: number | 'flex';
  persistedToBhuguard?: boolean;
}

type MapLibreInnerComponent = ComponentType<ManualBoundaryMapProps>;

let cachedMapLibreInner: MapLibreInnerComponent | null | undefined;

function isMapLibreNativeAvailable(): boolean {
  try {
    return TurboModuleRegistry.get('MLRNCameraModule') != null;
  } catch {
    return false;
  }
}

function clearMapLibreInnerCache(): void {
  cachedMapLibreInner = undefined;
}

function loadMapLibreInner(): MapLibreInnerComponent | null {
  if (cachedMapLibreInner !== undefined) {
    return cachedMapLibreInner;
  }

  if (!isMapLibreNativeAvailable()) {
    cachedMapLibreInner = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@maplibre/maplibre-react-native');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const inner = require('./MapLibreManualBoundaryMapInner') as {
      MapLibreManualBoundaryMapInner: MapLibreInnerComponent;
    };
    cachedMapLibreInner = inner.MapLibreManualBoundaryMapInner ?? null;
  } catch {
    cachedMapLibreInner = null;
  }

  return cachedMapLibreInner;
}

function MapConfigMessage({
  height = 'flex',
  message,
  onRetry,
}: {
  height?: number | 'flex';
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.mapShell, height === 'flex' ? styles.flexMap : { height }]}>
      <View style={styles.configBanner}>
        <Text style={styles.configTitle}>Map configuration</Text>
        <Text style={styles.configBody}>{message}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry map configuration"
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MapUnavailable({
  height = 'flex',
  onRetry,
}: {
  height?: number | 'flex';
  onRetry?: () => void;
}) {
  return (
    <View style={[styles.mapShell, height === 'flex' ? styles.flexMap : { height }]}>
      <View style={styles.configBanner}>
        <Text style={styles.configTitle}>Map unavailable</Text>
        <Text style={styles.configBody}>
          MapLibre native module was not found in this install. Install a fresh Bhuguard APK that includes MapLibre,
          then reopen the app (not Expo Go). Farm Mapping stays inside the app — Chrome is not used.
        </Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry MapLibre native check"
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Boundary Hybrid map via MapLibre + MapTiler (hybrid-v4 / streets-v4).
 * Used by ManualBoundaryMap for Field Officer farm boundary drawing.
 * Does not use Google Maps.
 */
export function MapLibreManualBoundaryMap(props: ManualBoundaryMapProps) {
  const [configCheckToken, setConfigCheckToken] = useState(0);
  const mapTilerReady = useMemo(() => hasMapTilerApiKey(), [configCheckToken]);
  const MapLibreInner = useMemo(() => loadMapLibreInner(), [configCheckToken]);

  const onMapUsableChange = props.onMapUsableChange;

  const handleConfigRetry = useCallback(() => {
    clearMapLibreInnerCache();
    setConfigCheckToken((token) => token + 1);
    onMapUsableChange?.(false);
  }, [onMapUsableChange]);

  if (!mapTilerReady) {
    return (
      <MapConfigMessage
        height={props.height}
        message={MAPTILER_CONFIG_INCOMPLETE_MESSAGE}
        onRetry={handleConfigRetry}
      />
    );
  }

  if (!MapLibreInner) {
    return <MapUnavailable height={props.height} onRetry={handleConfigRetry} />;
  }

  return <MapLibreInner {...props} />;
}

const styles = StyleSheet.create({
  mapShell: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#E8EEE9',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  flexMap: {
    flex: 1,
    minHeight: 280,
  },
  configBanner: {
    alignSelf: 'stretch',
    maxWidth: 420,
    backgroundColor: '#FFF8E8',
    borderColor: '#E8C76A',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  configTitle: {
    color: '#7A4E00',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 6,
  },
  configBody: {
    color: '#5C4A28',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
  },
  errorBody: {
    marginTop: 8,
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 17,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#18743A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonDisabled: { opacity: 0.55 },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
