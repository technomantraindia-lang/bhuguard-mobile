import { useCallback, useMemo } from 'react';

import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import type { LatLng } from '../../../utils/farmSatelliteMap';
import type { LngLat } from '../../../utils/lngLat';
import type { ManualDrawingPhase } from '../../../utils/manualBoundaryVisuals';
import {
  type MapStyleMode,
} from '../../../utils/foMapTiler';
import type { MapTilerStyleMode } from '../../../utils/mapTilerConfig';
import { FoBoundaryMap } from './FoBoundaryMap';
import type { ManualBoundaryMapProps } from './MapLibreManualBoundaryMap';

function toFoStyleMode(mode: MapTilerStyleMode | MapStyleMode | undefined): MapStyleMode {
  if (mode === 'street') {
    return 'street';
  }
  // satellite (legacy) and hybrid both map to hybrid-v4
  return 'hybrid';
}

function toAppStyleMode(mode: MapStyleMode): MapTilerStyleMode {
  return mode === 'street' ? 'street' : 'satellite';
}

/**
 * Canonical FO Farm Boundary map — proven MapLibre v11 stack from bhuguard-map-demo.
 */
export function MapLibreManualBoundaryMapInner(props: ManualBoundaryMapProps) {
  const {
    points,
    currentLocation = null,
    farmLocation = null,
    phase,
    isValid,
    selectedPointId = null,
    selectedVertexIndex = null,
    invalidVertexIndex = null,
    editableLngLats,
    isDraggingVertex = false,
    mapStyleMode = 'satellite',
    followGps = false,
    requestFitToPolygon = 0,
    persistedToBhuguard = false,
    onMapStyleModeChange,
    onMapPress,
    onSelectVertex,
    onSelectVertexIndex,
    onVertexDragStart,
    onVertexDrag,
    onVertexDragEnd,
    onCenterGps,
    onUserPanAway,
    onRegionCenterChange,
    onMapUsableChange,
  } = props;

  const showUserLocation = !(props.readOnly === true || phase === 'completed');

  const selectedIndex = useMemo(() => {
    if (selectedVertexIndex != null) {
      return selectedVertexIndex;
    }
    if (!selectedPointId) {
      return null;
    }
    const index = points.findIndex((point) => point.id === selectedPointId);
    return index >= 0 ? index : null;
  }, [points, selectedPointId, selectedVertexIndex]);

  const lngLats = useMemo(
    () =>
      editableLngLats
      ?? points.map((point) => [point.longitude, point.latitude] as LngLat),
    [editableLngLats, points],
  );

  const handleSelectVertex = useCallback(
    (index: number) => {
      onSelectVertexIndex?.(index);
      const point = points[index];
      if (point) {
        onSelectVertex?.(point.id);
      }
    },
    [onSelectVertex, onSelectVertexIndex, points],
  );

  const handleStyleChange = useCallback(
    (mode: MapStyleMode) => {
      onMapStyleModeChange?.(toAppStyleMode(mode));
    },
    [onMapStyleModeChange],
  );

  return (
    <FoBoundaryMap
      points={points as BoundaryPoint[]}
      phase={phase as ManualDrawingPhase}
      isValid={isValid}
      persistedLocally={persistedToBhuguard}
      selectedVertexIndex={selectedIndex}
      invalidVertexIndex={invalidVertexIndex}
      editableLngLats={lngLats}
      isDraggingVertex={isDraggingVertex}
      mapStyleMode={toFoStyleMode(mapStyleMode)}
      currentLocation={currentLocation}
      farmLocation={farmLocation}
      showUserLocation={showUserLocation}
      followGps={followGps}
      requestFitToPolygon={requestFitToPolygon}
      onMapStyleModeChange={handleStyleChange}
      onMapPress={(coordinate: LatLng) => onMapPress?.(coordinate)}
      onSelectVertex={handleSelectVertex}
      onVertexDragStart={(index) => onVertexDragStart?.(index)}
      onVertexDrag={(index, lngLat) => onVertexDrag?.(index, lngLat)}
      onVertexDragEnd={(index, lngLat) => onVertexDragEnd?.(index, lngLat)}
      onCenterGps={() => onCenterGps?.()}
      onUserPanAway={() => onUserPanAway?.()}
      onRegionCenterChange={(coordinate) => onRegionCenterChange?.(coordinate)}
      onMapUsableChange={(usable) => onMapUsableChange?.(usable)}
    />
  );
}
