export type { MapRegion } from './mapCoordinates';

export function hasNativeMapsRuntime(): boolean {
  return false;
}

export function getNativeMapsModule(): null {
  return null;
}

export function isNativeMapsAvailable(): boolean {
  return false;
}

export function canRenderNativeGoogleMap(): boolean {
  return false;
}
