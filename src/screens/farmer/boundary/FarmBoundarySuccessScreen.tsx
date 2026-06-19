import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundarySuccess'>;

export function FarmBoundarySuccessScreen({ navigation, route }: Props) {
  const { farmId, areaLabel, pointCount, photoCount, captureMethod } = route.params;
  const boundary = useBoundaryCapture();
  const isCamera = captureMethod === 'camera';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title={isCamera ? 'Farm Boundary Captured' : 'Farm Boundary Saved'}
        subtitle={
          isCamera
            ? 'Your farm boundary has been captured and saved successfully.'
            : 'Your farm boundary has been mapped successfully.'
        }
        onBack={() => navigation.popToTop()}
      />

      <View style={styles.content}>
        <View style={styles.card}>
          <Row label="Farm Name" value={boundary.farmName} />
          <Row label="Area" value={areaLabel} />
          <Row label="Total Points" value={String(pointCount)} />
          {photoCount != null ? <Row label="Total Photos" value={String(photoCount)} /> : null}
          <Row label="Status" value="Mapped" />
          <Row label="Upload" value="Uploaded Successfully" />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('FarmerFarmDetail', { farmId })}>
          <Text style={styles.primaryButtonText}>View Farm Details</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('FarmerSubmitActivity', { farmId })}>
          <Text style={styles.outlineButtonText}>Add Activity</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { flex: 1, padding: dashboardTheme.marginMobile, gap: 12 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 10,
    marginTop: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 14, color: dashboardTheme.onSurfaceVariant },
  value: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurface, textAlign: 'right', flex: 1 },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
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
