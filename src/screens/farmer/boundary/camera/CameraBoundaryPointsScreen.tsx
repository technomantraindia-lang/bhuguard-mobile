import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AddManualCoordinateModal } from '../../../../components/farmer/boundary/AddManualCoordinateModal';
import { BoundaryFlowHeader } from '../../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../../navigation/types';
import { dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';
import { formatGpsAccuracy, MIN_BOUNDARY_POINTS } from '../../../../utils/boundaryGeometry';
import { getBoundaryFlowRoutes } from '../../../../utils/boundaryFlowRoutes';
import { boundaryRouteParams } from '../../../../utils/boundaryNavigation';

type Props = NativeStackScreenProps<FarmerStackParamList, 'CameraBoundaryPoints'>;

export function CameraBoundaryPointsScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const routes = getBoundaryFlowRoutes(boundary.sessionMode);
  const [manualOpen, setManualOpen] = useState(false);

  const continueToPreview = () => {
    if (boundary.points.length < MIN_BOUNDARY_POINTS) {
      Alert.alert('More points required', `Add at least ${MIN_BOUNDARY_POINTS} boundary points.`);
      return;
    }

    navigation.navigate(routes.cameraPreview as 'CameraBoundaryPreview', boundaryRouteParams(boundary.farmId ?? undefined));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title="Captured Boundary Points"
        subtitle="Review each corner photo and GPS location."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {boundary.points.map((point) => (
          <View key={point.id} style={styles.pointCard}>
            <View style={styles.pointHeader}>
              <Text style={styles.pointTitle}>Point {point.pointNo}</Text>
              <Pressable onPress={() => boundary.removePoint(point.id)}>
                <Text style={styles.deleteText}>Delete Point</Text>
              </Pressable>
            </View>

            {point.photoUri ? (
              <Image source={{ uri: point.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoFallbackText}>No photo</Text>
              </View>
            )}

            <Text style={styles.meta}>Latitude: {point.latitude.toFixed(5)}</Text>
            <Text style={styles.meta}>Longitude: {point.longitude.toFixed(5)}</Text>
            <Text style={styles.meta}>Timestamp: {new Date(point.timestamp).toLocaleString()}</Text>
            <Text style={styles.meta}>GPS Accuracy: {formatGpsAccuracy(point.accuracy)} ({point.accuracy.toFixed(0)}m)</Text>
          </View>
        ))}

        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate(routes.cameraLive as 'CameraBoundaryLive', boundaryRouteParams(boundary.farmId ?? undefined))}
        >
          <Text style={styles.outlineButtonText}>Add More Points</Text>
        </Pressable>

        <Pressable style={styles.outlineButton} onPress={() => setManualOpen(true)}>
          <Text style={styles.outlineButtonText}>Add Manual Coordinate</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={continueToPreview}>
          <Text style={styles.primaryButtonText}>Preview Boundary</Text>
        </Pressable>
      </ScrollView>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  pointCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 8,
  },
  pointHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pointTitle: { fontSize: 16, fontWeight: '700', color: dashboardTheme.headingGreen },
  deleteText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.error },
  photo: { width: '100%', height: 160, borderRadius: 10, backgroundColor: dashboardTheme.surfaceLow },
  photoFallback: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: dashboardTheme.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackText: { color: dashboardTheme.textMuted, fontWeight: '600' },
  meta: { fontSize: 13, color: dashboardTheme.onSurface },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  outlineButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  outlineButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
