import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { BhuguardMaterialIcon } from '../../shared/BhuguardMaterialIcon';
import { dashboardShadow, dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  buildEsriSatelliteUrl,
  buildEsriStreetMapUrl,
  getMapBoundsForLivePoints,
  pixelsToLatLng,
  polygonCentroid,
  projectPolygonToPixels,
  projectToPixels,
  toSvgPath,
  toSvgPolyline,
  type LatLng,
} from '../../../utils/farmSatelliteMap';

interface EditVertexItem {
  id: string;
  coordinate: LatLng;
}

interface BoundarySatellitePreviewProps {
  points: LatLng[];
  walkingPoints?: LatLng[];
  editVertices?: LatLng[];
  editVertexItems?: EditVertexItem[];
  currentLocation?: LatLng | null;
  areaLabel?: string;
  showPolygon?: boolean;
  showOpenPath?: boolean;
  height?: number;
  followsUser?: boolean;
  isOutsideTolerance?: boolean;
  satelliteMode?: boolean;
  editable?: boolean;
  onCenterGps?: () => void;
  onToggleSatellite?: () => void;
  onVertexDragEnd?: (pointId: string, coordinate: LatLng) => void;
  onVertexLongPress?: (pointId: string) => void;
  onMapPress?: (coordinate: LatLng) => void;
}

const VALID_BORDER = '#0E7A45';
const VALID_FILL = 'rgba(14, 122, 69, 0.30)';
const INVALID_BORDER = '#DC2626';
const INVALID_FILL = 'rgba(220, 38, 38, 0.24)';

export function BoundarySatellitePreview({
  points,
  walkingPoints = [],
  editVertices = [],
  editVertexItems = [],
  currentLocation,
  areaLabel,
  showPolygon = true,
  showOpenPath = false,
  height = 420,
  followsUser = false,
  isOutsideTolerance = false,
  satelliteMode = true,
  editable = false,
  onCenterGps,
  onToggleSatellite,
  onVertexDragEnd,
  onVertexLongPress,
  onMapPress,
}: BoundarySatellitePreviewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const mapWidth = Math.max(windowWidth - dashboardTheme.marginMobile * 2, 280);
  const [tileWarning, setTileWarning] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageKey, setImageKey] = useState(0);
  const [draggingVertexId, setDraggingVertexId] = useState<string | null>(null);
  const [dragPixel, setDragPixel] = useState<{ x: number; y: number } | null>(null);
  const boundsRef = useRef<ReturnType<typeof getMapBoundsForLivePoints> | null>(null);
  const mapSizeRef = useRef({ width: mapWidth, height });

  const strokeColor = isOutsideTolerance ? INVALID_BORDER : VALID_BORDER;
  const fillColor = isOutsideTolerance ? INVALID_FILL : VALID_FILL;
  const pathPoints = showOpenPath ? walkingPoints : points;

  const bounds = useMemo(() => {
    const extras = [...walkingPoints, ...points];

    if (currentLocation) {
      extras.push(currentLocation);
    }

    if (followsUser && currentLocation) {
      const pad = 0.0012;

      return {
        minLat: currentLocation.latitude - pad,
        maxLat: currentLocation.latitude + pad,
        minLng: currentLocation.longitude - pad,
        maxLng: currentLocation.longitude + pad,
      };
    }

    return getMapBoundsForLivePoints(pathPoints, extras);
  }, [currentLocation, followsUser, pathPoints, points, walkingPoints]);

  boundsRef.current = bounds;
  mapSizeRef.current = { width: mapWidth, height };

  const vertexItems = useMemo<EditVertexItem[]>(() => {
    if (editVertexItems.length > 0) {
      return editVertexItems;
    }

    return editVertices.map((coordinate, index) => ({
      id: `vertex-${index}`,
      coordinate,
    }));
  }, [editVertexItems, editVertices]);

  const mapUrl = useMemo(() => {
    const builder = satelliteMode ? buildEsriSatelliteUrl : buildEsriStreetMapUrl;

    return `${builder(bounds, mapWidth, height)}&_=${imageKey}`;
  }, [bounds, height, imageKey, mapWidth, satelliteMode]);

  const pixelPath = useMemo(
    () => projectPolygonToPixels(pathPoints, bounds, mapWidth, height),
    [bounds, height, mapWidth, pathPoints],
  );
  const pixelPolygon = useMemo(
    () => projectPolygonToPixels(points, bounds, mapWidth, height),
    [bounds, height, mapWidth, points],
  );
  const pixelEditVertices = useMemo(
    () => projectPolygonToPixels(editVertices, bounds, mapWidth, height),
    [bounds, editVertices, height, mapWidth],
  );
  const vertexPixels = useMemo(() => {
    return vertexItems.map((item) => {
      if (draggingVertexId === item.id && dragPixel) {
        return { ...item, pixel: dragPixel };
      }

      return {
        ...item,
        pixel: projectToPixels(item.coordinate, bounds, mapWidth, height),
      };
    });
  }, [bounds, dragPixel, draggingVertexId, height, mapWidth, vertexItems]);
  const currentPixel = useMemo(
    () => (currentLocation ? projectToPixels(currentLocation, bounds, mapWidth, height) : null),
    [bounds, currentLocation, height, mapWidth],
  );
  const centroidPixel = useMemo(() => {
    if (points.length < 3) {
      return null;
    }

    return projectToPixels(polygonCentroid(points), bounds, mapWidth, height);
  }, [bounds, height, mapWidth, points]);

  useEffect(() => {
    setImageError(false);
  }, [mapUrl]);

  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
  }, [satelliteMode]);

  useEffect(() => {
    let cancelled = false;

    async function checkConnectivity() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(
          'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
          { method: 'HEAD', signal: controller.signal },
        );
        clearTimeout(timeout);

        if (!cancelled) {
          setTileWarning(!response.ok);
        }
      } catch {
        if (!cancelled) {
          setTileWarning(true);
        }
      }
    }

    void checkConnectivity();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.wrap, { height, width: mapWidth }]}>
      {imageError ? (
        <View style={styles.imageFallback}>
          <BhuguardMaterialIcon name="cloud_off" size={28} color={dashboardTheme.primaryContainer} />
          <Text style={styles.imageFallbackTitle}>Satellite map is unavailable</Text>
          <Text style={styles.imageFallbackBody}>
            Satellite map is temporarily unavailable. Your selected farm and mapping progress are safe.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setImageError(false);
              setImageKey((value) => value + 1);
            }}
          >
            <Text style={styles.retryButtonText}>Retry map</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Image
            source={{ uri: mapUrl }}
            style={[styles.mapImage, { height, width: mapWidth }]}
            resizeMode="cover"
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          {imageLoading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color={dashboardTheme.primaryContainer} />
            </View>
          ) : null}
        </>
      )}

      <Svg width={mapWidth} height={height} style={styles.overlay} pointerEvents="none">
        {showOpenPath && pixelPath.length >= 2 ? (
          <>
            <Path
              d={toSvgPolyline(pixelPath)}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Path
              d={toSvgPolyline(pixelPath)}
              stroke={strokeColor}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        ) : null}

        {showPolygon && pixelPolygon.length >= 3 ? (
          <Path
            d={toSvgPath(pixelPolygon)}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ) : null}

        {currentPixel ? (
          <>
            <Circle cx={currentPixel.x} cy={currentPixel.y} r={10} fill="#FFFFFF" stroke={strokeColor} strokeWidth={2.5} />
            <Circle cx={currentPixel.x} cy={currentPixel.y} r={3.5} fill={strokeColor} />
          </>
        ) : null}

        {showOpenPath && pixelPath[0] ? (
          <Circle cx={pixelPath[0].x} cy={pixelPath[0].y} r={8} fill="#FFFFFF" stroke={strokeColor} strokeWidth={2.5} />
        ) : null}

        {editable && pixelEditVertices.map((point, index) => (
          <Circle
            key={`edit-vertex-${index}`}
            cx={vertexPixels[index]?.pixel.x ?? point.x}
            cy={vertexPixels[index]?.pixel.y ?? point.y}
            r={10}
            fill="#FFFFFF"
            stroke={strokeColor}
            strokeWidth={2.5}
          />
        ))}
      </Svg>

      {editable && onMapPress ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={(event) => {
            if (!boundsRef.current || draggingVertexId) {
              return;
            }

            const { locationX, locationY } = event.nativeEvent;
            const coordinate = pixelsToLatLng(
              { x: locationX, y: locationY },
              boundsRef.current,
              mapSizeRef.current.width,
              mapSizeRef.current.height,
            );
            onMapPress(coordinate);
          }}
        />
      ) : null}

      {editable
        ? vertexPixels.map((item) => (
            <VertexDragHandle
              key={`drag-${item.id}`}
              x={item.pixel.x}
              y={item.pixel.y}
              onDragStart={() => {
                setDraggingVertexId(item.id);
                setDragPixel({ x: item.pixel.x, y: item.pixel.y });
              }}
              onDragMove={(x, y) => {
                setDragPixel({ x, y });
              }}
              onDragEnd={(x, y) => {
                setDraggingVertexId(null);
                setDragPixel(null);

                if (!onVertexDragEnd || !boundsRef.current) {
                  return;
                }

                const coordinate = pixelsToLatLng(
                  { x, y },
                  boundsRef.current,
                  mapSizeRef.current.width,
                  mapSizeRef.current.height,
                );
                onVertexDragEnd(item.id, coordinate);
              }}
              onLongPress={() => onVertexLongPress?.(item.id)}
            />
          ))
        : null}

      {tileWarning ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Satellite map is temporarily unavailable. Your selected farm and mapping progress are safe.
          </Text>
        </View>
      ) : null}

      {areaLabel && showPolygon && centroidPixel ? (
        <View style={[styles.areaLabel, { left: centroidPixel.x - 56, top: centroidPixel.y - 16 }]}>
          <Text style={styles.areaLabelText}>{areaLabel}</Text>
        </View>
      ) : null}

      <View style={styles.satelliteBadge}>
        <BhuguardMaterialIcon name="share_location" size={14} color={dashboardTheme.onPrimary} />
        <Text style={styles.satelliteBadgeText}>{satelliteMode ? 'Satellite' : 'Map'}</Text>
      </View>

      <View style={styles.controls}>
        {onToggleSatellite ? (
          <Pressable style={styles.controlButton} onPress={onToggleSatellite}>
            <Text style={styles.controlButtonText}>{satelliteMode ? 'Map' : 'Satellite'}</Text>
          </Pressable>
        ) : null}
        {onCenterGps ? (
          <Pressable style={styles.controlButton} onPress={onCenterGps}>
            <Text style={styles.controlButtonText}>Center GPS</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface VertexDragHandleProps {
  x: number;
  y: number;
  onDragStart: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onLongPress: () => void;
}

function VertexDragHandle({
  x,
  y,
  onDragStart,
  onDragMove,
  onDragEnd,
  onLongPress,
}: VertexDragHandleProps) {
  const startOffset = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startOffset.current = { x, y };
          onDragStart();
          longPressTimer.current = setTimeout(() => {
            onLongPress();
          }, 600);
        },
        onPanResponderMove: (_, gesture) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }

          onDragMove(startOffset.current.x + gesture.dx, startOffset.current.y + gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }

          onDragEnd(startOffset.current.x + gesture.dx, startOffset.current.y + gesture.dy);
        },
        onPanResponderTerminate: (_, gesture) => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }

          onDragEnd(startOffset.current.x + gesture.dx, startOffset.current.y + gesture.dy);
        },
      }),
    [onDragEnd, onDragMove, onDragStart, onLongPress, x, y],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.vertexHandle,
        {
          left: x - 18,
          top: y - 18,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: dashboardTheme.surfaceLow,
    alignSelf: 'center',
    ...dashboardShadow,
  },
  mapImage: {
    backgroundColor: dashboardTheme.surfaceLow,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 250, 246, 0.35)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  imageFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  imageFallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
    textAlign: 'center',
  },
  imageFallbackBody: {
    fontSize: 13,
    lineHeight: 18,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: dashboardTheme.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  offlineBanner: {
    position: 'absolute',
    top: 44,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(127,29,29,0.92)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineText: {
    color: '#FEF2F2',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  areaLabel: {
    position: 'absolute',
    width: 112,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: dashboardTheme.secondaryContainer,
    alignItems: 'center',
  },
  areaLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  satelliteBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  satelliteBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.onPrimary,
  },
  controls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
    alignItems: 'flex-end',
  },
  controlButton: {
    minWidth: 42,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  vertexHandle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    zIndex: 20,
  },
});
