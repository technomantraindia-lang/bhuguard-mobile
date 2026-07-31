import type { BoundaryPoint } from './boundaryGeometry';
import {
  AUTO_CAPTURE_DISTANCE_METERS,
  AUTO_CAPTURE_INTERVAL_MS,
  AUTO_CAPTURE_REJECT_ACCURACY_METERS,
  MAX_REALISTIC_SPEED_MPS,
  MIN_POINT_DISTANCE_METERS,
  haversineMeters,
} from './boundaryGeometry';

export interface GpsSample {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: string;
}

export interface AutoCaptureState {
  lastCaptureAt: number;
  lastCaptureCoord: { latitude: number; longitude: number } | null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collectBestGpsSample(
  readPosition: () => Promise<GpsSample>,
  durationMs = 15000,
  intervalMs = 1000,
): Promise<GpsSample | null> {
  const startedAt = Date.now();
  let best: GpsSample | null = null;

  while (Date.now() - startedAt < durationMs) {
    try {
      const sample = await readPosition();

      if (!best || sample.accuracy < best.accuracy) {
        best = sample;
      }

      if (sample.accuracy <= 2) {
        break;
      }
    } catch {
      // Keep sampling until timeout.
    }

    await sleep(intervalMs);
  }

  return best;
}

export function isUnrealisticJump(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  elapsedMs: number,
): boolean {
  if (elapsedMs <= 0) {
    return false;
  }

  const distance = haversineMeters(from.latitude, from.longitude, to.latitude, to.longitude);
  const speed = distance / (elapsedMs / 1000);

  return speed > MAX_REALISTIC_SPEED_MPS;
}

export function shouldAutoCaptureGpsPoint(
  sample: GpsSample,
  points: BoundaryPoint[],
  state: AutoCaptureState,
): boolean {
  if (sample.accuracy > AUTO_CAPTURE_REJECT_ACCURACY_METERS) {
    return false;
  }

  const now = Date.now();
  const lastPoint = points[points.length - 1];
  const lastCoord = state.lastCaptureCoord ?? lastPoint ?? null;
  const moved = lastCoord
    ? haversineMeters(lastCoord.latitude, lastCoord.longitude, sample.latitude, sample.longitude)
    : Number.POSITIVE_INFINITY;
  const elapsed = now - state.lastCaptureAt;

  if (lastCoord && isUnrealisticJump(lastCoord, sample, elapsed)) {
    return false;
  }

  if (points.length === 0) {
    return true;
  }

  if (moved < MIN_POINT_DISTANCE_METERS) {
    return false;
  }

  const byDistance = moved >= AUTO_CAPTURE_DISTANCE_METERS;
  const byTime = moved >= 1 && elapsed >= AUTO_CAPTURE_INTERVAL_MS;

  return byDistance || byTime;
}

export function getClosingDistanceThreshold(accuracyMeters: number | null | undefined): number {
  const accuracy = accuracyMeters ?? 8;

  return Math.max(5, Math.min(10, accuracy * 1.5));
}

export function calculateWalkingDistanceMeters(points: BoundaryPoint[]): number {
  if (points.length < 2) {
    return 0;
  }

  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const current = points[index];
    total += haversineMeters(prev.latitude, prev.longitude, current.latitude, current.longitude);
  }

  return Math.round(total);
}
