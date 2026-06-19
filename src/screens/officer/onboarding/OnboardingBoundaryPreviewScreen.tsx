import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { BoundaryLiveMap } from '../../../components/farmer/boundary/BoundaryLiveMap';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { boundingBoxDimensions } from '../../../utils/boundaryBox';
import { boundaryPointsToLatLng, type AreaUnit } from '../../../utils/boundaryGeometry';
import { areaValueInUnit, compareDeclaredAndMapped, formatUnitLabel } from '../../../utils/landMappingHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

export function OnboardingBoundaryPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const boundary = useBoundaryCapture();
  const { draft, updateDraft } = useOnboarding();
  const declaredValue = Number(draft.land_area);
  const declaredUnit = (draft.land_area_unit as AreaUnit) || 'acre';
  const comparison = Number.isFinite(declaredValue)
    ? compareDeclaredAndMapped(declaredValue, declaredUnit, boundary.metrics)
    : { differenceAcre: 0, status: 'needs_review' as const };
  const dimensions = boundingBoxDimensions(boundaryPointsToLatLng(boundary.points));
  const mappedInDeclaredUnit = areaValueInUnit(boundary.metrics, declaredUnit);

  const saveDraft = () => {
    updateDraft({
      boundary_points: boundary.points,
      boundary_unit: boundary.unit,
      boundary_capture_method: boundary.captureMethod,
      boundary_mapping_status: 'draft',
    });
    Alert.alert('Draft saved', 'Boundary mapping saved as draft. You can continue registration and finish later.');
    navigation.navigate('FarmerLandDetails');
  };

  const confirmArea = () => {
    const center = boundary.points[0];
    updateDraft({
      boundary_points: boundary.points,
      boundary_unit: boundary.unit,
      boundary_capture_method: boundary.captureMethod,
      boundary_mapping_status: 'mapped',
      boundary_verification_status: 'pending_review',
      land_area: String(mappedInDeclaredUnit),
      land_area_unit: declaredUnit,
      gps_latitude: center ? String(center.latitude) : draft.gps_latitude,
      gps_longitude: center ? String(center.longitude) : draft.gps_longitude,
      gps_accuracy: center ? String(center.accuracy) : draft.gps_accuracy,
      gps_captured_at: new Date().toISOString(),
    });
    Alert.alert('Land boundary mapped successfully', 'Mapped land area has been applied to the registration form.');
    navigation.navigate('FarmerGpsCapture');
  };

  const comparisonLabel =
    comparison.status === 'matched'
      ? 'Matched'
      : comparison.status === 'difference_found'
        ? 'Difference Found'
        : 'Needs Review';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title="Boundary Preview & Area Confirmation"
        subtitle="Review mapped boundary and declared area comparison."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <BoundaryLiveMap points={boundary.points} areaLabel={boundary.areaLabel} showPolygon height={320} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Area Calculation</Text>
          <Text style={styles.main}>Actual Area: {boundary.areaLabel}</Text>
          <Text style={styles.meta}>{boundary.metrics.areaHectare.toFixed(2)} Hectare</Text>
          <Text style={styles.meta}>{boundary.metrics.areaBigha.toFixed(2)} Bigha</Text>
          <Text style={styles.meta}>Perimeter: {boundary.metrics.perimeterMeter} meters</Text>
          <Text style={styles.meta}>Estimated Length: {dimensions.lengthMeter} meters</Text>
          <Text style={styles.meta}>Estimated Width: {dimensions.widthMeter} meters</Text>
          <Text style={styles.meta}>Total Captured Points: {boundary.points.length}</Text>
          <Text style={styles.meta}>GPS Accuracy: {boundary.gpsAccuracyLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Declared vs Mapped</Text>
          <Text style={styles.meta}>
            Declared Area: {draft.land_area || '-'} {formatUnitLabel(declaredUnit)}
          </Text>
          <Text style={styles.meta}>
            Mapped Area: {mappedInDeclaredUnit.toFixed(2)} {formatUnitLabel(declaredUnit)}
          </Text>
          <Text style={styles.meta}>
            Difference: {comparison.differenceAcre >= 0 ? '+' : ''}
            {comparison.differenceAcre.toFixed(2)} Acres
          </Text>
          <Text style={styles.status}>Status: {comparisonLabel}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={confirmArea}>
          <Text style={styles.primaryButtonText}>Confirm Land Area</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('OnboardingBoundaryCapture')}>
          <Text style={styles.outlineButtonText}>Edit Points</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('OnboardingBoundaryStart')}>
          <Text style={styles.outlineButtonText}>Re-Capture</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={saveDraft}>
          <Text style={styles.outlineButtonText}>Save as Draft</Text>
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
    gap: 6,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: dashboardTheme.headingGreen },
  main: { fontSize: 18, fontWeight: '700', color: dashboardTheme.primaryContainer },
  meta: { fontSize: 14, color: dashboardTheme.onSurface },
  status: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer, marginTop: 4 },
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
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  outlineButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
