import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
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
  MIN_BOUNDARY_POINTS,
  MIN_POINT_DISTANCE_METERS,
  boundaryPointsToLatLng,
  haversineMeters,
  hasSelfIntersection,
} from '../../../utils/boundaryGeometry';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundaryCapture'>;

export function FarmBoundaryCaptureScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const { paused, setCurrentLocation } = boundary;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function watch() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted || paused) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 2000 },
        (position) => {
          setCurrentLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy ?? 10);
        },
      );
    }

    void watch();

    return () => {
      subscription?.remove();
    };
  }, [paused, setCurrentLocation]);

  const capturePoint = async () => {
    if (boundary.paused) {
      Alert.alert('Mapping paused', 'Resume mapping to capture the next point.');
      return;
    }

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude, accuracy } = position.coords;
    const acc = accuracy ?? 20;

    if (acc > 20) {
      Alert.alert('Poor GPS accuracy', 'Move to open sky area for better GPS before capturing this point.');
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
      timestamp: new Date().toISOString(),
    });
    boundary.setCurrentLocation(latitude, longitude, acc);
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
      Alert.alert('Boundary not closed', 'Your last point is far from the start. Add more corner points to close the farm boundary.');
      return;
    }

    navigation.navigate('FarmBoundaryPreview', { farmId: boundary.farmId! });
  };

  const currentLocation =
    boundary.currentLatitude !== null && boundary.currentLongitude !== null
      ? { latitude: boundary.currentLatitude, longitude: boundary.currentLongitude }
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="Capture Boundary" onBack={() => navigation.goBack()} />

      <View style={styles.topCard}>
        <Text style={styles.topTitle}>Farm: {boundary.farmName}</Text>
        <Text style={styles.topMeta}>GPS Accuracy: {boundary.gpsAccuracyLabel}</Text>
        <Text style={styles.topMeta}>Captured Points: {boundary.points.length}</Text>
        <Text style={styles.topArea}>Area: {boundary.points.length >= 3 ? boundary.areaLabel : '—'}</Text>
      </View>

      <View style={styles.mapWrap}>
        <BoundaryLiveMap
          points={boundary.points}
          currentLocation={currentLocation}
          areaLabel={boundary.areaLabel}
          showPolygon={boundary.points.length >= 3}
          height={430}
          onCenterGps={async () => {
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            boundary.setCurrentLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy ?? 8);
          }}
          onToggleSatellite={boundary.toggleSatelliteMode}
          satelliteMode={boundary.satelliteMode}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => void capturePoint()}>
          <Text style={styles.primaryButtonText}>Capture Point</Text>
        </Pressable>
        <View style={styles.row}>
          <SecondaryButton label="Undo Last Point" onPress={boundary.undoLastPoint} />
          <SecondaryButton label="Finish Boundary" onPress={finishBoundary} />
        </View>
        <View style={styles.row}>
          <SecondaryButton label={boundary.paused ? 'Resume Mapping' : 'Pause Mapping'} onPress={boundary.togglePaused} />
          <SecondaryButton label="Reset Boundary" onPress={() => Alert.alert('Reset boundary?', 'Remove all captured points?', [{ text: 'Cancel' }, { text: 'Reset', style: 'destructive', onPress: boundary.resetBoundary }])} />
        </View>
        <Pressable style={styles.linkButton} onPress={() => setSheetOpen(true)}>
          <Text style={styles.linkButtonText}>View Captured Points ({boundary.points.length})</Text>
        </Pressable>
      </View>

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
  secondaryButtonText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
