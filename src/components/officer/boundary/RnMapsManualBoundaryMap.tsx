import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { ManualBoundaryMapProps } from './MapLibreManualBoundaryMap';
import { BoundaryLiveMap } from '../../farmer/boundary/BoundaryLiveMap';

/**
 * Compatibility wrapper for older imports.
 * Google Maps / react-native-maps is intentionally not rendered in Bhuguard.
 */
export function RnMapsManualBoundaryMap({
  points,
  currentLocation = null,
  phase,
  showPolygon,
  mapStyleMode = 'satellite',
  onMapStyleModeChange,
  onMapPress,
  onSelectVertex,
  onCenterGps,
  onMapUsableChange,
  followGps = false,
  height = 'flex',
}: ManualBoundaryMapProps) {
  const { height: windowHeight } = useWindowDimensions();
  const resolvedHeight = height === 'flex' ? Math.max(280, Math.round(windowHeight * 0.45)) : height;

  useEffect(() => {
    onMapUsableChange?.(true);
  }, [onMapUsableChange]);

  return (
    <View style={[styles.mapShell, height === 'flex' ? styles.flexMap : { height }]}>
      <BoundaryLiveMap
        points={points}
        currentLocation={currentLocation}
        showPolygon={showPolygon && (phase === 'completed' || phase === 'editing' || points.length >= 3)}
        showOpenPath={phase === 'drawing' && points.length >= 1}
        showEditVertices={phase === 'editing' || phase === 'drawing'}
        height={resolvedHeight}
        followsUser={followGps}
        satelliteMode={mapStyleMode === 'satellite'}
        editable={phase === 'drawing' || phase === 'editing'}
        onCenterGps={onCenterGps}
        onToggleSatellite={
          onMapStyleModeChange
            ? () => onMapStyleModeChange(mapStyleMode === 'satellite' ? 'street' : 'satellite')
            : undefined
        }
        onMapPress={phase === 'drawing' ? onMapPress : undefined}
        onVertexLongPress={phase === 'editing' ? onSelectVertex : undefined}
      />
      {phase === 'drawing' ? (
        <View style={styles.drawingBanner} pointerEvents="none">
          <Text style={styles.drawingBannerText}>Drawing Mode Active - Points: {points.length}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapShell: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0B1F14',
    borderRadius: 0,
  },
  flexMap: {
    flex: 1,
    minHeight: 280,
  },
  drawingBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 72,
    backgroundColor: 'rgba(14,122,69,0.92)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  drawingBannerText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
