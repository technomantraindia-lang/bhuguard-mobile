import {
  MapLibreManualBoundaryMap,
  type ManualBoundaryMapProps,
} from './MapLibreManualBoundaryMap';

export type { ManualBoundaryMapFitPadding, ManualBoundaryMapProps } from './MapLibreManualBoundaryMap';

/**
 * Field Officer farm boundary map.
 * Always uses MapLibre + MapTiler Hybrid (`hybrid-v4`) / Street (`streets-v4`).
 * Google Maps / react-native-maps is not used on this screen.
 */
export function ManualBoundaryMap(props: ManualBoundaryMapProps) {
  return <MapLibreManualBoundaryMap {...props} />;
}
