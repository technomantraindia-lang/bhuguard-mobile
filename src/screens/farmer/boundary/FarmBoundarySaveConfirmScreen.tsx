import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundarySaveConfirm'>;

export function FarmBoundarySaveConfirmScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="Save Farm Boundary?" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.card}>
          <Row label="Farm Name" value={boundary.farmName} />
          <Row label="Calculated Land Area" value={boundary.areaLabel} />
          <Row label="Boundary Points" value={String(boundary.points.length)} />
          <Row label="Unit" value={boundary.unit.charAt(0).toUpperCase() + boundary.unit.slice(1)} />
        </View>

        <Text style={styles.message}>
          This boundary will be saved for farm verification, carbon monitoring and future reports.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('FarmBoundaryUploading', { farmId: boundary.farmId! })}
        >
          <Text style={styles.primaryButtonText}>Confirm & Upload</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  content: { flex: 1, padding: dashboardTheme.marginMobile, gap: 14 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 14, color: dashboardTheme.onSurfaceVariant, flex: 1 },
  value: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurface, flex: 1, textAlign: 'right' },
  message: { fontSize: 14, lineHeight: 21, color: dashboardTheme.onSurfaceVariant },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  cancelButton: { alignItems: 'center', paddingVertical: 12 },
  cancelButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
