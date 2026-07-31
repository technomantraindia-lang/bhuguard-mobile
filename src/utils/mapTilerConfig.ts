/**
 * FO Farm Boundary MapTiler config.
 * Style probing / hybrid-v4 URLs come from the proven demo module (`foMapTiler`).
 * Keeps MapTilerStyleMode as satellite|street for existing FO screens.
 */

import { isRealApiKey } from './isRealApiKey';
import {
  MAP_FALLBACK_CENTER,
  MAP_FALLBACK_ZOOM,
  MAP_GPS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_ZOOM_ANIMATION_MS,
  MSG_MISSING_KEY,
  MSG_NETWORK,
  MSG_NOT_FOUND,
  MSG_UNAUTHORIZED,
  SOURCE_IDS,
  LAYER_IDS,
  clampZoom,
  classifyMapStyleFailure as classifyFoMapStyleFailure,
  getActiveStyleId,
  getMapLibrePackageVersion,
  getMapTilerConfigurationIssue,
  getMapTilerKeyDiagnostics,
  getMaskedMapTilerKeyStatus,
  hasMapTilerKey,
  logMapLoadFailure,
  probeMapLibreDemoStyle,
  probeMapTilerStyle,
  getMapTilerStyleUrl as getFoMapTilerStyleUrl,
  type MapStyleMode,
  type StyleProbeResult,
} from './foMapTiler';

export {
  MAP_FALLBACK_CENTER,
  MAP_FALLBACK_ZOOM,
  MAP_GPS_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_ZOOM_ANIMATION_MS,
  SOURCE_IDS as FO_BOUNDARY_SOURCE_IDS,
  LAYER_IDS as FO_BOUNDARY_LAYER_IDS,
  getActiveStyleId,
  getMapLibrePackageVersion,
  getMapTilerConfigurationIssue,
  getMapTilerKeyDiagnostics,
  getMaskedMapTilerKeyStatus,
  logMapLoadFailure,
  probeMapLibreDemoStyle,
  probeMapTilerStyle,
  type MapStyleMode,
  type StyleProbeResult,
};

export const MAP_INITIAL_ZOOM = MAP_FALLBACK_ZOOM;
export const MAPTILER_CONFIG_INCOMPLETE_MESSAGE = MSG_MISSING_KEY;
export const MAPTILER_INVALID_KEY_MESSAGE = MSG_UNAUTHORIZED;
export const MAPTILER_NETWORK_UNAVAILABLE_MESSAGE = MSG_NETWORK;
export const MAPTILER_STYLE_ERROR_MESSAGE = MSG_NOT_FOUND;
/** @deprecated Prefer MAPTILER_CONFIG_INCOMPLETE_MESSAGE */
export const VALID_MAPTILER_KEY_REQUIRED_MESSAGE = MSG_MISSING_KEY;

export const MAP_SOURCE_ID = SOURCE_IDS.polygon;
export const POLYGON_FILL_LAYER_ID = LAYER_IDS.fill;
export const POLYGON_LINE_LAYER_ID = LAYER_IDS.outline;
export const VERTEX_SOURCE_ID = SOURCE_IDS.vertices;
export const VERTEX_LAYER_ID = LAYER_IDS.vertices;

/** Legacy FO naming: satellite === hybrid-v4 */
export type MapTilerStyleMode = 'satellite' | 'street';

export const hasMapTilerApiKey = hasMapTilerKey;
export const clampMapZoom = clampZoom;

export function getGeoapifyApiKey(): string {
  const key = String(process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ?? '').trim();
  return isRealApiKey(key) ? key : '';
}

export function hasGeoapifyApiKey(): boolean {
  return isRealApiKey(process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY);
}

export function mapStyleModeToFo(mode: MapTilerStyleMode): MapStyleMode {
  return mode === 'street' ? 'street' : 'hybrid';
}

export function foStyleModeToApp(mode: MapStyleMode): MapTilerStyleMode {
  return mode === 'street' ? 'street' : 'satellite';
}

export function getMapTilerStyleUrl(mode: MapTilerStyleMode | MapStyleMode = 'satellite'): string | null {
  const foMode: MapStyleMode = mode === 'street' ? 'street' : 'hybrid';
  return getFoMapTilerStyleUrl(foMode);
}

export function getMapTilerHybridStyleId(): string {
  return 'hybrid-v4';
}

export function getMapTilerStreetStyleId(): string {
  return 'streets-v4';
}

export function getMapTilerStyleIdForMode(mode: MapTilerStyleMode): string {
  return mode === 'street' ? getMapTilerStreetStyleId() : getMapTilerHybridStyleId();
}

export function mapStyleModeToApiMapType(mode: MapTilerStyleMode): 'satellite' | 'standard' {
  return mode === 'street' ? 'standard' : 'satellite';
}

export function getMapTilerAuthErrorMessage(): string {
  return MSG_UNAUTHORIZED;
}

export function getMapTilerQuotaErrorMessage(): string {
  return 'MapTiler quota exceeded. Try again later or check the MapTiler account limits.';
}

export function getMapTilerNetworkErrorMessage(): string {
  return MSG_NETWORK;
}

export function getMapTilerStyleErrorMessage(): string {
  return MSG_NOT_FOUND;
}

export function classifyMapStyleFailure(rawMessage?: string | null): {
  kind: 'auth' | 'network' | 'style' | 'unknown';
  message: string;
  allowRetry: boolean;
} {
  return classifyFoMapStyleFailure(rawMessage);
}
