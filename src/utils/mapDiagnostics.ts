import * as Location from 'expo-location';
import { Platform } from 'react-native';

import {
  USE_NATIVE_MAPS,
} from './mapConfig';
import { getNativeMapsModule, hasNativeMapsRuntime, isNativeMapsAvailable } from './nativeMaps';

export interface MapDiagnosticsSnapshot {
  nativeMapsFlag: boolean;
  apiKeyPresent: boolean;
  locationPermission: string;
  nativeProviderAvailable: boolean;
  nativeRuntimeDetected: boolean;
  platform: string;
  errorMessage: string | null;
}

export async function collectMapDiagnostics(errorMessage: string | null = null): Promise<MapDiagnosticsSnapshot> {
  let locationPermission = 'unknown';

  try {
    const permission = await Location.getForegroundPermissionsAsync();
    locationPermission = permission.granted ? 'granted' : permission.canAskAgain ? 'denied' : 'blocked';
  } catch {
    locationPermission = 'unavailable';
  }

  return {
    nativeMapsFlag: USE_NATIVE_MAPS,
    apiKeyPresent: false,
    locationPermission,
    nativeProviderAvailable: isNativeMapsAvailable() && getNativeMapsModule() !== null,
    nativeRuntimeDetected: hasNativeMapsRuntime(),
    platform: Platform.OS,
    errorMessage,
  };
}

export function getMapDiagnosticsSummary(diagnostics: MapDiagnosticsSnapshot): string | null {
  if (!diagnostics.nativeMapsFlag) {
    return 'Native Google maps are disabled. Bhuguard map screens use MapLibre / MapTiler.';
  }

  if (!diagnostics.nativeRuntimeDetected) {
    return 'Native Google maps are not available in this build. Use the MapLibre / MapTiler map screens.';
  }

  if (!diagnostics.nativeProviderAvailable) {
    return 'Native Google map provider is unavailable in this build.';
  }

  return diagnostics.errorMessage;
}
