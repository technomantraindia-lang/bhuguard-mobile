import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { BoundaryLiveMap } from '../../../components/farmer/boundary/BoundaryLiveMap';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useBoundaryMapType } from '../../../hooks/useBoundaryMapType';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import {
  AUTO_CAPTURE_REJECT_ACCURACY_METERS,
  MIN_BOUNDARY_POINTS,
  POOR_GPS_WARNING_METERS,
  boundaryPointsToLatLng,
  findNearestEdgeInsertion,
  haversineMeters,
  hasSelfIntersection,
  simplifyBoundaryPointsForEdit,
} from '../../../utils/boundaryGeometry';
import {
  type AutoCaptureState,
  collectBestGpsSample,
  getClosingDistanceThreshold,
  shouldAutoCaptureGpsPoint,
} from '../../../utils/boundaryGpsTracking';
import { getBoundaryFlowRoutes } from '../../../utils/boundaryFlowRoutes';
import { boundaryRouteParams } from '../../../utils/boundaryNavigation';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundaryCapture'>;

export function FarmBoundaryCaptureScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const { isSatellite, toggleMapType, restoreMapType } = useBoundaryMapType();
  const [startingGps, setStartingGps] = useState(false);
  const autoCaptureState = useRef<AutoCaptureState>({ lastCaptureAt: 0, lastCaptureCoord: null });

  useFocusEffect(
    useCallback(() => {
      void restoreMapType();
    }, [restoreMapType]),
  );

  const isRecording = boundary.mappingStatus === 'recording';
  const isPaused = boundary.mappingStatus === 'paused';
  const isCompleted =
    boundary.mappingStatus === 'completed' || boundary.mappingStatus === 'editing';
  const isMappingActive = isRecording || isPaused;
  const showFilledPolygon = isCompleted && boundary.points.length >= MIN_BOUNDARY_POINTS;

  const confirmLeave = useCallback(() => {
    if (!isMappingActive) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Leave boundary mapping?',
      'Boundary mapping is still in progress. Leaving now may discard the current path.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [isMappingActive, navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!isMappingActive) {
        return;
      }

      event.preventDefault();
      confirmLeave();
    });

    return unsubscribe;
  }, [confirmLeave, isMappingActive, navigation]);

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

      if (mappingStatus === 'paused' || mappingStatus === 'not_started' || mappingStatus === 'completed') {
        if (mappingStatus === 'not_started' || mappingStatus === 'completed') {
          try {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.BestForNavigation,
            });
            setCurrentLocation(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy ?? 20,
              position.coords.altitude ?? null,
            );
          } catch {
            // Ignore preview GPS failures.
          }
        }

        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 1,
          timeInterval: 1500,
        },
        (position) => {
          const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
          const acc = accuracy ?? 20;
          const sample = {
            latitude,
            longitude,
            accuracy: acc,
            altitude: altitude ?? null,
            heading: heading ?? null,
            speed: speed ?? null,
            timestamp: new Date().toISOString(),
          };

          setCurrentLocation(latitude, longitude, acc, altitude ?? null);
          setPoorAccuracyWarning(acc > POOR_GPS_WARNING_METERS);

          if (mappingStatus !== 'recording') {
            return;
          }

          if (!shouldAutoCaptureGpsPoint(sample, points, autoCaptureState.current)) {
            return;
          }

          addPoint({
            latitude,
            longitude,
            accuracy: acc,
            altitude: altitude ?? null,
            timestamp: sample.timestamp,
          });
          autoCaptureState.current = {
            lastCaptureAt: Date.now(),
            lastCaptureCoord: { latitude, longitude },
          };
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

  const handleStartPoint = async () => {
    setStartingGps(true);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Location required', 'Allow location access to start boundary mapping.');
        return;
      }

      const best = await collectBestGpsSample(async () => {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? 20,
          altitude: position.coords.altitude ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: new Date().toISOString(),
        };
      });

      if (!best) {
        Alert.alert('GPS unavailable', 'Could not get a GPS fix. Move to an open area and try again.');
        return;
      }

      if (best.accuracy > POOR_GPS_WARNING_METERS) {
        Alert.alert(
          'Low GPS accuracy',
          'GPS accuracy is currently low. Move to an open area and wait for a better signal.',
          [
            { text: 'Retry', onPress: () => void handleStartPoint() },
            {
              text: 'Start anyway',
              onPress: () => {
                boundary.startBoundaryWithPoint({
                  latitude: best.latitude,
                  longitude: best.longitude,
                  accuracy: best.accuracy,
                  altitude: best.altitude ?? null,
                  timestamp: best.timestamp,
                });
                autoCaptureState.current = {
                  lastCaptureAt: Date.now(),
                  lastCaptureCoord: { latitude: best.latitude, longitude: best.longitude },
                };
              },
            },
          ],
        );
        return;
      }

      boundary.startBoundaryWithPoint({
        latitude: best.latitude,
        longitude: best.longitude,
        accuracy: best.accuracy,
        altitude: best.altitude ?? null,
        timestamp: best.timestamp,
      });
      autoCaptureState.current = {
        lastCaptureAt: Date.now(),
        lastCaptureCoord: { latitude: best.latitude, longitude: best.longitude },
      };
      boundary.setCurrentLocation(best.latitude, best.longitude, best.accuracy, best.altitude ?? null);
    } finally {
      setStartingGps(false);
    }
  };

  const handleEndPoint = async () => {
    if (boundary.points.length < MIN_BOUNDARY_POINTS) {
      Alert.alert('Keep walking', 'Walk further around the farm boundary before ending.');
      return;
    }

    const polygon = boundaryPointsToLatLng(boundary.points);
    if (hasSelfIntersection(polygon)) {
      Alert.alert('Boundary validation failed', 'Boundary validation failed. Please review the mapped path.');
      return;
    }

    const first = boundary.points[0];
    const last = boundary.points[boundary.points.length - 1];
    const closingDistance = haversineMeters(first.latitude, first.longitude, last.latitude, last.longitude);
    const threshold = getClosingDistanceThreshold(boundary.currentAccuracy ?? last.accuracy);

    if (closingDistance > threshold) {
      Alert.alert(
        'Return to start point',
        'You are not close to the starting point. Please walk near the Start Point before completing the boundary.',
      );
      return;
    }

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const { latitude, longitude, accuracy, altitude } = position.coords;
      const acc = accuracy ?? 20;

      if (
        haversineMeters(last.latitude, last.longitude, latitude, longitude) >= 1.5 &&
        acc <= AUTO_CAPTURE_REJECT_ACCURACY_METERS
      ) {
        boundary.addPoint({
          latitude,
          longitude,
          accuracy: acc,
          altitude: altitude ?? null,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Final point is optional if we already have a valid close.
    }

    boundary.finishBoundaryMapping();
  };

  const continueToPreview = () => {
    if (hasSelfIntersection(boundaryPointsToLatLng(boundary.points))) {
      Alert.alert('Boundary validation failed', 'Boundary validation failed. Please review the mapped path.');
      return;
    }

    if (boundary.isOutsideTolerance) {
      Alert.alert(
        'Edited boundary outside path',
        'Edited boundary moved outside the recorded walking path.',
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

  const editVertices = isCompleted ? simplifyBoundaryPointsForEdit(boundary.points) : boundary.points;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="Capture Boundary" onBack={confirmLeave} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>Farm: {boundary.farmName}</Text>
          <Text style={styles.topMeta}>Farmer ID: {boundary.farmCode}</Text>
          <Text style={styles.topMeta}>Status: {boundary.mappingStatusLabel}</Text>
          <Text style={styles.topMeta}>
            GPS Accuracy: {boundary.gpsAccuracyLabel}
            {boundary.currentAccuracy != null ? ` (${boundary.currentAccuracy.toFixed(1)}m)` : ''}
          </Text>
          <Text style={styles.topArea}>
            Area:{' '}
            {showFilledPolygon
              ? `${boundary.areaLabel} · ${boundary.metrics.areaHectare.toFixed(2)} ha`
              : '—'}
          </Text>
          {showFilledPolygon ? (
            <Text style={styles.topMeta}>Sq ft: {boundary.metrics.areaSquareFeet.toLocaleString()}</Text>
          ) : null}
          {boundary.poorAccuracyWarning ? (
            <Text style={styles.warning}>
              GPS accuracy is currently low. Move to an open area and wait for a better signal.
            </Text>
          ) : null}
          {boundary.isOutsideTolerance ? (
            <Text style={styles.warning}>
              Edited boundary moved outside the recorded walking path.
            </Text>
          ) : null}
        </View>

        <View style={styles.mapWrap}>
          <BoundaryLiveMap
            points={isCompleted ? boundary.points : boundary.points}
            walkingPoints={isCompleted ? boundary.walkingPoints : boundary.points}
            currentLocation={currentLocation}
            areaLabel={boundary.areaLabel}
            showPolygon={showFilledPolygon}
            showOpenPath={isMappingActive}
            showEditVertices={isCompleted}
            editVertices={editVertices}
            height={430}
            editable={isCompleted}
            followsUser={isRecording}
            isOutsideTolerance={boundary.isOutsideTolerance}
            satelliteMode={isSatellite}
            onToggleSatellite={() => {
              void toggleMapType();
            }}
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

              Alert.alert('Delete vertex?', 'Remove this boundary correction point?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => boundary.removePoint(id) },
              ]);
            }}
            onMapPress={(coordinate) => {
              if (!isCompleted) {
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
            <Pressable
              style={[styles.primaryButton, startingGps && styles.primaryButtonDisabled]}
              disabled={startingGps}
              onPress={() => void handleStartPoint()}
            >
              {startingGps ? (
                <ActivityIndicator color={dashboardTheme.onPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Start Point</Text>
              )}
            </Pressable>
          ) : null}

          {isMappingActive ? (
            <>
              <Pressable style={styles.primaryButton} onPress={() => void handleEndPoint()}>
                <Text style={styles.primaryButtonText}>End Point</Text>
              </Pressable>
              <View style={styles.row}>
                <SecondaryButton
                  label={isPaused ? 'Resume Mapping' : 'Pause Mapping'}
                  onPress={isPaused ? boundary.resumeMapping : boundary.pauseMapping}
                />
                <SecondaryButton
                  label="Center GPS"
                  onPress={() => {
                    void (async () => {
                      const position = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.BestForNavigation,
                      });
                      boundary.setCurrentLocation(
                        position.coords.latitude,
                        position.coords.longitude,
                        position.coords.accuracy ?? 8,
                        position.coords.altitude ?? null,
                      );
                    })();
                  }}
                />
              </View>
              <SecondaryButton
                label="Reset Boundary"
                onPress={() =>
                  Alert.alert('Reset boundary?', 'Remove the current walking path?', [
                    { text: 'Cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: () => {
                        boundary.resetBoundary();
                        autoCaptureState.current = { lastCaptureAt: 0, lastCaptureCoord: null };
                      },
                    },
                  ])
                }
              />
            </>
          ) : null}

          {isCompleted ? (
            <>
              <Pressable style={styles.primaryButton} onPress={continueToPreview}>
                <Text style={styles.primaryButtonText}>Save Boundary</Text>
              </Pressable>
              <View style={styles.row}>
                <SecondaryButton
                  label="Resume Mapping"
                  onPress={boundary.resumeWalkingMapping}
                />
                <SecondaryButton
                  label="Reset Boundary"
                  onPress={() =>
                    Alert.alert('Reset boundary?', 'Remove the completed boundary?', [
                      { text: 'Cancel' },
                      {
                        text: 'Reset',
                        style: 'destructive',
                        onPress: () => {
                          boundary.resetBoundary();
                          autoCaptureState.current = { lastCaptureAt: 0, lastCaptureCoord: null };
                        },
                      },
                    ])
                  }
                />
              </View>
              <Text style={styles.hint}>
                Drag the highlighted vertices to fine-tune the completed boundary before saving.
              </Text>
            </>
          ) : null}
        </View>
      </ScrollView>
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
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonDisabled: { opacity: 0.7 },
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
  hint: { fontSize: 12, color: dashboardTheme.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
});
