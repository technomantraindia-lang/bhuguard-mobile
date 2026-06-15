import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../../api/authApi';
import { saveFarmerFarmBoundary } from '../../../api/farmerApi';
import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { buildBoundaryUploadPayload } from '../../../utils/boundaryGeometry';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundaryUploading'>;

const STEPS = [
  'Uploading boundary data',
  'Syncing GPS points',
  'Calculating land area',
  'Saving farm map',
];

export function FarmBoundaryUploadingScreen({ navigation, route }: Props) {
  const { farmId } = route.params;
  const boundary = useBoundaryCapture();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((_, index) => {
      timers.push(setTimeout(() => setStepIndex(index), index * 700));
    });

    async function upload() {
      try {
        const payload = buildBoundaryUploadPayload(farmId, boundary.unit, boundary.points, boundary.gpsAccuracyLabel);
        await saveFarmerFarmBoundary(farmId, payload);

        if (!cancelled) {
          navigation.replace('FarmBoundarySuccess', {
            farmId,
            areaLabel: boundary.areaLabel,
            pointCount: boundary.points.length,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to upload farm boundary.'));
        }
      }
    }

    const uploadTimer = setTimeout(() => {
      void upload();
    }, 1200);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearTimeout(uploadTimer);
    };
  }, [boundary.areaLabel, boundary.gpsAccuracyLabel, boundary.points, boundary.unit, farmId, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="Uploading Boundary" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <ActivityIndicator size="large" color={dashboardTheme.primaryContainer} />
        <Text style={styles.title}>Saving your farm boundary</Text>

        {STEPS.map((step, index) => (
          <Text key={step} style={[styles.step, index <= stepIndex && styles.stepActive]}>
            {index <= stepIndex ? '✓' : '•'} {step}
          </Text>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: dashboardTheme.headingGreen, marginTop: 8 },
  step: { fontSize: 14, color: dashboardTheme.textMuted },
  stepActive: { color: dashboardTheme.primaryContainer, fontWeight: '700' },
  error: { fontSize: 14, color: dashboardTheme.error, textAlign: 'center', marginTop: 12 },
});
