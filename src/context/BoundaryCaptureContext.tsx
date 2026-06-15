import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ApiRecord } from '../utils/apiHelpers';
import { pickString } from '../utils/apiHelpers';
import {
  type AreaUnit,
  type BoundaryPoint,
  calculateBoundaryMetrics,
  boundaryPointsToLatLng,
  formatAreaByUnit,
  formatGpsAccuracy,
} from '../utils/boundaryGeometry';

interface BoundaryCaptureState {
  farmId: number | null;
  farmName: string;
  farmCode: string;
  unit: AreaUnit;
  points: BoundaryPoint[];
  paused: boolean;
  satelliteMode: boolean;
  currentAccuracy: number | null;
  currentLatitude: number | null;
  currentLongitude: number | null;
}

interface BoundaryCaptureContextValue extends BoundaryCaptureState {
  metrics: ReturnType<typeof calculateBoundaryMetrics>;
  areaLabel: string;
  gpsAccuracyLabel: string;
  setFarm: (farmId: number, farmName: string, farmCode: string) => void;
  setUnit: (unit: AreaUnit) => void;
  setCurrentLocation: (latitude: number, longitude: number, accuracy: number) => void;
  setPoints: (points: BoundaryPoint[]) => void;
  addPoint: (point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => void;
  removePoint: (id: string) => void;
  undoLastPoint: () => void;
  resetBoundary: () => void;
  togglePaused: () => void;
  toggleSatelliteMode: () => void;
  loadExistingBoundary: (boundary: ApiRecord) => void;
  clearSession: () => void;
}

const defaultState: BoundaryCaptureState = {
  farmId: null,
  farmName: 'Farm',
  farmCode: 'BG-FARM-000',
  unit: 'acre',
  points: [],
  paused: false,
  satelliteMode: true,
  currentAccuracy: null,
  currentLatitude: null,
  currentLongitude: null,
};

const BoundaryCaptureContext = createContext<BoundaryCaptureContextValue | null>(null);

function createPointId(): string {
  return `pt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BoundaryCaptureProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BoundaryCaptureState>(defaultState);

  const metrics = useMemo(
    () => calculateBoundaryMetrics(boundaryPointsToLatLng(state.points)),
    [state.points],
  );

  const areaLabel = useMemo(() => formatAreaByUnit(metrics, state.unit), [metrics, state.unit]);
  const gpsAccuracyLabel = useMemo(() => formatGpsAccuracy(state.currentAccuracy), [state.currentAccuracy]);

  const setFarm = useCallback((farmId: number, farmName: string, farmCode: string) => {
    setState((current) => ({ ...current, farmId, farmName, farmCode }));
  }, []);

  const setUnit = useCallback((unit: AreaUnit) => {
    setState((current) => ({ ...current, unit }));
  }, []);

  const setCurrentLocation = useCallback((latitude: number, longitude: number, accuracy: number) => {
    setState((current) => ({ ...current, currentLatitude: latitude, currentLongitude: longitude, currentAccuracy: accuracy }));
  }, []);

  const setPoints = useCallback((points: BoundaryPoint[]) => {
    setState((current) => ({
      ...current,
      points: points.map((point, index) => ({ ...point, pointNo: index + 1 })),
    }));
  }, []);

  const addPoint = useCallback((point: Omit<BoundaryPoint, 'id' | 'pointNo'>) => {
    setState((current) => {
      const nextPoint: BoundaryPoint = {
        ...point,
        id: createPointId(),
        pointNo: current.points.length + 1,
      };

      return { ...current, points: [...current.points, nextPoint] };
    });
  }, []);

  const removePoint = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      points: current.points.filter((point) => point.id !== id).map((point, index) => ({ ...point, pointNo: index + 1 })),
    }));
  }, []);

  const undoLastPoint = useCallback(() => {
    setState((current) => ({
      ...current,
      points: current.points.slice(0, -1).map((point, index) => ({ ...point, pointNo: index + 1 })),
    }));
  }, []);

  const resetBoundary = useCallback(() => {
    setState((current) => ({ ...current, points: [] }));
  }, []);

  const togglePaused = useCallback(() => {
    setState((current) => ({ ...current, paused: !current.paused }));
  }, []);

  const toggleSatelliteMode = useCallback(() => {
    setState((current) => ({ ...current, satelliteMode: !current.satelliteMode }));
  }, []);

  const loadExistingBoundary = useCallback((boundary: ApiRecord) => {
    const rawPoints = Array.isArray(boundary.boundary_points) ? boundary.boundary_points : [];
    const points = rawPoints
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const record = item as ApiRecord;
        const point: BoundaryPoint = {
          id: String(record.id ?? createPointId()),
          pointNo: Number(record.point_no ?? index + 1),
          latitude: Number(record.latitude),
          longitude: Number(record.longitude),
          accuracy: Number(record.accuracy ?? 0),
          timestamp: pickString(record, 'timestamp') !== '-' ? pickString(record, 'timestamp') : new Date().toISOString(),
          manual: Boolean(record.is_manual),
        };

        const label = pickString(record, 'label');
        const notes = pickString(record, 'notes');

        if (label !== '-') {
          point.label = label;
        }

        if (notes !== '-') {
          point.notes = notes;
        }

        return Number.isFinite(point.latitude) && Number.isFinite(point.longitude) ? point : null;
      })
      .filter((point): point is BoundaryPoint => point !== null);

    setState((current) => ({
      ...current,
      unit: (pickString(boundary, 'unit') as AreaUnit) || current.unit,
      points,
    }));
  }, []);

  const clearSession = useCallback(() => {
    setState(defaultState);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      metrics,
      areaLabel,
      gpsAccuracyLabel,
      setFarm,
      setUnit,
      setCurrentLocation,
      setPoints,
      addPoint,
      removePoint,
      undoLastPoint,
      resetBoundary,
      togglePaused,
      toggleSatelliteMode,
      loadExistingBoundary,
      clearSession,
    }),
    [
      state,
      metrics,
      areaLabel,
      gpsAccuracyLabel,
      setFarm,
      setUnit,
      setCurrentLocation,
      setPoints,
      addPoint,
      removePoint,
      undoLastPoint,
      resetBoundary,
      togglePaused,
      toggleSatelliteMode,
      loadExistingBoundary,
      clearSession,
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
