import { useCallback, useMemo, useRef, useState } from 'react';
import type { LngLat } from '../utils/lngLat';

import type { BoundaryPoint } from '../utils/boundaryGeometry';
import type { LatLng } from '../utils/farmSatelliteMap';
import {
  formatManualAreaBlocks,
  formatManualAreaDisplay,
  validateManualPolygon,
} from '../utils/manualBoundaryGeometry';
import { MIN_BOUNDARY_POINTS } from '../utils/foBoundaryGeometry';
import { useBoundaryDrawing } from './useFoBoundaryDrawing';

interface UseManualBoundaryDrawingOptions {
  initialPoints?: BoundaryPoint[];
  currentAccuracy?: number | null;
  currentAltitude?: number | null;
  initialPersistedToBhuguard?: boolean;
}

function toFoPoints(points: BoundaryPoint[]) {
  return points.map((point) => ({
    id: point.id,
    pointNo: point.pointNo,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: point.accuracy ?? null,
    timestamp: point.timestamp,
  }));
}

function toAppPoints(
  points: ReturnType<typeof useBoundaryDrawing>['points'],
  altitude?: number | null,
): BoundaryPoint[] {
  return points.map((point) => ({
    id: point.id,
    pointNo: point.pointNo,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracy: typeof point.accuracy === 'number' ? point.accuracy : 8,
    altitude: altitude ?? null,
    timestamp: point.timestamp,
    manual: true,
  }));
}

export function useManualBoundaryDrawing({
  initialPoints = [],
  currentAccuracy = null,
  currentAltitude = null,
  initialPersistedToBhuguard = false,
}: UseManualBoundaryDrawingOptions = {}) {
  const drawing = useBoundaryDrawing(toFoPoints(initialPoints), initialPersistedToBhuguard);
  const [drawingStartedAt, setDrawingStartedAt] = useState<string | null>(null);
  const [drawingCompletedAt, setDrawingCompletedAt] = useState<string | null>(null);
  const altitudeRef = useRef(currentAltitude);
  altitudeRef.current = currentAltitude;

  const points = useMemo(
    () => toAppPoints(drawing.points, altitudeRef.current),
    [drawing.points],
  );

  const validation = useMemo(() => validateManualPolygon(points), [points]);
  const areaLabel = validation.metrics ? formatManualAreaDisplay(validation.metrics) : null;
  const areaBlocks = validation.metrics
    ? formatManualAreaBlocks(validation.metrics)
    : drawing.areaBlocks;

  const selectedPointId = useMemo(() => {
    if (drawing.selectedVertexIndex == null) {
      return null;
    }
    return points[drawing.selectedVertexIndex]?.id ?? null;
  }, [drawing.selectedVertexIndex, points]);

  const startDrawing = useCallback(() => {
    setDrawingStartedAt(new Date().toISOString());
    setDrawingCompletedAt(null);
    drawing.startDrawing();
  }, [drawing]);

  const completeBoundary = useCallback((): string | null => {
    const error = drawing.completeBoundary();
    if (!error) {
      setDrawingCompletedAt(new Date().toISOString());
    }
    return error;
  }, [drawing]);

  const addVertex = useCallback(
    (coordinate: LatLng) => {
      drawing.addVertex(coordinate, currentAccuracy);
    },
    [currentAccuracy, drawing],
  );

  const setSelectedPointId = useCallback(
    (pointId: string | null) => {
      if (!pointId) {
        drawing.selectVertexIndex(Number.NaN);
        return;
      }
      const index = points.findIndex((point) => point.id === pointId);
      if (index >= 0) {
        drawing.selectVertexIndex(index);
      }
    },
    [drawing, points],
  );

  const updateVertex = useCallback(
    (pointId: string, coordinate: LatLng) => {
      const index = points.findIndex((point) => point.id === pointId);
      if (index < 0) {
        return;
      }
      drawing.beginVertexDrag(index);
      drawing.endVertexDrag(index, [coordinate.longitude, coordinate.latitude] as LngLat);
    },
    [drawing, points],
  );

  const setSelectedVertexHere = useCallback(
    (coordinate: LatLng) => {
      if (drawing.phase !== 'editing' || drawing.selectedVertexIndex == null) {
        return;
      }
      drawing.endVertexDrag(
        drawing.selectedVertexIndex,
        [coordinate.longitude, coordinate.latitude] as LngLat,
      );
    },
    [drawing],
  );

  const removeVertex = useCallback(
    (pointId: string) => {
      const index = points.findIndex((point) => point.id === pointId);
      if (index < 0) {
        return;
      }
      drawing.selectVertexIndex(index);
      drawing.deleteSelectedPoint();
    },
    [drawing, points],
  );

  const loadPoints = useCallback(
    (nextPoints: BoundaryPoint[], persisted = false) => {
      drawing.loadPoints(toFoPoints(nextPoints), persisted);
      if (persisted && nextPoints.length >= MIN_BOUNDARY_POINTS) {
        setDrawingCompletedAt(new Date().toISOString());
      }
    },
    [drawing],
  );

  const markPersistedToBhuguard = useCallback(() => {
    drawing.markPersisted();
    setDrawingCompletedAt(new Date().toISOString());
  }, [drawing]);

  const handleMapPress = useCallback(
    (coordinate: LatLng) => {
      if (drawing.phase === 'drawing') {
        addVertex(coordinate);
      }
    },
    [addVertex, drawing.phase],
  );

  const resetBoundary = useCallback(() => {
    drawing.resetBoundary();
    setDrawingStartedAt(null);
    setDrawingCompletedAt(null);
  }, [drawing]);

  return {
    phase: drawing.phase,
    points,
    vertexCount: points.length,
    selectedPointId,
    selectedVertexIndex: drawing.selectedVertexIndex,
    invalidVertexIndex: drawing.invalidVertexIndex,
    editMessage: drawing.editMessage,
    isDraggingVertex: drawing.isDraggingVertex,
    editableLngLats: drawing.editableLngLats,
    areaLabel,
    areaBlocks,
    validation,
    isDrawing: drawing.phase === 'drawing',
    isEditing: drawing.phase === 'editing',
    isCompleted: drawing.phase === 'completed',
    canComplete: points.length >= MIN_BOUNDARY_POINTS && validation.valid,
    farmLocked: points.length > 0 || drawing.phase !== 'idle',
    persistedToBhuguard: drawing.persistedLocally,
    drawingStartedAt,
    drawingCompletedAt,
    startDrawing,
    addVertex,
    undoLastVertex: drawing.undoLastPoint,
    resetBoundary,
    completeBoundary,
    enterEditMode: drawing.enterEditMode,
    cancelEditMode: drawing.cancelEditMode,
    finishEditMode: drawing.finishEditMode,
    beginVertexDrag: drawing.beginVertexDrag,
    moveVertexDuringDrag: drawing.moveVertexDuringDrag,
    endVertexDrag: drawing.endVertexDrag,
    selectVertexIndex: drawing.selectVertexIndex,
    markPersistedToBhuguard,
    updateVertex,
    setSelectedVertexHere,
    setSelectedPointId,
    removeVertex,
    handleMapPress,
    loadPoints,
    setPhase: drawing.setPhase,
    setFarmLocked: (_locked: boolean) => undefined,
  };
}
