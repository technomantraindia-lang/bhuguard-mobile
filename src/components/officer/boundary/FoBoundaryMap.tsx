import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  NetworkManager,
  UserLocation,
  type CameraRef,
  type LngLat,
  type MapRef,
  type PressEvent,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';

import { EditableBoundaryVertices } from './EditableBoundaryVertices';
import {
  MAP_FALLBACK_CENTER,
  MAP_FALLBACK_ZOOM,
  MAP_GPS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_ZOOM_ANIMATION_MS,
  MSG_NETWORK,
  SOURCE_IDS,
  LAYER_IDS,
  classifyMapStyleFailure,
  clampZoom,
  getActiveStyleId,
  getMapTilerConfigurationIssue,
  getMapTilerKeyDiagnostics,
  logMapLoadFailure,
  probeMapTilerStyle,
  type MapStyleMode,
} from '../../../utils/foMapTiler';
import {
  type BoundaryPoint,
  type LatLng,
  MIN_TAP_DEBOUNCE_MS,
  buildLineFeature,
  buildPolygonFeature,
  buildVerticesFeatureCollection,
  emptyFeatureCollection,
  isValidCoordinate,
  pointsTooClose,
  polygonBounds,
} from '../../../utils/foBoundaryGeometry';
import type { ManualDrawingPhase as DrawingPhase } from '../../../utils/manualBoundaryVisuals';
import { colors } from './foMapColors';

type Props = {
  points: BoundaryPoint[];
  phase: DrawingPhase;
  isValid: boolean;
  persistedLocally: boolean;
  selectedVertexIndex: number | null;
  invalidVertexIndex: number | null;
  editableLngLats: LngLat[];
  isDraggingVertex: boolean;
  mapStyleMode: MapStyleMode;
  currentLocation: LatLng | null;
  /** Farm GPS used when no saved boundary points exist yet. */
  farmLocation?: LatLng | null;
  /** When false, hide the device GPS puck (read-only View Mapping / View Farm). */
  showUserLocation?: boolean;
  followGps: boolean;
  requestFitToPolygon: number;
  onMapStyleModeChange: (mode: MapStyleMode) => void;
  onMapPress: (coordinate: LatLng) => void;
  onSelectVertex: (index: number) => void;
  onVertexDragStart: (index: number) => void;
  onVertexDrag: (index: number, lngLat: LngLat) => void;
  onVertexDragEnd: (index: number, lngLat: LngLat | null) => void;
  onCenterGps: () => void;
  onUserPanAway: () => void;
  onRegionCenterChange: (coordinate: LatLng) => void;
  onMapUsableChange: (usable: boolean) => void;
};

function visualColors(phase: DrawingPhase, persistedLocally: boolean, isValid: boolean) {
  if (!isValid && phase !== 'drawing' && phase !== 'idle') {
    return { stroke: colors.danger, fill: 'rgba(220,38,38,0.25)' };
  }
  if (persistedLocally) {
    return { stroke: colors.saved, fill: colors.savedFill };
  }
  if (phase === 'editing') {
    return { stroke: colors.editing, fill: colors.editingFill };
  }
  if (phase === 'completed') {
    return { stroke: colors.completed, fill: colors.completedFill };
  }
  return { stroke: colors.drawing, fill: colors.drawingFill };
}

export function FoBoundaryMap({
  points,
  phase,
  isValid,
  persistedLocally,
  selectedVertexIndex,
  invalidVertexIndex,
  editableLngLats,
  isDraggingVertex,
  mapStyleMode,
  currentLocation,
  farmLocation = null,
  showUserLocation = true,
  followGps,
  requestFitToPolygon,
  onMapStyleModeChange,
  onMapPress,
  onSelectVertex,
  onVertexDragStart,
  onVertexDrag,
  onVertexDragEnd,
  onCenterGps,
  onUserPanAway,
  onRegionCenterChange,
  onMapUsableChange,
}: Props) {
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const isGesturingRef = useRef(false);
  const isDraggingVertexRef = useRef(false);
  const lastTapAtRef = useRef(0);
  const hasCenteredRef = useRef(false);
  const lastFitRequestRef = useRef(0);
  const currentZoomRef = useRef(MAP_FALLBACK_ZOOM);
  const styleLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMapUsableChangeRef = useRef(onMapUsableChange);
  onMapUsableChangeRef.current = onMapUsableChange;
  isDraggingVertexRef.current = isDraggingVertex;

  const [styleReloadToken, setStyleReloadToken] = useState(0);
  const [styleLoading, setStyleLoading] = useState(true);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [allowRetry, setAllowRetry] = useState(true);
  const [resolvedStyleUrl, setResolvedStyleUrl] = useState<string | null>(null);
  const [styleProbeLabel, setStyleProbeLabel] = useState('probing…');
  const [currentZoom, setCurrentZoom] = useState(MAP_FALLBACK_ZOOM);
  const [mapCenter, setMapCenter] = useState<LngLat>(MAP_FALLBACK_CENTER);
  /** Edit Points: drag vertices, map pan off. Move Map: pan on, vertex drag off. */
  const [editInteractionMode, setEditInteractionMode] = useState<'editPoints' | 'moveMap'>('editPoints');

  useEffect(() => {
    if (phase === 'editing') {
      setEditInteractionMode('editPoints');
    }
  }, [phase]);

  const verticesDraggable = phase === 'editing' && editInteractionMode === 'editPoints';
  const mapPanEnabled =
    phase !== 'editing'
      ? !isDraggingVertex
      : editInteractionMode === 'moveMap' && !isDraggingVertex;

  const configurationIssue = getMapTilerConfigurationIssue();
  const activeStyleId = getActiveStyleId(mapStyleMode);

  const visual = useMemo(
    () => visualColors(phase, persistedLocally, isValid || points.length < 3),
    [isValid, persistedLocally, phase, points.length],
  );

  const latLngPoints = useMemo(
    () => points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    [points],
  );

  const polygonGeoJson = useMemo(() => {
    if ((phase !== 'completed' && phase !== 'editing') || latLngPoints.length < 3) {
      return emptyFeatureCollection();
    }
    const feature = buildPolygonFeature(latLngPoints);
    return feature
      ? { type: 'FeatureCollection' as const, features: [feature] }
      : emptyFeatureCollection();
  }, [latLngPoints, phase]);

  const lineGeoJson = useMemo(() => {
    if (phase !== 'drawing' || latLngPoints.length < 2) {
      return emptyFeatureCollection();
    }
    const feature = buildLineFeature(latLngPoints);
    return feature
      ? { type: 'FeatureCollection' as const, features: [feature] }
      : emptyFeatureCollection();
  }, [latLngPoints, phase]);

  const verticesGeoJson = useMemo(() => {
    if (phase === 'editing') {
      // Draggable ViewAnnotations replace circle markers in edit mode.
      return emptyFeatureCollection();
    }
    const selectedId =
      selectedVertexIndex != null && points[selectedVertexIndex]
        ? points[selectedVertexIndex].id
        : null;
    return buildVerticesFeatureCollection(points, selectedId);
  }, [phase, points, selectedVertexIndex]);

  // Priority: saved boundary → farm coordinates → device GPS → safe fallback.
  const initialCenter: LngLat = useMemo(() => {
    if (latLngPoints[0] && isValidCoordinate(latLngPoints[0].latitude, latLngPoints[0].longitude)) {
      return [latLngPoints[0].longitude, latLngPoints[0].latitude];
    }
    if (farmLocation && isValidCoordinate(farmLocation.latitude, farmLocation.longitude)) {
      return [farmLocation.longitude, farmLocation.latitude];
    }
    if (currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)) {
      return [currentLocation.longitude, currentLocation.latitude];
    }
    return MAP_FALLBACK_CENTER;
  }, [currentLocation, farmLocation, latLngPoints]);

  const fitToPolygon = useCallback(() => {
    const bounds = polygonBounds(latLngPoints);
    if (!bounds || !cameraRef.current || !styleLoaded) {
      return false;
    }
    try {
      cameraRef.current.fitBounds(bounds, {
        duration: MAP_ZOOM_ANIMATION_MS,
        padding: { top: 80, right: 56, bottom: 240, left: 56 },
      });
      return true;
    } catch {
      return false;
    }
  }, [latLngPoints, styleLoaded]);

  useEffect(() => {
    try {
      NetworkManager.setConnected(true);
    } catch {
      // Ignore if native module is unavailable.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    setStyleLoading(true);
    setStyleLoaded(false);
    setFatalError(null);
    setAllowRetry(true);
    setResolvedStyleUrl(null);
    setStyleProbeLabel('probing…');
    onMapUsableChangeRef.current?.(false);

    if (styleLoadTimeoutRef.current) {
      clearTimeout(styleLoadTimeoutRef.current);
    }

    (async () => {
      try {
        NetworkManager.setConnected(true);
      } catch {
        // Ignore.
      }

      if (__DEV__) {
        const keyDiag = getMapTilerKeyDiagnostics();
        console.info('[BhuguardMap] styleProbe start', {
          keyPresent: keyDiag.keyPresent,
          styleMode: mapStyleMode,
        });
      }

      const probe = await probeMapTilerStyle(mapStyleMode);
      if (cancelled) {
        return;
      }

      if (!probe.ok) {
        setStyleLoading(false);
        setStyleLoaded(false);
        setFatalError(probe.message);
        setAllowRetry(probe.allowRetry);
        if (__DEV__) {
          setStyleProbeLabel(`${probe.styleId} HTTP ${probe.status ?? 'n/a'}`);
        }
        onMapUsableChangeRef.current?.(false);
        return;
      }

      if (__DEV__) {
        setStyleProbeLabel(`${probe.styleId} HTTP ${probe.status}`);
      }
      setFatalError(null);
      setResolvedStyleUrl(probe.styleUrl);
      styleLoadTimeoutRef.current = setTimeout(() => {
        setStyleLoading((loading) => {
          if (loading) {
            const message = MSG_NETWORK;
            setFatalError(message);
            setAllowRetry(true);
            logMapLoadFailure(message, probe.status);
            onMapUsableChangeRef.current?.(false);
          }
          return loading;
        });
      }, 45000);
    })();

    return () => {
      cancelled = true;
      if (styleLoadTimeoutRef.current) {
        clearTimeout(styleLoadTimeoutRef.current);
      }
    };
  }, [mapStyleMode, styleReloadToken]);

  const handleStyleReady = useCallback(() => {
    setStyleLoading(false);
    setStyleLoaded(true);
    setFatalError(null);
    onMapUsableChangeRef.current?.(true);
    if (styleLoadTimeoutRef.current) {
      clearTimeout(styleLoadTimeoutRef.current);
    }
  }, []);

  const handleStyleFailed = useCallback(() => {
    setStyleLoading(false);
    setStyleLoaded(false);
    const classified = classifyMapStyleFailure('style');
    const message = classified.message;
    setFatalError(message);
    setAllowRetry(true);
    logMapLoadFailure(`Native MapLibre load failed for "${activeStyleId}"`, null);
    onMapUsableChangeRef.current?.(false);
    if (styleLoadTimeoutRef.current) {
      clearTimeout(styleLoadTimeoutRef.current);
    }
  }, [activeStyleId]);

  const retryStyleOnly = useCallback(() => {
    // Retry only style/map request — do not clear GPS, points, or navigation.
    setFatalError(null);
    setStyleLoaded(false);
    setStyleLoading(true);
    setResolvedStyleUrl(null);
    onMapUsableChangeRef.current?.(false);
    setStyleReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!styleLoaded || hasCenteredRef.current) {
      return;
    }
    if (latLngPoints.length >= 3) {
      hasCenteredRef.current = true;
      fitToPolygon();
      return;
    }
    if (farmLocation && isValidCoordinate(farmLocation.latitude, farmLocation.longitude)) {
      hasCenteredRef.current = true;
      currentZoomRef.current = MAP_FALLBACK_ZOOM;
      setCurrentZoom(MAP_FALLBACK_ZOOM);
      cameraRef.current?.easeTo({
        center: [farmLocation.longitude, farmLocation.latitude],
        zoom: MAP_FALLBACK_ZOOM,
        duration: 600,
      });
      return;
    }
    if (currentLocation && isValidCoordinate(currentLocation.latitude, currentLocation.longitude)) {
      hasCenteredRef.current = true;
      currentZoomRef.current = MAP_GPS_ZOOM;
      setCurrentZoom(MAP_GPS_ZOOM);
      cameraRef.current?.easeTo({
        center: [currentLocation.longitude, currentLocation.latitude],
        zoom: MAP_GPS_ZOOM,
        duration: 600,
      });
    }
  }, [currentLocation, farmLocation, fitToPolygon, latLngPoints.length, styleLoaded]);

  useEffect(() => {
    if (!styleLoaded || requestFitToPolygon <= 0 || requestFitToPolygon === lastFitRequestRef.current) {
      return;
    }
    lastFitRequestRef.current = requestFitToPolygon;
    fitToPolygon();
  }, [fitToPolygon, requestFitToPolygon, styleLoaded]);

  useEffect(() => {
    if (!styleLoaded || !followGps || !currentLocation) {
      return;
    }
    cameraRef.current?.easeTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: MAP_GPS_ZOOM,
      duration: 400,
    });
  }, [currentLocation, followGps, styleLoaded]);

  const handlePress = useCallback(
    (event: NativeSyntheticEvent<PressEvent>) => {
      if (isGesturingRef.current || isDraggingVertexRef.current) {
        return;
      }
      const now = Date.now();
      if (now - lastTapAtRef.current < MIN_TAP_DEBOUNCE_MS) {
        return;
      }
      lastTapAtRef.current = now;

      const lngLat = event.nativeEvent.lngLat;
      if (!lngLat) {
        return;
      }
      const [longitude, latitude] = lngLat;
      if (!isValidCoordinate(latitude, longitude)) {
        return;
      }
      const coordinate = { latitude, longitude };

      if (phase === 'editing') {
        // Selection is handled by ViewAnnotation press/drag. Ignore map taps
        // so pan/zoom and accidental taps do not create points.
        return;
      }

      if (phase !== 'drawing') {
        return;
      }
      const last = points[points.length - 1];
      if (last && pointsTooClose(last, coordinate)) {
        return;
      }
      onMapPress(coordinate);
    },
    [onMapPress, phase, points],
  );

  const zoomBy = useCallback((delta: number) => {
    const targetZoom = clampZoom(currentZoomRef.current + delta);
    if (Math.abs(targetZoom - currentZoomRef.current) < 0.001) {
      return;
    }
    currentZoomRef.current = targetZoom;
    setCurrentZoom(targetZoom);
    cameraRef.current?.easeTo({
      center: mapCenter,
      zoom: targetZoom,
      duration: MAP_ZOOM_ANIMATION_MS,
    });
  }, [mapCenter]);

  if (configurationIssue) {
    return (
      <View style={styles.configShell}>
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Map configuration</Text>
          <Text style={styles.bannerBody}>{configurationIssue}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mapShell}>
      {resolvedStyleUrl ? (
        <Map
          key={`map-${mapStyleMode}-${styleReloadToken}`}
          ref={mapRef}
          style={styles.map}
          mapStyle={resolvedStyleUrl}
          attribution
          logo
          compass
          compassPosition={{ top: 96, right: 12 }}
          attributionPosition={{ bottom: 8, right: 8 }}
          logoPosition={{ bottom: 8, left: 8 }}
          dragPan={mapPanEnabled}
          touchRotate={mapPanEnabled}
          touchPitch={mapPanEnabled}
          touchZoom
          onDidFinishLoadingStyle={handleStyleReady}
          onDidFinishLoadingMap={handleStyleReady}
          onDidFailLoadingMap={handleStyleFailed}
          onPress={handlePress}
          onRegionIsChanging={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
            if (isDraggingVertexRef.current) {
              return;
            }
            if (event.nativeEvent.userInteraction) {
              isGesturingRef.current = true;
              onUserPanAway();
            }
          }}
          onRegionDidChange={(event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
            if (isDraggingVertexRef.current) {
              return;
            }
            isGesturingRef.current = false;
            const { center, zoom } = event.nativeEvent;
            if (center) {
              setMapCenter(center);
              onRegionCenterChange({ longitude: center[0], latitude: center[1] });
            }
            if (typeof zoom === 'number' && Number.isFinite(zoom)) {
              const clamped = clampZoom(zoom);
              currentZoomRef.current = clamped;
              setCurrentZoom(clamped);
            }
          }}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{ center: initialCenter, zoom: MAP_FALLBACK_ZOOM }}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
          />
          {showUserLocation ? <UserLocation accuracy animated /> : null}

          {styleLoaded ? (
            <>
              <GeoJSONSource id={SOURCE_IDS.polygon} data={polygonGeoJson}>
                <Layer
                  type="fill"
                  id={LAYER_IDS.fill}
                  paint={{ 'fill-color': visual.fill, 'fill-opacity': 1 }}
                />
                <Layer
                  type="line"
                  id={LAYER_IDS.outline}
                  paint={{ 'line-color': visual.stroke, 'line-width': 3.5, 'line-opacity': 1 }}
                />
              </GeoJSONSource>

              <GeoJSONSource id={SOURCE_IDS.line} data={lineGeoJson}>
                <Layer
                  type="line"
                  id={LAYER_IDS.drawLine}
                  paint={{ 'line-color': visual.stroke, 'line-width': 3, 'line-opacity': 1 }}
                />
              </GeoJSONSource>

              <GeoJSONSource id={SOURCE_IDS.vertices} data={verticesGeoJson}>
                <Layer
                  type="circle"
                  id={LAYER_IDS.vertices}
                  paint={{
                    'circle-radius': [
                      'case',
                      ['boolean', ['get', 'isSelected'], false],
                      9,
                      ['boolean', ['get', 'isFirst'], false],
                      8,
                      6.5,
                    ],
                    'circle-color': [
                      'case',
                      ['boolean', ['get', 'isSelected'], false],
                      colors.yellow,
                      persistedLocally ? colors.saved : visual.stroke,
                    ],
                    'circle-stroke-width': 2.5,
                    'circle-stroke-color': visual.stroke,
                  }}
                />
              </GeoJSONSource>

              {phase === 'editing' ? (
                <EditableBoundaryVertices
                  coordinates={editableLngLats}
                  isEditing={verticesDraggable}
                  selectedVertexIndex={selectedVertexIndex}
                  invalidVertexIndex={invalidVertexIndex}
                  onPress={onSelectVertex}
                  onDragStart={onVertexDragStart}
                  onDrag={onVertexDrag}
                  onDragEnd={onVertexDragEnd}
                />
              ) : null}
            </>
          ) : null}
        </Map>
      ) : null}

      <View
        style={[styles.modeBadge, phase === 'editing' && styles.modeBadgeEditing]}
        pointerEvents="none"
      >
        <Text style={styles.modeBadgeText}>
          {phase === 'editing'
            ? editInteractionMode === 'editPoints'
              ? 'Edit Points'
              : 'Move Map'
            : mapStyleMode === 'hybrid'
              ? 'Hybrid'
              : 'Street'}
        </Text>
      </View>

      {phase === 'editing' ? (
        <View style={styles.editModeToggle} pointerEvents="box-none">
          <Pressable
            style={[
              styles.editModeButton,
              editInteractionMode === 'editPoints' && styles.editModeButtonActive,
            ]}
            onPress={() => setEditInteractionMode('editPoints')}
          >
            <Text
              style={[
                styles.editModeButtonText,
                editInteractionMode === 'editPoints' && styles.editModeButtonTextActive,
              ]}
            >
              Edit Points
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.editModeButton,
              editInteractionMode === 'moveMap' && styles.editModeButtonActive,
            ]}
            onPress={() => setEditInteractionMode('moveMap')}
          >
            <Text
              style={[
                styles.editModeButtonText,
                editInteractionMode === 'moveMap' && styles.editModeButtonTextActive,
              ]}
            >
              Move Map
            </Text>
          </Pressable>
        </View>
      ) : null}

      {(styleLoading || !styleLoaded) && !fatalError ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={colors.ctaGreen} />
          <Text style={styles.loadingText}>Loading Hybrid map…</Text>
          {__DEV__ ? <Text style={styles.probeText}>{styleProbeLabel}</Text> : null}
        </View>
      ) : null}

      {fatalError ? (
        <View style={styles.fatalWrap} pointerEvents="box-none">
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Map configuration</Text>
            <Text style={styles.bannerBody}>{fatalError}</Text>
            {__DEV__ ? <Text style={styles.probeText}>{styleProbeLabel}</Text> : null}
            {allowRetry ? (
              <Pressable style={styles.retryButton} onPress={retryStyleOnly}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.rightControls} pointerEvents="box-none">
        <Pressable
          style={[styles.controlButton, currentZoom >= MAP_MAX_ZOOM - 0.001 && styles.controlDisabled]}
          disabled={currentZoom >= MAP_MAX_ZOOM - 0.001}
          onPress={() => zoomBy(1)}
        >
          <Text style={styles.controlText}>+</Text>
        </Pressable>
        <Pressable
          style={[styles.controlButton, currentZoom <= MAP_MIN_ZOOM + 0.001 && styles.controlDisabled]}
          disabled={currentZoom <= MAP_MIN_ZOOM + 0.001}
          onPress={() => zoomBy(-1)}
        >
          <Text style={styles.controlText}>−</Text>
        </Pressable>
        {latLngPoints.length >= 3 ? (
          <Pressable style={styles.controlButton} onPress={() => fitToPolygon()}>
            <Text style={styles.controlText}>Fit</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={styles.controlButton}
          onPress={() => {
            onMapStyleModeChange(mapStyleMode === 'hybrid' ? 'street' : 'hybrid');
          }}
        >
          <Text style={styles.controlText}>{mapStyleMode === 'hybrid' ? 'Street' : 'Hybrid'}</Text>
        </Pressable>
        <Pressable
          style={styles.controlButton}
          onPress={() => {
            if (currentLocation) {
              cameraRef.current?.easeTo({
                center: [currentLocation.longitude, currentLocation.latitude],
                zoom: MAP_GPS_ZOOM,
                duration: MAP_ZOOM_ANIMATION_MS,
              });
            }
            onCenterGps();
          }}
        >
          <Text style={styles.controlText}>GPS</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: { flex: 1, backgroundColor: colors.cream },
  configShell: { flex: 1, padding: 16, backgroundColor: colors.cream },
  map: { ...StyleSheet.absoluteFill },
  banner: {
    backgroundColor: '#FFF8E8',
    borderColor: '#E8C76A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  bannerTitle: { color: '#7A4E00', fontWeight: '800', marginBottom: 6 },
  bannerBody: { color: '#5C4A28', fontWeight: '600', lineHeight: 18 },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: colors.ctaGreen,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: { color: colors.white, fontWeight: '700' },
  modeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(15,122,69,0.92)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeBadgeEditing: {
    backgroundColor: 'rgba(234,88,12,0.95)',
  },
  modeBadgeText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  editModeToggle: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 72,
    flexDirection: 'row',
    gap: 8,
    marginTop: 36,
  },
  editModeButton: {
    flexGrow: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editModeButtonActive: {
    backgroundColor: colors.editing,
    borderColor: colors.editing,
  },
  editModeButtonText: { color: colors.ctaGreen, fontWeight: '800', fontSize: 12 },
  editModeButtonTextActive: { color: colors.white },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244,240,223,0.5)',
    gap: 8,
  },
  loadingText: { color: colors.darkGreen, fontWeight: '600' },
  probeText: { color: '#5C4A28', fontSize: 11, fontWeight: '600', marginTop: 6 },
  fatalWrap: { position: 'absolute', top: 12, left: 12, right: 72 },
  rightControls: { position: 'absolute', right: 12, top: 56, gap: 8 },
  controlButton: {
    minWidth: 52,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  controlDisabled: { opacity: 0.4 },
  controlText: { color: colors.ctaGreen, fontWeight: '800', fontSize: 12 },
});
