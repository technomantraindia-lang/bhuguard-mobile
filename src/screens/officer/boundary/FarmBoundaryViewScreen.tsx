import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { getFieldOfficerFarmMapping } from '../../../api/fieldOfficerApi';
import { AppButton } from '../../../components/AppButton';
import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { ManualBoundaryMap } from '../../../components/officer/boundary/ManualBoundaryMap';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../../utils/apiHelpers';
import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import { formatFarmDisplayCode, formatFarmerDisplayCode } from '../../../utils/entityId';
import { calculateTurfBoundaryMetrics } from '../../../utils/manualBoundaryGeometry';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FarmBoundaryView'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FarmBoundaryView'>;

function readNumber(record: ApiRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function mapApiPointsToBoundary(record: ApiRecord): BoundaryPoint[] {
  const boundary = (record.boundary ?? record.mapping ?? record) as ApiRecord;
  const raw =
    (Array.isArray(boundary.boundary_points) && boundary.boundary_points)
    || (Array.isArray(boundary.boundaryPoints) && boundary.boundaryPoints)
    || (Array.isArray(boundary.points) && boundary.points)
    || (Array.isArray(record.boundary_points) && record.boundary_points)
    || [];

  return (raw as ApiRecord[])
    .map((point, index): BoundaryPoint | null => {
      const latitude = readNumber(point, 'latitude', 'lat');
      const longitude = readNumber(point, 'longitude', 'lng', 'lon');
      if (latitude == null || longitude == null) {
        return null;
      }

      const pointNo = readNumber(point, 'point_no', 'pointNo', 'sequence') ?? index + 1;
      return {
        id: `view-${pointNo}-${index}`,
        pointNo,
        latitude,
        longitude,
        accuracy: readNumber(point, 'accuracy') ?? 8,
        altitude: readNumber(point, 'altitude'),
        timestamp:
          pickString(point, 'timestamp', 'captured_at', 'capturedAt') !== '-'
            ? pickString(point, 'timestamp', 'captured_at', 'capturedAt')
            : new Date().toISOString(),
        manual: true,
      };
    })
    .filter((point): point is BoundaryPoint => point !== null);
}

/**
 * Read-only saved-boundary viewer (Phase 10.7/10.10). Shows only the selected
 * farm's polygon, fit to bounds, with names/IDs/area below the map. There is no
 * FO location marker, no editing affordance, and no other farms rendered — this
 * is achieved by passing `phase="completed"` and omitting all edit callbacks, so
 * MapLibre/FoBoundaryMap ignores taps and drag gestures entirely.
 */
export function FarmBoundaryViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const params = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [fitRequest, setFitRequest] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = (await getFieldOfficerFarmMapping(params.farmerId, params.farmId)) as ApiRecord;
        const savedPoints = mapApiPointsToBoundary(payload);
        if (!cancelled) {
          setPoints(savedPoints);
          setFitRequest((value) => value + 1);
          if (savedPoints.length < 3) {
            setError('This farm does not have a saved boundary yet.');
          }
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load the saved boundary for this farm.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [params.farmerId, params.farmId]);

  const metrics = useMemo(() => {
    if (points.length < 3) {
      return null;
    }
    return calculateTurfBoundaryMetrics(
      points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    );
  }, [points]);

  const farmerDisplayId = formatFarmerDisplayCode(params.farmerId, params.farmerCode);
  const farmDisplayId = formatFarmDisplayCode(params.farmId, params.farmCode);
  const declaredAreaLabel = params.declaredArea
    ? `${params.declaredArea}${params.declaredAreaUnit ? ` ${params.declaredAreaUnit}` : ''}`
    : null;

  // Screen is always pushed from its origin (OnboardedFarmerView / Review) — a
  // simple pop returns there without touching the onboarding stack (Phase 10.9).
  const done = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="View Farm Mapping" subtitle={params.farmName || params.farmerName} onBack={done} />

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={dashboardTheme.primaryContainer} />
          </View>
        ) : (
          <ManualBoundaryMap
            points={points}
            currentLocation={null}
            farmLocation={null}
            phase="completed"
            isValid={points.length >= 3}
            requestFitToPolygon={fitRequest}
            showFitBoundaryButton
            readOnly
          />
        )}
      </View>

      <ScrollView
        style={styles.infoScroll}
        contentContainerStyle={styles.infoContent}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Farm Mapping Summary</Text>
          <Line label="Farmer" value={params.farmerName} />
          <Line label="Farmer ID" value={farmerDisplayId} />
          <Line label="Farm" value={params.farmName} />
          <Line label="Farm ID" value={farmDisplayId} />
          <Line label="Village" value={params.village} />
          {declaredAreaLabel ? <Line label="Declared Area" value={declaredAreaLabel} /> : null}
          <Line
            label="Mapped Area"
            value={metrics ? `${metrics.areaAcre.toFixed(4)} acres` : points.length > 0 ? '—' : 'Not available'}
          />
          <Line label="Boundary Points" value={points.length > 0 ? String(points.length) : 'None'} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton label="Done" onPress={done} />
      </View>
    </SafeAreaView>
  );
}

function Line({ label, value }: { label: string; value?: string }) {
  return (
    <Text style={styles.line}>
      {label}: {value?.trim() ? value : '—'}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  mapWrap: { width: '100%', height: 340 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoScroll: { flex: 1 },
  infoContent: { padding: 16, gap: 12, paddingBottom: 24 },
  errorText: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: dashboardTheme.onSurface,
    marginBottom: 4,
  },
  line: { fontSize: 14, color: dashboardTheme.onSurfaceVariant, marginTop: 2 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
});
