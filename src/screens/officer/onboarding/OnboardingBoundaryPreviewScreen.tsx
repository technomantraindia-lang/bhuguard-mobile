import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { ManualBoundaryMap } from '../../../components/officer/boundary/ManualBoundaryMap';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { updateFieldOfficerFarmMapping } from '../../../api/fieldOfficerApi';
import { getApiErrorMessage } from '../../../api/authApi';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { boundingBoxDimensions } from '../../../utils/boundaryBox';
import {
  BIGHA_CONVERSION_REGION,
  boundaryPointsToLatLng,
  type AreaUnit,
} from '../../../utils/boundaryGeometry';
import { formatGpsAccuracy } from '../../../utils/formatGpsAccuracy';
import {
  areaValueInUnit,
  compareDeclaredAndMapped,
  formatUnitLabel,
  shouldShowBigha,
} from '../../../utils/landMappingHelpers';
import { calculateTurfBoundaryMetrics } from '../../../utils/manualBoundaryGeometry';
import type { MapTilerStyleMode } from '../../../utils/mapTilerConfig';
import { isValidEntityId } from '../../../utils/entityId';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

const PREVIEW_FIT_PADDING = { top: 70, right: 70, bottom: 90, left: 70 } as const;

function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function OnboardingBoundaryPreviewScreen() {
  const navigation = useNavigation<Nav>();
  const { height: windowHeight } = useWindowDimensions();
  const boundary = useBoundaryCapture();
  const { draft, updateDraft } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<MapTilerStyleMode>('satellite');
  const [fitRequest, setFitRequest] = useState(0);

  const mapHeight = Math.max(420, Math.min(520, Math.round(windowHeight * 0.42)));

  const latLngPoints = useMemo(() => boundaryPointsToLatLng(boundary.points), [boundary.points]);
  const metrics = useMemo(
    () => calculateTurfBoundaryMetrics(latLngPoints) ?? boundary.metrics,
    [boundary.metrics, latLngPoints],
  );
  const dimensions = useMemo(() => boundingBoxDimensions(latLngPoints), [latLngPoints]);
  const gpsAccuracy = useMemo(
    () => formatGpsAccuracy(boundary.currentAccuracy),
    [boundary.currentAccuracy],
  );

  const declaredValue = Number(draft.land_area);
  const declaredUnit = (draft.land_area_unit as AreaUnit) || 'acre';
  const hasDeclared = Number.isFinite(declaredValue) && declaredValue > 0;
  const comparison = hasDeclared
    ? compareDeclaredAndMapped(declaredValue, declaredUnit, metrics)
    : null;
  const mappedInDeclaredUnit = areaValueInUnit(metrics, declaredUnit);
  const showBigha = shouldShowBigha();
  const polygonValid = latLngPoints.length >= 3 && metrics.areaSquareMeters > 0;
  const currentLocation =
    boundary.currentLatitude != null && boundary.currentLongitude != null
      ? { latitude: boundary.currentLatitude, longitude: boundary.currentLongitude }
      : null;

  const areaPillLabel = useMemo(
    () => (polygonValid ? `Actual Area: ${formatNumber(metrics.areaHectare, 2)} Hectare` : null),
    [metrics.areaHectare, polygonValid],
  );

  const confirmArea = async () => {
    if (!polygonValid) {
      Alert.alert('Invalid boundary', 'The mapped polygon is incomplete or invalid. Please edit the boundary.');
      return;
    }

    const center = boundary.points[0];
    if (boundary.farmId && boundary.farmerId) {
      setSaving(true);
      try {
        await updateFieldOfficerFarmMapping(boundary.farmerId, boundary.farmId, {
          farm_id: boundary.farmId,
          declared_area: boundary.declaredArea,
          declared_unit: boundary.declaredUnit,
          unit: boundary.unit,
          actual_area_acre: metrics.areaAcre,
          actual_area_hectare: metrics.areaHectare,
          actual_area_bigha: metrics.areaBigha,
          perimeter_meter: metrics.perimeterMeter,
          center_latitude: center?.latitude,
          center_longitude: center?.longitude,
          capture_method: boundary.captureMethod,
          gps_accuracy_average: boundary.currentAccuracy ?? undefined,
          mapping_status: 'mapped',
          verification_status: 'pending_review',
          boundary_points: boundary.points,
        });
        Alert.alert('Farm mapping completed', 'The farm boundary has been saved.');
        navigation.navigate('OnboardedFarmerView', { farmerId: boundary.farmerId });
      } catch (err) {
        Alert.alert('Mapping could not be saved', getApiErrorMessage(err, 'Please try again.'));
      } finally {
        setSaving(false);
      }
      return;
    }

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
      gps_accuracy: boundary.currentAccuracy != null ? String(boundary.currentAccuracy) : draft.gps_accuracy,
      gps_captured_at: new Date().toISOString(),
    });
    Alert.alert('Land boundary mapped successfully', 'Mapped land area has been applied to the registration form.');
    navigation.navigate('FarmerGpsCapture');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <BoundaryFlowHeader
        title="Boundary Preview & Area Confirmation"
        subtitle="Review the manually drawn satellite boundary and confirm mapped area."
        onBack={() => navigation.goBack()}
      />

      {/* Map sits OUTSIDE ScrollView so pinch/pan are not stolen by parent scroll. */}
      <View style={[styles.mapCard, { height: mapHeight }]} collapsable={false}>
        <ManualBoundaryMap
          points={boundary.points}
          currentLocation={currentLocation}
          phase="completed"
          isValid={polygonValid}
          showPolygon={polygonValid}
          mapStyleMode={mapStyleMode}
          onMapStyleModeChange={setMapStyleMode}
          requestFitToPolygon={fitRequest}
          autoFitOnLoad
          showRecenterButton
          showCenterGpsButton={Boolean(currentLocation)}
          readOnly
          fitPadding={PREVIEW_FIT_PADDING}
          areaPillLabel={areaPillLabel}
          height={mapHeight}
          persistedToBhuguard
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {!polygonValid ? (
          <Text style={styles.warning}>
            Saved boundary data is invalid and cannot be previewed. Edit points before confirming.
          </Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Area Calculation</Text>
          <Text style={styles.main}>Actual Area: {formatNumber(metrics.areaHectare, 2)} Hectare</Text>
          <Text style={styles.meta}>{formatNumber(metrics.areaAcre, 2)} Acre</Text>
          {showBigha ? (
            <Text style={styles.meta}>
              {formatNumber(metrics.areaBigha, 2)} Bigha ({BIGHA_CONVERSION_REGION})
            </Text>
          ) : null}
          <Text style={styles.meta}>{formatNumber(metrics.areaSquareMeters, 0)} m²</Text>
          <Text style={styles.meta}>{formatNumber(metrics.areaSquareFeet, 0)} ft²</Text>
          <View style={styles.divider} />
          <Text style={styles.meta}>Perimeter: {formatNumber(metrics.perimeterMeter, 0)} meters</Text>
          <Text style={styles.meta}>Approx. Length: {formatNumber(dimensions.lengthMeter, 0)} meters</Text>
          <Text style={styles.meta}>Approx. Width: {formatNumber(dimensions.widthMeter, 0)} meters</Text>
          <Text style={styles.meta}>Total Captured Points: {boundary.points.length}</Text>
          <View style={styles.divider} />
          <Text style={styles.meta}>{gpsAccuracy.label}</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              GPS accuracy reflects device location quality only. The mapped area is calculated from the
              manually drawn satellite boundary.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Declared vs Mapped</Text>
          <Text style={styles.meta}>
            Declared Area:{' '}
            {hasDeclared ? `${formatNumber(declaredValue, 2)} ${formatUnitLabel(declaredUnit)}` : '—'}
          </Text>
          <Text style={styles.meta}>
            Mapped Area: {formatNumber(mappedInDeclaredUnit, 2)} {formatUnitLabel(declaredUnit)}
          </Text>
          {comparison ? (
            <>
              <Text style={styles.meta}>
                Difference: {comparison.differenceInDeclaredUnit >= 0 ? '+' : ''}
                {formatNumber(comparison.differenceInDeclaredUnit, 2)} {formatUnitLabel(declaredUnit)}
              </Text>
              <Text style={styles.meta}>
                Difference: {comparison.differencePercent >= 0 ? '+' : ''}
                {formatNumber(comparison.differencePercent, 1)}%
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  comparison.status === 'matched' ? styles.statusOk : styles.statusReview,
                ]}
              >
                <Text style={styles.statusBadgeText}>{comparison.statusLabel}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.meta}>Declared area was not provided for comparison.</Text>
          )}
        </View>

        <Pressable
          style={[styles.primaryButton, (!polygonValid || saving) && styles.disabled]}
          onPress={() => void confirmArea()}
          disabled={saving || !polygonValid}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Confirm Land Area'}</Text>
        </Pressable>
        <Pressable
          style={styles.outlineButton}
          onPress={() => {
            if (!isValidEntityId(boundary.farmerId) || !isValidEntityId(boundary.farmId)) {
              navigation.navigate('OnboardingBoundaryStart');
              return;
            }
            navigation.navigate('FarmBoundaryMap', {
              farmerId: boundary.farmerId!,
              farmId: boundary.farmId!,
              farmerName: boundary.farmerName,
              farmName: boundary.farmName,
              farmCode: boundary.farmCode || undefined,
              village: draft.village_name || undefined,
              mappingStatus: 'pending',
              declaredArea: draft.land_area || undefined,
              declaredAreaUnit: (draft.land_area_unit as 'acre' | 'hectare' | 'bigha') || undefined,
              returnScreen: 'OnboardingBoundaryStart',
            });
          }}
        >
          <Text style={styles.outlineButtonText}>Edit Boundary</Text>
        </Pressable>
        <Pressable
          style={styles.outlineButton}
          onPress={() =>
            navigation.navigate('OnboardingBoundaryStart', {
              farmerId: boundary.farmerId ?? undefined,
              farmId: boundary.farmId ?? undefined,
              farmerName: boundary.farmerName,
              farmName: boundary.farmName,
              farmCode: boundary.farmCode || undefined,
              village: draft.village_name || undefined,
            })
          }
        >
          <Text style={styles.outlineButtonText}>Re-Capture</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={() => setFitRequest((value) => value + 1)}>
          <Text style={styles.ghostButtonText}>Recenter Boundary</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  mapCard: {
    marginHorizontal: dashboardTheme.marginMobile,
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 10,
    gap: 10,
    paddingBottom: 28,
  },
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
  divider: {
    height: 1,
    backgroundColor: `${dashboardTheme.outlineVariant}99`,
    marginVertical: 4,
  },
  infoBox: {
    marginTop: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  warning: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  statusOk: { backgroundColor: '#DCFCE7' },
  statusReview: { backgroundColor: '#FEF3C7' },
  statusBadgeText: { fontSize: 12, fontWeight: '800', color: dashboardTheme.headingGreen },
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
  ghostButton: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostButtonText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.onSurfaceVariant },
  disabled: { opacity: 0.55 },
});

export default OnboardingBoundaryPreviewScreen;
























