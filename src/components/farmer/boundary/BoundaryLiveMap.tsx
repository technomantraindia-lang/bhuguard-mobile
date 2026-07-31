import { useMemo } from 'react';

import { BoundarySatellitePreview } from './BoundarySatellitePreview';
import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import { boundaryPointsToLatLng } from '../../../utils/boundaryGeometry';
import type { LatLng } from '../../../utils/farmSatelliteMap';

interface BoundaryLiveMapProps {
  points: BoundaryPoint[];
  walkingPoints?: BoundaryPoint[];
  currentLocation?: LatLng | null;
  areaLabel?: string;
  showPolygon?: boolean;
  showOpenPath?: boolean;
  showEditVertices?: boolean;
  editVertices?: BoundaryPoint[];
  height?: number;
  width?: number;
  onCenterGps?: () => void;
  onToggleSatellite?: () => void;
  satelliteMode?: boolean;
  editable?: boolean;
  followsUser?: boolean;
  isOutsideTolerance?: boolean;
  onVertexDragEnd?: (pointId: string, coordinate: LatLng) => void;
  onVertexLongPress?: (pointId: string) => void;
  onMapPress?: (coordinate: LatLng) => void;
}

export function BoundaryLiveMap({
  points,
  walkingPoints = [],
  currentLocation,
  areaLabel,
  showPolygon = true,
  showOpenPath = false,
  showEditVertices = false,
  editVertices,
  height = 420,
  onCenterGps,
  onToggleSatellite,
  satelliteMode = true,
  editable = false,
  followsUser = false,
  isOutsideTolerance = false,
  onVertexDragEnd,
  onVertexLongPress,
  onMapPress,
}: BoundaryLiveMapProps) {
  const polygonCoords = useMemo(() => boundaryPointsToLatLng(points), [points]);
  const walkingCoords = useMemo(() => boundaryPointsToLatLng(walkingPoints), [walkingPoints]);
  const vertexCoords = useMemo(
    () => boundaryPointsToLatLng(editVertices ?? points),
    [editVertices, points],
  );
  const editVertexItems = useMemo(
    () =>
      (editVertices ?? points).map((point) => ({
        id: point.id,
        coordinate: { latitude: point.latitude, longitude: point.longitude },
      })),
    [editVertices, points],
  );

  return (
    <BoundarySatellitePreview
      points={polygonCoords}
      walkingPoints={walkingCoords}
      editVertices={showEditVertices ? vertexCoords : []}
      editVertexItems={showEditVertices ? editVertexItems : []}
      currentLocation={currentLocation}
      areaLabel={areaLabel}
      showPolygon={showPolygon}
      showOpenPath={showOpenPath}
      height={height}
      followsUser={followsUser}
      isOutsideTolerance={isOutsideTolerance}
      satelliteMode={satelliteMode}
      onToggleSatellite={onToggleSatellite}
      onCenterGps={onCenterGps}
      editable={editable}
      onVertexLongPress={onVertexLongPress}
      onMapPress={onMapPress}
      onVertexDragEnd={onVertexDragEnd}
    />
  );
}
