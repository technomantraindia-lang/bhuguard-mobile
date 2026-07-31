import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as Location from 'expo-location';

import { BoundaryLiveMap } from '../../../../components/farmer/boundary/BoundaryLiveMap';
import { useBoundaryCapture } from '../../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../../navigation/types';
import { dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';
import {
  MIN_BOUNDARY_POINTS,
  MIN_POINT_DISTANCE_METERS,
  boundaryPointsToLatLng,
  haversineMeters,
  hasSelfIntersection,
} from '../../../../utils/boundaryGeometry';
import { getBoundaryFlowRoutes } from '../../../../utils/boundaryFlowRoutes';
import { boundaryRouteParams } from '../../../../utils/boundaryNavigation';
import { applyLivePhotoWatermarkDetailed } from '../../../../services/livePhotoWatermarkService';
import { resolveCaptureLocation } from '../../../../utils/livePhotoLocation';
import { buildLivePhotoWatermarkMeta } from '../../../../utils/livePhotoWatermarkFormat';

type Props = NativeStackScreenProps<FarmerStackParamList, 'CameraBoundaryLive'>;

export function CameraBoundaryLiveScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const routes = getBoundaryFlowRoutes(boundary.sessionMode);
  const { setCurrentLocation } = boundary;
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function watch() {
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(permission.granted);

      if (!permission.granted) {
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
  }, [setCurrentLocation]);

  if (!cameraPermission) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.permissionText}>Checking camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Camera permission required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to capture boundary photos at each farm corner.
          </Text>
          <Pressable style={styles.permissionButton} onPress={() => void requestCameraPermission()}>
            <Text style={styles.permissionButtonText}>Enable Camera Permission</Text>
          </Pressable>
          <Pressable style={styles.linkButton} onPress={() => void Linking.openSettings()}>
            <Text style={styles.linkButtonText}>Open Settings</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (locationGranted === false) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Location permission required</Text>
          <Text style={styles.permissionText}>
            GPS coordinates are saved with every photo for accurate boundary mapping.
          </Text>
          <Pressable
            style={styles.permissionButton}
            onPress={async () => {
              const permission = await Location.requestForegroundPermissionsAsync();
              setLocationGranted(permission.granted);
            }}
          >
            <Text style={styles.permissionButtonText}>Enable Location Permission</Text>
          </Pressable>
          <Pressable style={styles.linkButton} onPress={() => void Linking.openSettings()}>
            <Text style={styles.linkButtonText}>Open Settings</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const capturePointPhoto = async () => {
    if (capturing) {
      return;
    }

    setCapturing(true);

    try {
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

      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: false });

      if (!photo?.uri) {
        Alert.alert('Photo capture failed', 'Please try again.');
        return;
      }

      const capturedAt = new Date().toISOString();
      const location = await resolveCaptureLocation(latitude, longitude);
      const watermark = buildLivePhotoWatermarkMeta({
        capturedAt,
        latitude,
        longitude,
        accuracy: acc,
        village: location.village,
        taluka: location.taluka,
        district: location.district,
        state: location.state,
      });

      let stampedUri: string;

      try {
        const stampResult = await applyLivePhotoWatermarkDetailed(photo.uri, watermark, {
          uri: photo.uri,
          name: `boundary-point-${boundary.points.length + 1}.jpg`,
          type: 'image/jpeg',
          capturedAt,
          latitude,
          longitude,
          accuracy: acc,
          village: location.village,
          taluka: location.taluka,
          district: location.district,
          state: location.state,
        });
        stampedUri = stampResult.uri;
      } catch (error) {
        Alert.alert(
          'Stamp failed',
          error instanceof Error ? error.message : 'Could not burn timestamp onto the boundary photo.',
        );
        return;
      }

      boundary.addPoint({
        latitude,
        longitude,
        accuracy: acc,
        timestamp: capturedAt,
        photoUri: stampedUri,
        label: `Corner ${boundary.points.length + 1}`,
      });
      boundary.setCurrentLocation(latitude, longitude, acc);
    } catch {
      Alert.alert('Capture failed', 'Could not capture photo and GPS. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const finishBoundary = () => {
    if (boundary.points.length < MIN_BOUNDARY_POINTS) {
      Alert.alert('More points required', `Capture at least ${MIN_BOUNDARY_POINTS} boundary points with photos.`);
      return;
    }

    const polygon = boundaryPointsToLatLng(boundary.points);

    if (hasSelfIntersection(polygon)) {
      Alert.alert('Invalid boundary', 'Boundary lines intersect. Adjust points before finishing.');
      return;
    }

    navigation.navigate(routes.cameraPoints as 'CameraBoundaryPoints', boundaryRouteParams(boundary.farmId ?? undefined));
  };

  const currentLocation =
    boundary.currentLatitude !== null && boundary.currentLongitude !== null
      ? { latitude: boundary.currentLatitude, longitude: boundary.currentLongitude }
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.cameraWrap}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" flash={flash} />

        <View style={styles.overlayTop}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Text style={styles.iconButtonText}>✕</Text>
          </Pressable>
          <View style={styles.overlayStats}>
            <Text style={styles.overlayText}>Point {boundary.points.length + 1}</Text>
            <Text style={styles.overlayText}>GPS: {boundary.gpsAccuracyLabel}</Text>
          </View>
          <Pressable
            style={styles.iconButton}
            onPress={() => setFlash((value) => (value === 'off' ? 'on' : 'off'))}
          >
            <Text style={styles.iconButtonText}>{flash === 'on' ? '⚡' : '◌'}</Text>
          </Pressable>
        </View>

        <View style={styles.overlayCoords}>
          <Text style={styles.coordText}>Lat: {boundary.currentLatitude?.toFixed(5) ?? '—'}</Text>
          <Text style={styles.coordText}>Lng: {boundary.currentLongitude?.toFixed(5) ?? '—'}</Text>
          <Text style={styles.coordText}>Accuracy: {boundary.currentAccuracy?.toFixed(0) ?? '—'}m</Text>
        </View>

        <View style={styles.miniMapWrap}>
          <BoundaryLiveMap
            points={boundary.points}
            currentLocation={currentLocation}
            areaLabel={boundary.points.length >= 3 ? boundary.areaLabel : undefined}
            showPolygon={boundary.points.length >= 3}
            height={120}
            width={340}
          />
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.sideButton} onPress={boundary.undoLastPoint}>
            <Text style={styles.sideButtonText}>Undo</Text>
          </Pressable>

          <Pressable
            style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
            onPress={() => void capturePointPhoto()}
            disabled={capturing}
          >
            <View style={styles.captureInner} />
          </Pressable>

          <View style={styles.sideButtonSpacer} />
        </View>

        <Text style={styles.captureLabel}>Capture Point Photo</Text>

        <View style={styles.bottomRow}>
          <Pressable style={styles.bottomButton} onPress={() => void capturePointPhoto()}>
            <Text style={styles.bottomButtonText}>Capture Next Point</Text>
          </Pressable>
          <Pressable style={styles.finishButton} onPress={finishBoundary}>
            <Text style={styles.finishButtonText}>Finish Boundary</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  overlayTop: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overlayStats: { alignItems: 'center', gap: 2 },
  overlayText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 4 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  overlayCoords: {
    position: 'absolute',
    top: 64,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  coordText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  miniMapWrap: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  controls: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  captureButtonDisabled: { opacity: 0.6 },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: dashboardTheme.primaryContainer,
  },
  sideButton: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sideButtonSpacer: {
    width: 58,
    height: 34,
  },
  sideButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  captureLabel: {
    position: 'absolute',
    bottom: 88,
    alignSelf: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bottomButtonText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer },
  finishButton: {
    flex: 1,
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  finishButtonText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.onPrimary },
  permissionCard: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: dashboardTheme.background,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', color: dashboardTheme.headingGreen, textAlign: 'center' },
  permissionText: { fontSize: 15, lineHeight: 22, color: dashboardTheme.onSurface, textAlign: 'center' },
  permissionButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  permissionButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  linkButton: { alignItems: 'center', paddingVertical: 8 },
  linkButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
