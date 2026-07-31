import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LngLat } from '../utils/lngLat';

import {
  type BoundaryPoint,
  type LatLng,
  MIN_BOUNDARY_POINTS,
  createBoundaryPoint,
  formatAreaBlocks,
  isValidCoordinate,
  pointsTooClose,
  validatePolygon,
} from '../utils/foBoundaryGeometry';
import {
  INVALID_BOUNDARY_POINT_MESSAGE,
  applyLngLatToBoundaryPoints,
  cloneBoundaryPoints,
  isValidLngLat,
  pointsToLatLngList,
  restoreVertexFromSnapshot,
  updateEditableVertex,
  validateEditablePolygon,
} from '../utils/foEditVertex';

export type DrawingPhase = 'idle' | 'drawing' | 'completed' | 'editing';

function renumberPoints(points: BoundaryPoint[]): BoundaryPoint[] {
  return points.map((point, index) => ({
    ...point,
    pointNo: index + 1,
    id: `pt-${index + 1}`,
  }));
}

export function useBoundaryDrawing(initialPoints: BoundaryPoint[] = [], initiallySaved = false) {
  const [phase, setPhase] = useState<DrawingPhase>(initiallySaved ? 'completed' : 'idle');
  const [points, setPoints] = useState<BoundaryPoint[]>(initialPoints);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [invalidVertexIndex, setInvalidVertexIndex] = useState<number | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [savedBoundaryCoordinates, setSavedBoundaryCoordinates] = useState<BoundaryPoint[] | null>(
    initiallySaved ? cloneBoundaryPoints(initialPoints) : null,
  );
  const [editingSnapshot, setEditingSnapshot] = useState<BoundaryPoint[] | null>(null);
  const [persistedLocally, setPersistedLocally] = useState(initiallySaved);
  const [wasPersistedBeforeEdit, setWasPersistedBeforeEdit] = useState(false);
  const [isDraggingVertex, setIsDraggingVertex] = useState(false);

  const lastValidCoordinatesRef = useRef<BoundaryPoint[]>(cloneBoundaryPoints(initialPoints));
  const pendingDragCoordinateRef = useRef<{ index: number; lngLat: LngLat } | null>(null);
  const dragAnimationFrameRef = useRef<number | null>(null);
  const pointsRef = useRef(points);
  const mountedRef = useRef(true);

  pointsRef.current = points;

  const cancelDragAnimationFrame = useCallback(() => {
    if (dragAnimationFrameRef.current != null) {
      cancelAnimationFrame(dragAnimationFrameRef.current);
      dragAnimationFrameRef.current = null;
    }
    pendingDragCoordinateRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelDragAnimationFrame();
    };
  }, [cancelDragAnimationFrame]);

  const validation = useMemo(() => validatePolygon(points), [points]);
  const areaBlocks = useMemo(
    () => (validation.metrics ? formatAreaBlocks(validation.metrics) : []),
    [validation.metrics],
  );

  const editableLngLats = useMemo(
    () => points.map((point) => [point.longitude, point.latitude] as LngLat),
    [points],
  );

  const applyPendingDrag = useCallback(() => {
    dragAnimationFrameRef.current = null;
    const pending = pendingDragCoordinateRef.current;
    pendingDragCoordinateRef.current = null;
    if (!pending || !mountedRef.current) {
      return;
    }

    const openCoords = pointsToLatLngList(pointsRef.current);
    const result = updateEditableVertex(openCoords, pending.index, pending.lngLat);
    if (!result.ok) {
      return;
    }

    setPoints((current) => applyLngLatToBoundaryPoints(current, pending.index, pending.lngLat));
    setInvalidVertexIndex(null);
    setEditMessage(null);
  }, []);

  const scheduleVertexDrag = useCallback(
    (index: number, lngLat: LngLat) => {
      if (phase !== 'editing') {
        return;
      }
      pendingDragCoordinateRef.current = { index, lngLat };
      if (dragAnimationFrameRef.current != null) {
        return;
      }
      dragAnimationFrameRef.current = requestAnimationFrame(applyPendingDrag);
    },
    [applyPendingDrag, phase],
  );

  const startDrawing = useCallback(() => {
    cancelDragAnimationFrame();
    setPhase('drawing');
    setPoints([]);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setEditingSnapshot(null);
    setIsDraggingVertex(false);
    setPersistedLocally(false);
    lastValidCoordinatesRef.current = [];
  }, [cancelDragAnimationFrame]);

  const undoLastPoint = useCallback(() => {
    if (phase !== 'drawing') {
      return;
    }
    setPoints((current) => renumberPoints(current.slice(0, -1)));
  }, [phase]);

  const resetBoundary = useCallback(() => {
    cancelDragAnimationFrame();
    setPhase('idle');
    setPoints([]);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setEditingSnapshot(null);
    setSavedBoundaryCoordinates(null);
    setIsDraggingVertex(false);
    setWasPersistedBeforeEdit(false);
    setPersistedLocally(false);
    lastValidCoordinatesRef.current = [];
  }, [cancelDragAnimationFrame]);

  const addVertex = useCallback(
    (coordinate: LatLng, accuracy?: number | null) => {
      if (phase !== 'drawing') {
        return;
      }
      if (!isValidCoordinate(coordinate.latitude, coordinate.longitude)) {
        return;
      }
      setPoints((current) => {
        const last = current[current.length - 1];
        if (last && pointsTooClose(last, coordinate)) {
          return current;
        }
        const nextNo = current.length + 1;
        return [...current, createBoundaryPoint(coordinate, nextNo, accuracy)];
      });
    },
    [phase],
  );

  const completeBoundary = useCallback((): string | null => {
    const result = validatePolygon(points);
    if (!result.valid) {
      return result.message;
    }
    setPhase('completed');
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setIsDraggingVertex(false);
    lastValidCoordinatesRef.current = cloneBoundaryPoints(points);
    return null;
  }, [points]);

  const enterEditMode = useCallback(() => {
    cancelDragAnimationFrame();
    const snapshot = cloneBoundaryPoints(points);
    setEditingSnapshot(snapshot);
    lastValidCoordinatesRef.current = cloneBoundaryPoints(snapshot);
    if (persistedLocally) {
      setSavedBoundaryCoordinates(snapshot);
    }
    setWasPersistedBeforeEdit(persistedLocally);
    setPhase('editing');
    setPersistedLocally(false);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setIsDraggingVertex(false);
  }, [cancelDragAnimationFrame, persistedLocally, points]);

  const cancelEditMode = useCallback(() => {
    cancelDragAnimationFrame();
    const restoreFrom = editingSnapshot ?? savedBoundaryCoordinates;
    if (restoreFrom) {
      setPoints(cloneBoundaryPoints(restoreFrom));
      lastValidCoordinatesRef.current = cloneBoundaryPoints(restoreFrom);
    }
    setEditingSnapshot(null);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setIsDraggingVertex(false);
    setPersistedLocally(wasPersistedBeforeEdit);
    setPhase('completed');
  }, [cancelDragAnimationFrame, editingSnapshot, savedBoundaryCoordinates, wasPersistedBeforeEdit]);

  const finishEditMode = useCallback((): string | null => {
    cancelDragAnimationFrame();
    const result = validateEditablePolygon(pointsToLatLngList(points));
    if (!result.valid) {
      return result.message;
    }
    setEditingSnapshot(null);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setIsDraggingVertex(false);
    lastValidCoordinatesRef.current = cloneBoundaryPoints(points);
    setPhase('completed');
    return null;
  }, [cancelDragAnimationFrame, points]);

  const beginVertexDrag = useCallback(
    (index: number) => {
      if (phase !== 'editing') {
        return;
      }
      lastValidCoordinatesRef.current = cloneBoundaryPoints(pointsRef.current);
      setSelectedVertexIndex(index);
      setInvalidVertexIndex(null);
      setEditMessage(null);
      setIsDraggingVertex(true);
    },
    [phase],
  );

  const moveVertexDuringDrag = useCallback(
    (index: number, lngLat: LngLat) => {
      if (!isValidLngLat(lngLat)) {
        return;
      }
      scheduleVertexDrag(index, lngLat);
    },
    [scheduleVertexDrag],
  );

  const endVertexDrag = useCallback(
    (index: number, lngLat: LngLat | null) => {
      cancelDragAnimationFrame();

      if (phase === 'editing' && lngLat && isValidLngLat(lngLat)) {
        setPoints((current) => applyLngLatToBoundaryPoints(current, index, lngLat));
      }

      // Validate after flush using the latest intended coordinates.
      const base = pointsRef.current;
      const candidatePoints =
        lngLat && isValidLngLat(lngLat)
          ? applyLngLatToBoundaryPoints(base, index, lngLat)
          : base;
      const validationResult = validateEditablePolygon(pointsToLatLngList(candidatePoints));

      if (!validationResult.valid) {
        const restored = restoreVertexFromSnapshot(candidatePoints, lastValidCoordinatesRef.current, index);
        setPoints(restored);
        pointsRef.current = restored;
        setInvalidVertexIndex(index);
        setEditMessage(INVALID_BOUNDARY_POINT_MESSAGE);
      } else {
        setPoints(candidatePoints);
        pointsRef.current = candidatePoints;
        lastValidCoordinatesRef.current = cloneBoundaryPoints(candidatePoints);
        setInvalidVertexIndex(null);
        setEditMessage(null);
      }

      setSelectedVertexIndex(index);
      setIsDraggingVertex(false);
    },
    [cancelDragAnimationFrame, phase],
  );

  const selectVertexIndex = useCallback((index: number) => {
    if (!Number.isFinite(index) || index < 0) {
      setSelectedVertexIndex(null);
      return;
    }
    setSelectedVertexIndex(index);
    setInvalidVertexIndex((current) => (current === index ? current : null));
  }, []);

  const deleteSelectedPoint = useCallback((): string | null => {
    if (phase !== 'editing' || selectedVertexIndex == null) {
      return 'Select a point to delete.';
    }
    if (points.length <= MIN_BOUNDARY_POINTS) {
      return `Keep at least ${MIN_BOUNDARY_POINTS} points.`;
    }

    setPoints((current) => {
      const next = renumberPoints(current.filter((_, index) => index !== selectedVertexIndex));
      lastValidCoordinatesRef.current = cloneBoundaryPoints(next);
      return next;
    });
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    return null;
  }, [phase, points.length, selectedVertexIndex]);

  const addPointAfterSelected = useCallback((): string | null => {
    if (phase !== 'editing') {
      return 'Enter edit mode first.';
    }
    if (points.length < 2) {
      return 'Need at least two points.';
    }

    const index = selectedVertexIndex != null && selectedVertexIndex >= 0 ? selectedVertexIndex : 0;
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (!current || !next) {
      return 'Unable to insert point.';
    }

    const midpoint = {
      latitude: (current.latitude + next.latitude) / 2,
      longitude: (current.longitude + next.longitude) / 2,
    };

    setPoints((existing) => {
      const inserted = renumberPoints([
        ...existing.slice(0, index + 1),
        createBoundaryPoint(midpoint, index + 2),
        ...existing.slice(index + 1),
      ]);
      lastValidCoordinatesRef.current = cloneBoundaryPoints(inserted);
      return inserted;
    });
    return null;
  }, [phase, points, selectedVertexIndex]);

  const loadPoints = useCallback((nextPoints: BoundaryPoint[], saved: boolean) => {
    cancelDragAnimationFrame();
    const cloned = cloneBoundaryPoints(nextPoints);
    setPoints(cloned);
    setPhase(saved || nextPoints.length >= MIN_BOUNDARY_POINTS ? 'completed' : 'idle');
    setPersistedLocally(saved);
    setSavedBoundaryCoordinates(saved ? cloned : null);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
    setEditingSnapshot(null);
    setIsDraggingVertex(false);
    setWasPersistedBeforeEdit(false);
    lastValidCoordinatesRef.current = cloned;
  }, [cancelDragAnimationFrame]);

  const markPersisted = useCallback(() => {
    const cloned = cloneBoundaryPoints(points);
    setPersistedLocally(true);
    setSavedBoundaryCoordinates(cloned);
    lastValidCoordinatesRef.current = cloned;
    setPhase('completed');
    setEditingSnapshot(null);
    setIsDraggingVertex(false);
    setSelectedVertexIndex(null);
    setInvalidVertexIndex(null);
    setEditMessage(null);
  }, [points]);

  return {
    phase,
    points,
    editableLngLats,
    selectedVertexIndex,
    invalidVertexIndex,
    editMessage,
    persistedLocally,
    isDraggingVertex,
    isEditing: phase === 'editing',
    isEditingBoundary: phase === 'editing',
    validation,
    areaBlocks,
    canComplete: points.length >= MIN_BOUNDARY_POINTS && validation.valid,
    canDeleteSelected:
      phase === 'editing'
      && selectedVertexIndex != null
      && points.length > MIN_BOUNDARY_POINTS,
    startDrawing,
    undoLastPoint,
    resetBoundary,
    addVertex,
    completeBoundary,
    enterEditMode,
    cancelEditMode,
    finishEditMode,
    beginVertexDrag,
    moveVertexDuringDrag,
    endVertexDrag,
    selectVertexIndex,
    deleteSelectedPoint,
    addPointAfterSelected,
    loadPoints,
    markPersisted,
    setPhase,
  };
}
