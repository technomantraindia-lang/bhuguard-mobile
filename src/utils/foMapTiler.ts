export type MapStyleMode = 'hybrid' | 'street';

export const MAP_FALLBACK_CENTER: [number, number] = [73.19806, 22.22217];
export const MAP_FALLBACK_ZOOM = 16.1;
export const MAP_MIN_ZOOM = 3;
export const MAP_MAX_ZOOM = 18;
export const MAP_GPS_ZOOM = 17;
export const MAP_ZOOM_ANIMATION_MS = 280;

export const SOURCE_IDS = {
  polygon: 'farm-boundary-source',
  line: 'farm-boundary-line-source',
  vertices: 'farm-boundary-vertices',
} as const;

export const LAYER_IDS = {
  fill: 'farm-boundary-fill',
  outline: 'farm-boundary-line',
  drawLine: 'farm-boundary-draw-line',
  vertices: 'farm-boundary-vertex-circles',
} as const;

export const MSG_MISSING_KEY = 'MapTiler API key is missing.';
export const MSG_UNAUTHORIZED = 'MapTiler key is invalid or restricted.';
export const MSG_NOT_FOUND = 'Hybrid map style was not found.';
export const MSG_NETWORK = 'Unable to reach MapTiler.';

const PLACEHOLDER_KEYS = new Set([
  '',
  'your_maptiler_api_key_here',
  'paste_the_real_provided_maptiler_key',
  'maptiler_key',
  'undefined',
  'null',
  'placeholder',
]);

function readMapTilerKey(): string {
  const rawKey = process.env.EXPO_PUBLIC_MAPTILER_API_KEY;
  const mapTilerKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  return mapTilerKey;
}

export function hasMapTilerKey(): boolean {
  const key = readMapTilerKey();
  if (!key) {
    return false;
  }
  const lower = key.toLowerCase();
  if (PLACEHOLDER_KEYS.has(lower)) {
    return false;
  }
  if (lower.includes('your_') || lower.includes('paste_') || lower.includes('placeholder')) {
    return false;
  }
  return true;
}

export function getMaskedMapTilerKeyStatus(): string {
  const key = readMapTilerKey();
  if (!key) {
    return 'missing';
  }
  if (!hasMapTilerKey()) {
    return 'placeholder';
  }
  if (key.length <= 8) {
    return '****';
  }
  return `${key.slice(0, 4)}…${key.slice(-4)} (len=${key.length})`;
}

export function getMapTilerKeyDiagnostics(): { keyPresent: boolean; keyLength: number } {
  const key = readMapTilerKey();
  return {
    keyPresent: hasMapTilerKey(),
    keyLength: key.length,
  };
}

export function getMapLibrePackageVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('@maplibre/maplibre-react-native/package.json') as { version?: string };
    return typeof pkg.version === 'string' ? pkg.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function getMapTilerConfigurationIssue(): string | null {
  return hasMapTilerKey() ? null : MSG_MISSING_KEY;
}

function readStyleId(envKey: string, fallback: string): string {
  const raw = process.env[envKey];
  const value = typeof raw === 'string' ? raw.trim() : '';
  return value || fallback;
}

/**
 * MapTiler style JSON URLs used by MapLibre (hybrid-v4 / streets-v4).
 * Style IDs come from EXPO_PUBLIC_MAPTILER_*_STYLE_ID when set.
 */
export function getMapTilerStyleUrl(mode: MapStyleMode = 'hybrid'): string | null {
  if (!hasMapTilerKey()) {
    return null;
  }

  const rawKey = process.env.EXPO_PUBLIC_MAPTILER_API_KEY;
  const mapTilerKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  const styleId = getActiveStyleId(mode);

  return `https://api.maptiler.com/maps/${styleId}/style.json?key=${encodeURIComponent(mapTilerKey)}`;
}

export function getActiveStyleId(mode: MapStyleMode): string {
  if (mode === 'street') {
    return readStyleId('EXPO_PUBLIC_MAPTILER_STREET_STYLE_ID', 'streets-v4');
  }
  return readStyleId(
    'EXPO_PUBLIC_MAPTILER_HYBRID_STYLE_ID',
    readStyleId('EXPO_PUBLIC_MAPTILER_STYLE_ID', 'hybrid-v4'),
  );
}

export const MAPLIBRE_DEMO_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

export type StyleProbeResult =
  | { ok: true; styleUrl: string; styleId: string; status: number }
  | { ok: false; message: string; styleId: string; status: number | null; allowRetry: boolean };

function logStyleProbe(details: {
  keyPresent: boolean;
  keyLength: number;
  status: number | null;
  mapLibreVersion: string;
  mapLoadError?: string | null;
}): void {
  if (__DEV__) {
    console.info('[BhuguardFOMap] styleProbe', {
      keyPresent: details.keyPresent,
      keyLength: details.keyLength,
      status: details.status,
      mapLibreVersion: details.mapLibreVersion,
      mapLoadError: details.mapLoadError ?? null,
    });
  }
}

/**
 * One controlled diagnostic GET against the MapTiler style URL before MapLibre mounts.
 */
export async function probeMapTilerStyle(mode: MapStyleMode): Promise<StyleProbeResult> {
  const styleUrl = getMapTilerStyleUrl(mode);
  const styleId = getActiveStyleId(mode);
  const keyDiag = getMapTilerKeyDiagnostics();
  const mapLibreVersion = getMapLibrePackageVersion();

  if (!styleUrl) {
    logStyleProbe({
      ...keyDiag,
      status: null,
      mapLibreVersion,
      mapLoadError: MSG_MISSING_KEY,
    });
    return {
      ok: false,
      message: MSG_MISSING_KEY,
      styleId,
      status: null,
      allowRetry: false,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(styleUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const bodyText = await response.text();

    if (response.status === 401 || response.status === 403) {
      logStyleProbe({
        ...keyDiag,
        status: response.status,
        mapLibreVersion,
        mapLoadError: MSG_UNAUTHORIZED,
      });
      return {
        ok: false,
        message: MSG_UNAUTHORIZED,
        styleId,
        status: response.status,
        allowRetry: false,
      };
    }

    if (response.status === 404) {
      logStyleProbe({
        ...keyDiag,
        status: response.status,
        mapLibreVersion,
        mapLoadError: MSG_NOT_FOUND,
      });
      return {
        ok: false,
        message: MSG_NOT_FOUND,
        styleId,
        status: response.status,
        allowRetry: true,
      };
    }

    if (!response.ok) {
      const message = `MapTiler returned HTTP ${response.status}.`;
      logStyleProbe({
        ...keyDiag,
        status: response.status,
        mapLibreVersion,
        mapLoadError: message,
      });
      return {
        ok: false,
        message,
        styleId,
        status: response.status,
        allowRetry: true,
      };
    }

    try {
      const parsed = JSON.parse(bodyText) as { version?: number };
      if (typeof parsed?.version !== 'number') {
        const message = 'MapTiler style JSON is invalid.';
        logStyleProbe({
          ...keyDiag,
          status: response.status,
          mapLibreVersion,
          mapLoadError: message,
        });
        return {
          ok: false,
          message,
          styleId,
          status: response.status,
          allowRetry: true,
        };
      }
    } catch {
      const message = 'MapTiler style JSON could not be parsed.';
      logStyleProbe({
        ...keyDiag,
        status: response.status,
        mapLibreVersion,
        mapLoadError: message,
      });
      return {
        ok: false,
        message,
        styleId,
        status: response.status,
        allowRetry: true,
      };
    }

    logStyleProbe({
      ...keyDiag,
      status: response.status,
      mapLibreVersion,
      mapLoadError: null,
    });

    return { ok: true, styleUrl, styleId, status: response.status };
  } catch (error) {
    const text = String(error instanceof Error ? error.message : error).toLowerCase();
    logStyleProbe({
      ...keyDiag,
      status: null,
      mapLibreVersion,
      mapLoadError: MSG_NETWORK,
    });

    if (text.includes('abort') || text.includes('timeout')) {
      return {
        ok: false,
        message: MSG_NETWORK,
        styleId,
        status: null,
        allowRetry: true,
      };
    }

    return {
      ok: false,
      message: MSG_NETWORK,
      styleId,
      status: null,
      allowRetry: true,
    };
  }
}

export async function probeMapLibreDemoStyle(): Promise<{
  ok: boolean;
  status: number | null;
  message: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(MAPLIBRE_DEMO_STYLE_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        message: `Demo style HTTP ${response.status}`,
      };
    }

    return { ok: true, status: response.status, message: 'Demo style reachable' };
  } catch {
    return { ok: false, status: null, message: 'Unable to reach MapLibre demo tiles.' };
  }
}

export function clampZoom(zoom: number): number {
  return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, zoom));
}

export function classifyMapStyleFailure(rawMessage?: string | null): {
  kind: 'auth' | 'network' | 'style' | 'unknown';
  message: string;
  allowRetry: boolean;
} {
  const text = String(rawMessage ?? '').toLowerCase();

  if (
    text.includes('401')
    || text.includes('403')
    || text.includes('unauthorized')
    || text.includes('forbidden')
    || text.includes('invalid key')
    || text.includes('api key')
    || text.includes('restricted')
  ) {
    return { kind: 'auth', message: MSG_UNAUTHORIZED, allowRetry: false };
  }

  if (
    text.includes('404')
    || text.includes('not found')
  ) {
    return { kind: 'style', message: MSG_NOT_FOUND, allowRetry: true };
  }

  if (
    text.includes('network')
    || text.includes('timeout')
    || text.includes('offline')
    || text.includes('failed to connect')
    || text.includes('unreachable')
  ) {
    return { kind: 'network', message: MSG_NETWORK, allowRetry: true };
  }

  return { kind: 'unknown', message: MSG_NETWORK, allowRetry: true };
}

export function logMapLoadFailure(message: string, status: number | null = null): void {
  const keyDiag = getMapTilerKeyDiagnostics();
  logStyleProbe({
    ...keyDiag,
    status,
    mapLibreVersion: getMapLibrePackageVersion(),
    mapLoadError: message,
  });
}
