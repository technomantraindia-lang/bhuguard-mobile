import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { MIN_BOUNDARY_POINTS, type AreaUnit } from '../../../utils/boundaryGeometry';
import { mappedAreaLabelForDraft } from '../../../utils/onboardingBoundary';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function OnboardingBoundaryStartScreen() {
  const navigation = useNavigation<Nav>();
  const { draft } = useOnboarding();
  const boundary = useBoundaryCapture();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    boundary.setSession({
      sessionMode: 'onboarding',
      farmId: null,
      farmName: draft.village_name ? `${draft.village_name} - ${draft.land_survey_number}` : 'New Farm',
      farmCode: 'Onboarding',
      farmerName: draft.farmer_name || 'Farmer',
      declaredArea: draft.land_area,
      declaredUnit: (draft.land_area_unit as AreaUnit) || 'acre',
      unit: (draft.land_area_unit as AreaUnit) || 'acre',
    });
    boundary.setPoints(draft.boundary_points);
    boundary.setCaptureMethod(draft.boundary_capture_method);

    const init = async () => {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.granted) {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        boundary.setCurrentLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy ?? 8);
      }

      setLoading(false);
    };

    void init();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={dashboardTheme.primaryContainer} />
      </SafeAreaView>
    );
  }

  const mappedLabel = mappedAreaLabelForDraft(draft);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title="Map Land Boundary"
        subtitle="Walk around the land boundary to verify actual land size."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Farmer</Text>
          <Text style={styles.value}>{draft.farmer_name || '-'}</Text>
          <Text style={styles.label}>Declared area</Text>
          <Text style={styles.value}>
            {draft.land_area || '-'} {draft.land_area_unit}
          </Text>
          <Text style={styles.label}>GPS accuracy</Text>
          <Text style={styles.value}>{boundary.gpsAccuracyLabel}</Text>
          <Text style={styles.label}>Captured points</Text>
          <Text style={styles.value}>
            {boundary.points.length} / min {MIN_BOUNDARY_POINTS}
          </Text>
          {mappedLabel ? <Text style={styles.mapped}>Mapped: {mappedLabel}</Text> : null}
        </View>

        <Text style={styles.instruction}>
          Stand at the farm edge and tap Start Walking Mapping. Points are captured automatically as you walk.
          Use Capture Point only as a backup. Bhuguard calculates the actual land area.
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('OnboardingBoundaryCapture')}>
          <Text style={styles.primaryButtonText}>Start Mapping</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('OnboardingBoundaryCapture')}>
          <Text style={styles.outlineButtonText}>Add Manual Coordinate</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('OnboardingCameraBoundaryStart')}>
          <Text style={styles.outlineButtonText}>Use Camera + GPS Capture</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 4,
  },
  label: { fontSize: 12, color: dashboardTheme.onSurfaceVariant, textTransform: 'uppercase' },
  value: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onSurface, marginBottom: 6 },
  mapped: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer, marginTop: 4 },
  instruction: { fontSize: 14, lineHeight: 21, color: dashboardTheme.onSurfaceVariant },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  outlineButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
  },
  outlineButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
  cancelButton: { alignItems: 'center', paddingVertical: 10 },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: dashboardTheme.onSurfaceVariant },
});
