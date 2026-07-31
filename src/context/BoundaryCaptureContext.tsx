import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ApiRecord } from '../utils/apiHelpers';
import { pickString } from '../utils/apiHelpers';
import {
  type AreaUnit,
  type BoundaryPoint,
  type MappingStatus,
  calculateBoundaryMetrics,
  boundaryPointsToLatLng,
  formatAreaByUnit,
  formatGpsAccuracy,
  formatMappingStatus,
  isEditedBoundaryOutsideTolerance,
  POOR_GPS_WARNING_METERS,
  removeNearDuplicatePoints,
} from '../utils/boundaryGeometry';
import type { BoundarySessionMode } from '../utils/boundaryFlowRoutes';
import type { LatLng } from '../utils/farmSatelliteMap';

const DRAFT_STORAGE_KEY = 'bhuguard.boundary.draft.v1';

interface BoundaryCaptureState {
  sessionMode: BoundarySessionMode;
  farmId: number | null;
  farmerId: number | null;
  farmName: string;
  farmCode: string;
  farmerName: string;
  declaredArea: string;
  declaredUnit: AreaUnit;
  unit: AreaUnit;
  points: BoundaryPoint[];
  walkingPoints: BoundaryPoint[];
  captureMethod: 'gps' | 'camera' | 'manual';
  mappingStatus: MappingStatus;
  currentAccuracy: number | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentAltitude: number | null;
  mappingStartedAt: string | null;
  mappingFinishedAt: string | null;
  poorAccuracyWarning: boolean;
}

interface BoundaryCaptureContextValue extends BoundaryCaptureState {
  metrics: ReturnType<typeof calculateBoundaryMetrics>;
  areaLabel: string;
  gpsAccuracyLabel: string;
  mappingStatusLabel: string;
  isOutsideTolerance: boolean;
  setFarm: (farmId: number, farmName: string, farmCode: string) => void;
  setSession: (
    session: Partial<
      Pick<
        BoundaryCaptureState,
        'sessionMode' | 'farmId' | 'farmerId' | 'farmName' | 'farmCode' | 'farmerName' | 'declaredArea' | 'declaredUnit' | 'unit'
      >
    >,
  ) => void;
  setUnit: (unit: AreaUnit) => void;
  setCaptureMethod: (method: 'gps' | 'camera' | 'manual') => void;
  setCurrentLocation: (latitude: number, longitude: number, accuracy: number, altitude?: number | null) => void;
  setPoints: (points: BoundaryPoint[]) => void;
  addPoint: (point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => void;
  updatePointCoordinate: (id: string, coordinate: LatLng) => void;
  insertPointAfter: (afterIndex: number, point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => void;
  removePoint: (id: string) => void;
  undoLastPoint: () => void;
  resetBoundary: () => void;
  startWalkingMapping: () => void;
  startBoundaryWithPoint: (point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => void;
  pauseMapping: () => void;
  resumeMapping: () => void;
  resumeWalkingMapping: () => void;
  finishBoundaryMapping: () => void;
  enterEditing: () => void;
  setPoorAccuracyWarning: (value: boolean) => void;
  loadExistingBoundary: (boundary: ApiRecord) => void;
  clearSession: () => void;
  clearDraft: () => Promise<void>;
  /** @deprecated use mappingStatus / pauseMapping */
  paused: boolean;
  togglePaused: () => void;
}

const defaultState: BoundaryCaptureState = {
  sessionMode: 'farm',
  farmId: null,
  farmerId: null,
  farmName: 'Farm',
  farmCode: 'BG-FARM-000',
  farmerName: 'Farmer',
  declaredArea: '',
  declaredUnit: 'acre',
  unit: 'acre',
  points: [],
  walkingPoints: [],
  captureMethod: 'gps',
  mappingStatus: 'not_started',
  currentAccuracy: null,
  currentLatitude: null,
  currentLongitude: null,
  currentAltitude: null,
  mappingStartedAt: null,
  mappingFinishedAt: null,
  poorAccuracyWarning: false,
};

const BoundaryCaptureContext = createContext<BoundaryCaptureContextValue | null>(null);

function createPointId(): string {
  return `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function renumber(points: BoundaryPoint[]): BoundaryPoint[] {
  return points.map((point, index) => ({ ...point, pointNo: index + 1 }));
}

function pointsAreEqual(left: BoundaryPoint[], right: BoundaryPoint[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every(
    (point, index) =>
      point.id === right[index].id
      && point.latitude === right[index].latitude
      && point.longitude === right[index].longitude
      && point.pointNo === right[index].pointNo,
  );
}

function parseStoredPoint(item: unknown, index: number): BoundaryPoint | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as ApiRecord;
  const latitude = Number(record.latitude ?? record.lat);
  const longitude = Number(record.longitude ?? record.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    id: String(record.id ?? createPointId()),
    pointNo: Number(record.point_no ?? record.sequence ?? index + 1),
    latitude,
    longitude,
    accuracy: Number(record.accuracy ?? 0),
    altitude:
      record.altitude === null || record.altitude === undefined ? null : Number(record.altitude),
    timestamp:
      pickString(record, 'timestamp') !== '-'
        ? pickString(record, 'timestamp')
        : new Date().toISOString(),
    manual: Boolean(record.is_manual ?? record.manual),
    label: pickString(record, 'label') !== '-' ? pickString(record, 'label') : undefined,
    notes: pickString(record, 'notes') !== '-' ? pickString(record, 'notes') : undefined,
  };
}

export function BoundaryCaptureProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BoundaryCaptureState>(defaultState);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const metrics = useMemo(
    () => calculateBoundaryMetrics(boundaryPointsToLatLng(state.points)),
    [state.points],
  );

  const areaLabel = useMemo(() => formatAreaByUnit(metrics, state.unit), [metrics, state.unit]);
  const gpsAccuracyLabel = useMemo(() => formatGpsAccuracy(state.currentAccuracy), [state.currentAccuracy]);
  const mappingStatusLabel = useMemo(
    () => formatMappingStatus(state.mappingStatus),
    [state.mappingStatus],
  );
  const isOutsideTolerance = useMemo(
    () => isEditedBoundaryOutsideTolerance(state.walkingPoints, state.points),
    [state.walkingPoints, state.points],
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrateDraft() {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw || cancelled) {
          return;
        }

        const draft = JSON.parse(raw) as Partial<BoundaryCaptureState>;
        if (!draft.points?.length) {
          return;
        }

        setState((current) => ({
          ...current,
          farmId: draft.farmId ?? current.farmId,
          farmName: draft.farmName ?? current.farmName,
          farmCode: draft.farmCode ?? current.farmCode,
          unit: draft.unit ?? current.unit,
          points: Array.isArray(draft.points) ? draft.points : current.points,
          walkingPoints: Array.isArray(draft.walkingPoints) ? draft.walkingPoints : current.walkingPoints,
          mappingStatus: draft.mappingStatus ?? current.mappingStatus,
          mappingStartedAt: draft.mappingStartedAt ?? current.mappingStartedAt,
          mappingFinishedAt: draft.mappingFinishedAt ?? current.mappingFinishedAt,
          sessionMode: draft.sessionMode ?? current.sessionMode,
        }));
      } catch {
        // Ignore corrupt drafts.
      } finally {
        if (!cancelled) {
          setDraftHydrated(true);
        }
      }
    }

    void hydrateDraft();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftHydrated) {
      return;
    }

    if (state.points.length === 0 && state.mappingStatus === 'not_started') {
      void AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    const payload = {
      farmId: state.farmId,
      farmName: state.farmName,
      farmCode: state.farmCode,
      unit: state.unit,
      points: state.points,
      walkingPoints: state.walkingPoints,
      mappingStatus: state.mappingStatus,
      mappingStartedAt: state.mappingStartedAt,
      mappingFinishedAt: state.mappingFinishedAt,
      sessionMode: state.sessionMode,
    };

    void AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  }, [
    draftHydrated,
    state.farmId,
    state.farmName,
    state.farmCode,
    state.unit,
    state.points,
    state.walkingPoints,
    state.mappingStatus,
    state.mappingStartedAt,
    state.mappingFinishedAt,
    state.sessionMode,
  ]);

  const setFarm = useCallback((farmId: number, farmName: string, farmCode: string) => {
    setState((current) => ({ ...current, farmId, farmName, farmCode }));
  }, []);

  const setSession = useCallback(
    (
      session: Partial<
        Pick<
          BoundaryCaptureState,
          'sessionMode' | 'farmId' | 'farmName' | 'farmCode' | 'farmerName' | 'declaredArea' | 'declaredUnit' | 'unit'
        >
      >,
    ) => {
      setState((current) => ({ ...current, ...session }));
    },
    [],
  );

  const setUnit = useCallback((unit: AreaUnit) => {
    setState((current) => ({ ...current, unit }));
  }, []);

  const setCaptureMethod = useCallback((captureMethod: 'gps' | 'camera' | 'manual') => {
    setState((current) =>
      current.captureMethod === captureMethod ? current : { ...current, captureMethod },
    );
  }, []);

  const setCurrentLocation = useCallback(
    (latitude: number, longitude: number, accuracy: number, altitude: number | null = null) => {
      setState((current) => {
        if (
          current.currentLatitude === latitude
          && current.currentLongitude === longitude
          && current.currentAccuracy === accuracy
          && current.currentAltitude === altitude
        ) {
          return current;
        }

        return {
          ...current,
          currentLatitude: latitude,
          currentLongitude: longitude,
          currentAccuracy: accuracy,
          currentAltitude: altitude,
          poorAccuracyWarning:
            accuracy > POOR_GPS_WARNING_METERS
              ? true
              : current.poorAccuracyWarning && accuracy > POOR_GPS_WARNING_METERS,
        };
      });
    },
    [],
  );

  const setPoints = useCallback((points: BoundaryPoint[]) => {
    setState((current) => {
      const renumbered = renumber(points);

      if (pointsAreEqual(current.points, renumbered)) {
        return current;
      }

      return {
        ...current,
        points: renumbered,
      };
    });
  }, []);

  const addPoint = useCallback((point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => {
    setState((current) => {
      const nextPoint: BoundaryPoint = {
        ...point,
        id: createPointId(),
        pointNo: current.points.length + 1,
      };

      return { ...current, points: [...current.points, nextPoint], poorAccuracyWarning: false };
    });
  }, []);

  const updatePointCoordinate = useCallback((id: string, coordinate: LatLng) => {
    setState((current) => ({
      ...current,
      mappingStatus: current.mappingStatus === 'completed' ? 'editing' : current.mappingStatus,
      points: current.points.map((point) =>
        point.id === id
          ? { ...point, latitude: coordinate.latitude, longitude: coordinate.longitude }
          : point,
      ),
    }));
  }, []);

  const insertPointAfter = useCallback((afterIndex: number, point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => {
    setState((current) => {
      const next = [...current.points];
      next.splice(afterIndex + 1, 0, {
        ...point,
        id: createPointId(),
        pointNo: afterIndex + 2,
      });

      return {
        ...current,
        mappingStatus: current.mappingStatus === 'completed' ? 'editing' : current.mappingStatus,
        points: renumber(next),
      };
    });
  }, []);

  const removePoint = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      points: renumber(current.points.filter((point) => point.id !== id)),
    }));
  }, []);

  const undoLastPoint = useCallback(() => {
    setState((current) => ({
      ...current,
      points: renumber(current.points.slice(0, -1)),
    }));
  }, []);

  const resetBoundary = useCallback(() => {
    setState((current) => ({
      ...current,
      points: [],
      walkingPoints: [],
      mappingStatus: 'not_started',
      mappingStartedAt: null,
      mappingFinishedAt: null,
      poorAccuracyWarning: false,
    }));
  }, []);

  const startBoundaryWithPoint = useCallback((point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => {
    const startPoint: BoundaryPoint = {
      ...point,
      id: createPointId(),
      pointNo: 1,
    };

    setState((current) => ({
      ...current,
      points: [startPoint],
      walkingPoints: [],
      mappingStatus: 'recording',
      mappingStartedAt: new Date().toISOString(),
      mappingFinishedAt: null,
      poorAccuracyWarning: point.accuracy > POOR_GPS_WARNING_METERS,
    }));
  }, []);

  const startWalkingMapping = useCallback(() => {
    setState((current) => ({
      ...current,
      mappingStatus: 'recording',
      mappingStartedAt: current.mappingStartedAt ?? new Date().toISOString(),
      mappingFinishedAt: null,
      walkingPoints: [],
      points: current.mappingStatus === 'not_started' ? [] : current.points,
    }));
  }, []);

  const pauseMapping = useCallback(() => {
    setState((current) =>
      current.mappingStatus === 'recording' ? { ...current, mappingStatus: 'paused' } : current,
    );
  }, []);

  const resumeWalkingMapping = useCallback(() => {
    setState((current) =>
      current.points.length > 0
        ? { ...current, mappingStatus: 'recording', mappingFinishedAt: null }
        : current,
    );
  }, []);

  const resumeMapping = useCallback(() => {
    setState((current) =>
      current.mappingStatus === 'paused' ? { ...current, mappingStatus: 'recording' } : current,
    );
  }, []);

  const finishBoundaryMapping = useCallback(() => {
    setState((current) => {
      const cleaned = removeNearDuplicatePoints(current.points);

      return {
        ...current,
        points: cleaned,
        walkingPoints: cleaned.map((point) => ({ ...point })),
        mappingStatus: 'completed',
        mappingFinishedAt: new Date().toISOString(),
      };
    });
  }, []);

  const enterEditing = useCallback(() => {
    setState((current) => ({ ...current, mappingStatus: 'editing' }));
  }, []);

  const setPoorAccuracyWarning = useCallback((value: boolean) => {
    setState((current) => ({ ...current, poorAccuracyWarning: value }));
  }, []);

  const togglePaused = useCallback(() => {
    setState((current) => {
      if (current.mappingStatus === 'recording') {
        return { ...current, mappingStatus: 'paused' };
      }

      if (current.mappingStatus === 'paused') {
        return { ...current, mappingStatus: 'recording' };
      }

      return current;
    });
  }, []);

  const loadExistingBoundary = useCallback((boundary: ApiRecord) => {
    const rawPoints = Array.isArray(boundary.boundary_points) ? boundary.boundary_points : [];
    const points = rawPoints
      .map((item, index) => parseStoredPoint(item, index))
      .filter((point): point is BoundaryPoint => point !== null);

    const rawWalking = Array.isArray(boundary.walking_boundary_points)
      ? boundary.walking_boundary_points
      : rawPoints;
    const walkingPoints = rawWalking
      .map((item, index) => parseStoredPoint(item, index))
      .filter((point): point is BoundaryPoint => point !== null);

    const rawEdited = Array.isArray(boundary.edited_boundary_points)
      ? boundary.edited_boundary_points
      : null;
    const editedPoints = rawEdited
      ? rawEdited
          .map((item, index) => parseStoredPoint(item, index))
          .filter((point): point is BoundaryPoint => point !== null)
      : points;

    setState((current) => ({
      ...current,
      unit: (pickString(boundary, 'unit') as AreaUnit) || current.unit,
      captureMethod: (pickString(boundary, 'capture_method') as 'gps' | 'camera' | 'manual') || current.captureMethod,
      points: renumber(editedPoints),
      walkingPoints: renumber(walkingPoints.length ? walkingPoints : editedPoints),
      mappingStatus: 'completed',
      mappingStartedAt: pickString(boundary, 'mapping_started_at') !== '-' ? pickString(boundary, 'mapping_started_at') : null,
      mappingFinishedAt: pickString(boundary, 'mapping_finished_at') !== '-' ? pickString(boundary, 'mapping_finished_at') : null,
    }));
  }, []);

  const clearDraft = useCallback(async () => {
    await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const clearSession = useCallback(() => {
    setState(defaultState);
    void AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      paused: state.mappingStatus === 'paused',
      metrics,
      areaLabel,
      gpsAccuracyLabel,
      mappingStatusLabel,
      isOutsideTolerance,
      setFarm,
      setSession,
      setUnit,
      setCaptureMethod,
      setCurrentLocation,
      setPoints,
      addPoint,
      updatePointCoordinate,
      insertPointAfter,
      removePoint,
      undoLastPoint,
      resetBoundary,
      startWalkingMapping,
      startBoundaryWithPoint,
      pauseMapping,
      resumeMapping,
      resumeWalkingMapping,
      finishBoundaryMapping,
      enterEditing,
      setPoorAccuracyWarning,
      togglePaused,
      loadExistingBoundary,
      clearSession,
      clearDraft,
    }),
    [
      state,
      metrics,
      areaLabel,
      gpsAccuracyLabel,
      mappingStatusLabel,
      isOutsideTolerance,
      setFarm,
      setSession,
      setUnit,
      setCaptureMethod,
      setCurrentLocation,
      setPoints,
      addPoint,
      updatePointCoordinate,
      insertPointAfter,
      removePoint,
      undoLastPoint,
      resetBoundary,
      startWalkingMapping,
      startBoundaryWithPoint,
      pauseMapping,
      resumeMapping,
      resumeWalkingMapping,
      finishBoundaryMapping,
      enterEditing,
      setPoorAccuracyWarning,
      togglePaused,
      loadExistingBoundary,
      clearSession,
      clearDraft,
    ],
  );

  return <BoundaryCaptureContext.Provider value={value}>{children}</BoundaryCaptureContext.Provider>;
}

export function useBoundaryCapture() {
  const context = useContext(BoundaryCaptureContext);

  if (!context) {
    throw new Error('useBoundaryCapture must be used within BoundaryCaptureProvider');
  }

  return context;
}
