import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { BoundaryLiveMap } from '../../../components/farmer/boundary/BoundaryLiveMap';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useBoundaryMapType } from '../../../hooks/useBoundaryMapType';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { openGoogleMaps } from '../../../utils/farmMapHelpers';
import { getBoundaryFlowRoutes } from '../../../utils/boundaryFlowRoutes';
import { boundaryRouteParams } from '../../../utils/boundaryNavigation';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmBoundaryPreview'>;

export function FarmBoundaryPreviewScreen({ navigation }: Props) {
  const boundary = useBoundaryCapture();
  const { isSatellite, toggleMapType } = useBoundaryMapType();
  const routes = getBoundaryFlowRoutes(boundary.sessionMode);
  const center =
    boundary.points[0] != null
      ? { latitude: boundary.points[0].latitude, longitude: boundary.points[0].longitude }
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="Boundary Preview" subtitle="Review mapped farm boundary before saving." onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content}>
        <BoundaryLiveMap
          points={boundary.points}
          walkingPoints={boundary.walkingPoints}
          areaLabel={boundary.areaLabel}
          showPolygon
          height={360}
          isOutsideTolerance={boundary.isOutsideTolerance}
          satelliteMode={isSatellite}
          onToggleSatellite={() => {
            void toggleMapType();
          }}
        />

        {boundary.isOutsideTolerance ? (
          <Text style={styles.warning}>
            Boundary moved outside expected farm area. Please adjust within field boundary.
          </Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Area Calculation</Text>
          <Text style={styles.areaMain}>Area: {boundary.areaLabel}</Text>
          <Text style={styles.meta}>{boundary.metrics.areaHectare.toFixed(2)} Hectare</Text>
          <Text style={styles.meta}>{boundary.metrics.areaBigha.toFixed(2)} Bigha</Text>
          <Text style={styles.meta}>
            Sq ft: {boundary.metrics.areaSquareFeet.toLocaleString()}
          </Text>
          <Text style={styles.meta}>Perimeter: {boundary.metrics.perimeterMeter} meters</Text>
          <Text style={styles.meta}>Total Points: {boundary.points.length}</Text>
          <Text style={styles.meta}>GPS Accuracy: {boundary.gpsAccuracyLabel}</Text>
          <Text style={styles.meta}>Status: {boundary.mappingStatusLabel}</Text>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            if (boundary.isOutsideTolerance) {
              Alert.alert(
                'Boundary outside farm area',
                'Boundary moved outside expected farm area. Please adjust within field boundary.',
                [
                  { text: 'Keep editing', style: 'cancel' },
                  {
                    text: 'Save anyway',
                    style: 'destructive',
                    onPress: () => {
                      const routes = getBoundaryFlowRoutes(boundary.sessionMode);
                      navigation.navigate(
                        routes.confirm as 'FarmBoundarySaveConfirm',
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
              routes.confirm as 'FarmBoundarySaveConfirm',
              boundaryRouteParams(boundary.farmId ?? undefined),
            );
          }}
        >
          <Text style={styles.primaryButtonText}>
            {boundary.sessionMode === 'onboarding' || boundary.sessionMode === 'prefarm'
              ? 'Confirm Land Area'
              : 'Save Boundary'}
          </Text>
        </Pressable>
        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate(routes.capture as 'FarmBoundaryCapture', boundaryRouteParams(boundary.farmId ?? undefined))}
        >
          <Text style={styles.outlineButtonText}>Edit Points</Text>
        </Pressable>
        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate(routes.start as 'FarmBoundaryStart', boundaryRouteParams(boundary.farmId ?? undefined))}
        >
          <Text style={styles.outlineButtonText}>Re-capture</Text>
        </Pressable>
        {center ? (
          <Pressable style={styles.outlineButton} onPress={() => void openGoogleMaps(center, boundary.farmName)}>
            <Text style={styles.outlineButtonText}>Open in Google Maps</Text>
          </Pressable>
        ) : null}
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
  areaMain: { fontSize: 18, fontWeight: '700', color: dashboardTheme.primaryContainer },
  meta: { fontSize: 14, color: dashboardTheme.onSurface },
  warning: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
  },
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
