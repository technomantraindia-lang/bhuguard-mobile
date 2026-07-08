import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { AddManualCoordinateModal } from '../../../components/farmer/boundary/AddManualCoordinateModal';
import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { BoundaryLiveMap } from '../../../components/farmer/boundary/BoundaryLiveMap';
import { CapturedPointsBottomSheet } from '../../../components/farmer/boundary/CapturedPointsBottomSheet';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  AUTO_CAPTURE_DISTANCE_METERS,
  AUTO_CAPTURE_INTERVAL_MS,
  MAX_ACCEPTABLE_GPS_ACCURACY_METERS,
  MIN_BOUNDARY_POINTS,
  MIN_POINT_DISTANCE_METERS,
  boundaryPointsToLatLng,
  findNearestEdgeInsertion,
  haversineMeters,
  hasSelfIntersection,
} from '../../../utils/boundaryGeometry';
import { getBoundaryFlowRoutes } from '../../../utils/boundaryFlowRoutes';
import { boundaryRouteParams } from '../../../utils/boundaryNavigation';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundaryCapture'>;

export function FarmBoundaryCaptureScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const lastAutoCaptureAt = useRef(0);
  const lastAutoCoord = useRef<{ latitude: number; longitude: number } | null>(null);

  const isRecording = boundary.mappingStatus === 'recording';
  const isPaused = boundary.mappingStatus === 'paused';
  const isEditing = boundary.mappingStatus === 'editing' || boundary.mappingStatus === 'completed';
  const canCapture = isRecording;

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    const {
      setCurrentLocation,
      setPoorAccuracyWarning,
      addPoint,
      points,
      mappingStatus,
    } = boundary;

    async function watch() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      if (mappingStatus === 'paused') {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 2,
          timeInterval: 2000,
        },
        (position) => {
          const { latitude, longitude, accuracy, altitude } = position.coords;
          const acc = accuracy ?? 20;
          setCurrentLocation(latitude, longitude, acc, altitude ?? null);

          if (mappingStatus !== 'recording') {
            return;
          }

          if (acc > MAX_ACCEPTABLE_GPS_ACCURACY_METERS) {
            setPoorAccuracyWarning(true);
            return;
          }

          const now = Date.now();
          const last = lastAutoCoord.current ?? points[points.length - 1];
          const moved = last
            ? haversineMeters(last.latitude, last.longitude, latitude, longitude)
            : Number.POSITIVE_INFINITY;
          const elapsed = now - lastAutoCaptureAt.current;
          const shouldCaptureByDistance = moved >= AUTO_CAPTURE_DISTANCE_METERS;
          const shouldCaptureByTime = moved >= 1 && elapsed >= AUTO_CAPTURE_INTERVAL_MS;

          if (!shouldCaptureByDistance && !shouldCaptureByTime && points.length > 0) {
            return;
          }

          if (last && moved < MIN_POINT_DISTANCE_METERS && points.length > 0) {
            return;
          }

          addPoint({
            latitude,
            longitude,
            accuracy: acc,
            altitude: altitude ?? null,
            timestamp: new Date().toISOString(),
          });
          lastAutoCaptureAt.current = now;
          lastAutoCoord.current = { latitude, longitude };
        },
      );
    }

    void watch();

    return () => {
      subscription?.remove();
    };
  }, [
    boundary.mappingStatus,
    boundary.addPoint,
    boundary.setCurrentLocation,
    boundary.setPoorAccuracyWarning,
    boundary.points.length,
  ]);

  const addManualOrCurrentPoint = async (forcePoorAccuracy = false) => {
    if (!canCapture) {
      Alert.alert('Start mapping', 'Tap Start Walking Mapping before capturing points.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
    const { latitude, longitude, accuracy, altitude } = position.coords;
    const acc = accuracy ?? 20;

    if (acc > MAX_ACCEPTABLE_GPS_ACCURACY_METERS && !forcePoorAccuracy) {
      Alert.alert(
        'Poor GPS accuracy',
        'GPS accuracy is over 30m. Wait for a better signal, or capture this point manually anyway?',
        [
          { text: 'Wait', style: 'cancel' },
          { text: 'Capture anyway', onPress: () => void addManualOrCurrentPoint(true) },
        ],
      );
      return;
    }

    const last = boundary.points[boundary.points.length - 1];
    if (last && haversineMeters(last.latitude, last.longitude, latitude, longitude) < MIN_POINT_DISTANCE_METERS) {
      Alert.alert('Points too close', 'Walk a little further before capturing the next boundary point.');
      return;
    }

    boundary.addPoint({
      latitude,
      longitude,
      accuracy: acc,
      altitude: altitude ?? null,
      timestamp: new Date().toISOString(),
      manual: true,
    });
    lastAutoCaptureAt.current = Date.now();
    lastAutoCoord.current = { latitude, longitude };
    boundary.setCurrentLocation(latitude, longitude, acc, altitude ?? null);
  };

  const finishBoundary = () => {
    if (boundary.points.length < MIN_BOUNDARY_POINTS) {
      Alert.alert('More points required', `Capture at least ${MIN_BOUNDARY_POINTS} boundary points.`);
      return;
    }

    const polygon = boundaryPointsToLatLng(boundary.points);

    if (hasSelfIntersection(polygon)) {
      Alert.alert('Invalid boundary', 'Boundary lines intersect. Adjust points before finishing.');
      return;
    }

    const first = boundary.points[0];
    const last = boundary.points[boundary.points.length - 1];
    const closingDistance = haversineMeters(first.latitude, first.longitude, last.latitude, last.longitude);

    if (closingDistance > 25) {
      Alert.alert(
        'Boundary not closed',
        'Your last point is far from the start. Continue walking to close the farm boundary.',
      );
      return;
    }

    boundary.finishBoundaryMapping();
  };

  const continueToPreview = () => {
    if (boundary.isOutsideTolerance) {
      Alert.alert(
        'Boundary outside farm area',
        'Boundary moved outside expected farm area. Please adjust within field boundary.',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Continue anyway',
            style: 'destructive',
            onPress: () => {
              const routes = getBoundaryFlowRoutes(boundary.sessionMode);
              navigation.navigate(
                routes.preview as 'FarmBoundaryPreview',
                boundaryRouteParams(boundary.farmId ?? undefined),
              );
            },
          },
        ],
      );
      return;
    }

    const routes = getBoundaryFlowRoutes(boundary.sessionMode);
    navigation.navigate(
      routes.preview as 'FarmBoundaryPreview',
      boundaryRouteParams(boundary.farmId ?? undefined),
    );
  };

  const currentLocation =
    boundary.currentLatitude !== null && boundary.currentLongitude !== null
      ? { latitude: boundary.currentLatitude, longitude: boundary.currentLongitude }
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="Capture Boundary" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>Farm: {boundary.farmName}</Text>
          <Text style={styles.topMeta}>Status: {boundary.mappingStatusLabel}</Text>
          <Text style={styles.topMeta}>GPS Accuracy: {boundary.gpsAccuracyLabel}
            {boundary.currentAccuracy != null ? ` (${Math.round(boundary.currentAccuracy)}m)` : ''}
          </Text>
          <Text style={styles.topMeta}>Captured Points: {boundary.points.length}</Text>
          <Text style={styles.topArea}>
            Area: {boundary.points.length >= 3 ? `${boundary.areaLabel} · ${boundary.metrics.areaHectare.toFixed(2)} ha` : '—'}
          </Text>
          {boundary.points.length >= 3 ? (
            <Text style={styles.topMeta}>
              Sq ft: {Math.round(boundary.metrics.areaAcre * 43560).toLocaleString()}
            </Text>
          ) : null}
          {boundary.poorAccuracyWarning ? (
            <Text style={styles.warning}>GPS accuracy is poor (&gt;30m). Auto-capture paused until signal improves.</Text>
          ) : null}
          {boundary.isOutsideTolerance ? (
            <Text style={styles.warning}>
              Boundary moved outside expected farm area. Please adjust within field boundary.
            </Text>
          ) : null}
        </View>

        <View style={styles.mapWrap}>
          <BoundaryLiveMap
            points={boundary.points}
            walkingPoints={boundary.walkingPoints}
            currentLocation={currentLocation}
            areaLabel={boundary.areaLabel}
            showPolygon={isEditing && boundary.points.length >= 3}
            height={430}
            editable={isEditing}
            followsUser={isRecording}
            isOutsideTolerance={boundary.isOutsideTolerance}
            satelliteMode={boundary.satelliteMode}
            onToggleSatellite={boundary.toggleSatelliteMode}
            onCenterGps={async () => {
              const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
              });
              boundary.setCurrentLocation(
                position.coords.latitude,
                position.coords.longitude,
                position.coords.accuracy ?? 8,
                position.coords.altitude ?? null,
              );
            }}
            onVertexDragEnd={(id, coordinate) => boundary.updatePointCoordinate(id, coordinate)}
            onVertexLongPress={(id) => {
              if (boundary.points.length <= MIN_BOUNDARY_POINTS) {
                Alert.alert('Cannot delete', 'At least 3 points are required.');
                return;
              }

              Alert.alert('Delete point?', 'Remove this boundary vertex?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => boundary.removePoint(id) },
              ]);
            }}
            onMapPress={(coordinate) => {
              if (!isEditing) {
                return;
              }

              const insertion = findNearestEdgeInsertion(coordinate, boundary.points);
              if (!insertion) {
                return;
              }

              boundary.insertPointAfter(insertion.insertAfterIndex, {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                accuracy: boundary.currentAccuracy ?? 10,
                altitude: boundary.currentAltitude,
                timestamp: new Date().toISOString(),
                manual: true,
              });
            }}
          />
        </View>

        <View style={styles.actions}>
          {boundary.mappingStatus === 'not_started' ? (
            <Pressable style={styles.primaryButton} onPress={boundary.startWalkingMapping}>
              <Text style={styles.primaryButtonText}>Start Walking Mapping</Text>
            </Pressable>
          ) : null}

          {isRecording || isPaused ? (
            <>
              <Pressable style={styles.primaryButton} onPress={() => void addManualOrCurrentPoint()}>
                <Text style={styles.primaryButtonText}>Capture Point</Text>
              </Pressable>
              <View style={styles.row}>
                <SecondaryButton
                  label={isPaused ? 'Resume Mapping' : 'Pause Mapping'}
                  onPress={isPaused ? boundary.resumeMapping : boundary.pauseMapping}
                />
                <SecondaryButton label="Finish Boundary" onPress={finishBoundary} />
              </View>
              <View style={styles.row}>
                <SecondaryButton label="Undo Last Point" onPress={boundary.undoLastPoint} />
                <SecondaryButton
                  label="Reset Boundary"
                  onPress={() =>
                    Alert.alert('Reset boundary?', 'Remove all captured points?', [
                      { text: 'Cancel' },
                      { text: 'Reset', style: 'destructive', onPress: boundary.resetBoundary },
                    ])
                  }
                />
              </View>
            </>
          ) : null}

          {isEditing ? (
            <>
              <Pressable style={styles.primaryButton} onPress={continueToPreview}>
                <Text style={styles.primaryButtonText}>Save & Review Boundary</Text>
              </Pressable>
              <View style={styles.row}>
                <SecondaryButton
                  label="Resume Walking"
                  onPress={() => {
                    boundary.startWalkingMapping();
                  }}
                />
                <SecondaryButton
                  label="Reset Boundary"
                  onPress={() =>
                    Alert.alert('Reset boundary?', 'Remove all captured points?', [
                      { text: 'Cancel' },
                      { text: 'Reset', style: 'destructive', onPress: boundary.resetBoundary },
                    ])
                  }
                />
              </View>
              <Text style={styles.hint}>
                Drag vertices to edit. Tap near an edge to add a point. Tap a vertex to delete.
              </Text>
            </>
          ) : null}

          <Pressable style={styles.linkButton} onPress={() => setSheetOpen(true)}>
            <Text style={styles.linkButtonText}>View Captured Points ({boundary.points.length})</Text>
          </Pressable>
        </View>
      </ScrollView>

      <CapturedPointsBottomSheet
        visible={sheetOpen}
        points={boundary.points}
        onClose={() => setSheetOpen(false)}
        onDeletePoint={boundary.removePoint}
        onAddManual={() => {
          setSheetOpen(false);
          setManualOpen(true);
        }}
      />

      <AddManualCoordinateModal
        visible={manualOpen}
        onClose={() => setManualOpen(false)}
        onAdd={(payload) =>
          boundary.addPoint({
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: 5,
            altitude: null,
            timestamp: new Date().toISOString(),
            label: payload.label,
            notes: payload.notes,
            manual: true,
          })
        }
      />
    </SafeAreaView>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  scroll: { paddingBottom: 32 },
  topCard: {
    marginHorizontal: dashboardTheme.marginMobile,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 2,
  },
  topTitle: { fontSize: 15, fontWeight: '700', color: dashboardTheme.headingGreen },
  topMeta: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
  topArea: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer, marginTop: 2 },
  warning: { marginTop: 6, fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  mapWrap: { paddingHorizontal: dashboardTheme.marginMobile, paddingTop: 10 },
  actions: { padding: dashboardTheme.marginMobile, gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  secondaryButtonText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer, textAlign: 'center' },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
  hint: { fontSize: 12, color: dashboardTheme.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
});
