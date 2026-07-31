import type { BoundaryPoint } from './boundaryGeometry';

export type ManualDrawingPhase = 'idle' | 'drawing' | 'completed' | 'editing';

export const DRAWING_BOUNDARY_BORDER_COLOR = '#F59E0B';
export const DRAWING_BOUNDARY_FILL_COLOR = 'rgba(245,158,11,0.18)';
export const COMPLETED_BOUNDARY_BORDER_COLOR = '#2563EB';
export const COMPLETED_BOUNDARY_FILL_COLOR = 'rgba(37,99,235,0.28)';
export const EDITING_BOUNDARY_BORDER_COLOR = '#EA580C';
export const EDITING_BOUNDARY_FILL_COLOR = 'rgba(234,88,12,0.28)';
export const SAVED_BOUNDARY_BORDER_COLOR = '#0E7A45';
export const SAVED_BOUNDARY_FILL_COLOR = 'rgba(14,122,69,0.28)';
export const INVALID_BOUNDARY_BORDER_COLOR = '#DC2626';
export const INVALID_BOUNDARY_FILL_COLOR = 'rgba(220,38,38,0.28)';

export function getManualBoundaryVisualStyle(
  phase: ManualDrawingPhase,
  isValid: boolean,
  persistedToBhuguard: boolean,
): { strokeColor: string; fillColor: string } {
  if (!isValid) {
    return {
      strokeColor: INVALID_BOUNDARY_BORDER_COLOR,
      fillColor: INVALID_BOUNDARY_FILL_COLOR,
    };
  }

  if (persistedToBhuguard) {
    return {
      strokeColor: SAVED_BOUNDARY_BORDER_COLOR,
      fillColor: SAVED_BOUNDARY_FILL_COLOR,
    };
  }

  if (phase === 'drawing') {
    // Line-only while drawing — fill is not rendered until the polygon is completed.
    return {
      strokeColor: DRAWING_BOUNDARY_BORDER_COLOR,
      fillColor: 'rgba(245,158,11,0)',
    };
  }

  if (phase === 'editing') {
    return {
      strokeColor: EDITING_BOUNDARY_BORDER_COLOR,
      fillColor: EDITING_BOUNDARY_FILL_COLOR,
    };
  }

  if (phase === 'completed') {
    return {
      strokeColor: COMPLETED_BOUNDARY_BORDER_COLOR,
      fillColor: COMPLETED_BOUNDARY_FILL_COLOR,
    };
  }

  return {
    strokeColor: DRAWING_BOUNDARY_BORDER_COLOR,
    fillColor: DRAWING_BOUNDARY_FILL_COLOR,
  };
}

export function cloneBoundaryPoints(points: BoundaryPoint[]): BoundaryPoint[] {
  return points.map((point) => ({ ...point }));
}
