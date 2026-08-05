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
import type { LatLng } from '../../../utils/farmSatelliteMap';
import {
  DISPLAY_ID_PENDING,
  formatFarmDisplayId,
  formatFarmerDisplayId,
} from '../../../utils/displayIds';
import {
  resolveFarmIdentityLabelCoordinate,
  type FarmIdentityLabelData,
} from '../../../utils/farmIdentityMapLabel';
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
 * Read-only saved-boundary viewer. Shows only the selected farm's polygon with
 * a single identity label over the farm. No FO location marker, no editing.
 */
export function FarmBoundaryViewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const params = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [fitRequest, setFitRequest] = useState(0);
  const [farmerName, setFarmerName] = useState(params.farmerName || 'Farmer');
  const [farmName, setFarmName] = useState(params.farmName || '');
  const [village, setVillage] = useState(params.village || '');
  const [farmerDisplayId, setFarmerDisplayId] = useState(
    formatFarmerDisplayId({
      farmer_display_id: params.farmerCode,
      farmer_code: params.farmerCode,
    }),
  );
  const [farmDisplayId, setFarmDisplayId] = useState(
    formatFarmDisplayId({
      farm_display_id: params.farmCode,
      farm_code: params.farmCode,
    }),
  );
  const [declaredAreaLabel, setDeclaredAreaLabel] = useState(
    params.declaredArea
      ? `${params.declaredArea}${params.declaredAreaUnit ? ` ${params.declaredAreaUnit}` : ''}`
      : null,
  );
  const [mappedAreaLabel, setMappedAreaLabel] = useState<string | null>(null);
  const [farmGps, setFarmGps] = useState<LatLng | null>(null);
  const [boundaryCenter, setBoundaryCenter] = useState<LatLng | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = (await getFieldOfficerFarmMapping(params.farmerId, params.farmId)) as ApiRecord;
        const mapping = ((payload.mapping as ApiRecord | undefined) ?? payload) as ApiRecord;
        const savedPoints = mapApiPointsToBoundary(mapping);

        const nextFarmerName =
          pickString(payload, 'farmer_name') !== '-'
            ? pickString(payload, 'farmer_name')
            : params.farmerName || 'Farmer';
        const nextFarmName =
          pickString(payload, 'farm_name') !== '-'
            ? pickString(payload, 'farm_name')
            : params.farmName || '';
        const nextVillage =
          pickString(payload, 'village') !== '-'
            ? pickString(payload, 'village')
            : pickString(mapping, 'village') !== '-'
              ? pickString(mapping, 'village')
              : params.village || '';

        const nextFarmerId = formatFarmerDisplayId({
          farmer_display_id:
            pickString(payload, 'farmer_display_id') !== '-'
              ? pickString(payload, 'farmer_display_id')
              : params.farmerCode,
          farmer_code:
            pickString(payload, 'farmer_code') !== '-'
              ? pickString(payload, 'farmer_code')
              : params.farmerCode,
        });
        const nextFarmId = formatFarmDisplayId({
          farm_display_id:
            pickString(payload, 'farm_display_id') !== '-'
              ? pickString(payload, 'farm_display_id')
              : params.farmCode,
          farm_code:
            pickString(payload, 'farm_code') !== '-'
              ? pickString(payload, 'farm_code')
              : params.farmCode,
        });

        const declaredArea = readNumber(payload, 'declared_area') ?? readNumber(mapping, 'declared_area');
        const declaredUnit =
          pickString(payload, 'declared_unit') !== '-'
            ? pickString(payload, 'declared_unit')
            : pickString(mapping, 'declared_unit');
        const mappedArea = readNumber(payload, 'mapped_area', 'area_acre', 'area_acres')
          ?? readNumber(mapping, 'area_acre', 'area_acres', 'actual_area_acre');

        const lat = readNumber(payload, 'farm_latitude', 'gps_latitude', 'latitude');
        const lng = readNumber(payload, 'farm_longitude', 'gps_longitude', 'longitude');
        const centerLat = readNumber(payload, 'center_latitude') ?? readNumber(mapping, 'center_latitude');
        const centerLng = readNumber(payload, 'center_longitude') ?? readNumber(mapping, 'center_longitude');

        if (!cancelled) {
          setPoints(savedPoints);
          setFitRequest((value) => value + 1);
          setFarmerName(nextFarmerName);
          setFarmName(nextFarmName);
          setVillage(nextVillage);
          setFarmerDisplayId(nextFarmerId);
          setFarmDisplayId(nextFarmId);
          if (declaredArea != null) {
            setDeclaredAreaLabel(
              `${declaredArea}${declaredUnit && declaredUnit !== '-' ? ` ${declaredUnit}` : ''}`,
            );
          }
          if (mappedArea != null) {
            setMappedAreaLabel(`${mappedArea.toFixed(4)} acres`);
          }
          setFarmGps(lat != null && lng != null ? { latitude: lat, longitude: lng } : null);
          setBoundaryCenter(
            centerLat != null && centerLng != null
              ? { latitude: centerLat, longitude: centerLng }
              : null,
          );
          if (savedPoints.length < 3 && (lat == null || lng == null)) {
            setError('Mapping unavailable for this farm.');
          } else if (savedPoints.length < 3) {
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
  }, [params.farmCode, params.farmerCode, params.farmerId, params.farmId, params.farmName, params.farmerName, params.village]);

  const metrics = useMemo(() => {
    if (points.length < 3) {
      return null;
    }
    return calculateTurfBoundaryMetrics(
      points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    );
  }, [points]);

  const farmIdentityLabel = useMemo((): FarmIdentityLabelData | null => {
    const coordinate = resolveFarmIdentityLabelCoordinate({
      polygon: points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
      farmGps,
      center: boundaryCenter,
    });
    if (!coordinate) {
      return null;
    }

    return {
      coordinate,
      farmName: farmName.trim() || 'Farm',
      farmId: farmDisplayId || DISPLAY_ID_PENDING,
      farmerName: farmerName.trim() || 'Farmer',
      farmerId: farmerDisplayId || DISPLAY_ID_PENDING,
    };
  }, [boundaryCenter, farmDisplayId, farmGps, farmName, farmerDisplayId, farmerName, points]);

  const done = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="View Farm Mapping" subtitle={farmName || farmerName} onBack={done} />

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={dashboardTheme.primaryContainer} />
          </View>
        ) : (
          <ManualBoundaryMap
            points={points}
            currentLocation={null}
            farmLocation={farmGps}
            farmIdentityLabel={farmIdentityLabel}
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
          <Line label="Farmer" value={farmerName} />
          <Line label="Farmer ID" value={farmerDisplayId} />
          <Line label="Farm" value={farmName} />
          <Line label="Farm ID" value={farmDisplayId} />
          <Line label="Village" value={village} />
          {declaredAreaLabel ? <Line label="Declared Area" value={declaredAreaLabel} /> : null}
          <Line
            label="Mapped Area"
            value={
              mappedAreaLabel
              ?? (metrics ? `${metrics.areaAcre.toFixed(4)} acres` : points.length > 0 ? '—' : 'Not available')
            }
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
