import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getFarmerFarmDetail, getFarmerFarmMapping } from '../../../api/farmerApi';
import { AppButton } from '../../../components/AppButton';
import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { ManualBoundaryMap } from '../../../components/officer/boundary/ManualBoundaryMap';
import type { FarmerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../../utils/apiHelpers';
import type { BoundaryPoint } from '../../../utils/boundaryGeometry';
import type { LatLng } from '../../../utils/farmSatelliteMap';
import { formatFarmDisplayId, formatFarmerDisplayId } from '../../../utils/displayIds';
import { getFarmCode } from '../../../utils/farmMapHelpers';
import {
  resolveFarmIdentityLabelCoordinate,
  type FarmIdentityLabelData,
} from '../../../utils/farmIdentityMapLabel';
import { calculateTurfBoundaryMetrics } from '../../../utils/manualBoundaryGeometry';
import { formatHectares, resolveFarmAreaHectares } from '../../../utils/farmAreaUnits';
import { getAuthUser } from '../../../utils/authStorage';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmBoundaryView'>;

function readNumber(record: ApiRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function mapPolygonToBoundary(record: ApiRecord): BoundaryPoint[] {
  const boundary = (record.boundary ?? record.mapping ?? record) as ApiRecord;
  const rawPoints =
    (Array.isArray(boundary.boundary_points) && boundary.boundary_points)
    || (Array.isArray(boundary.boundaryPoints) && boundary.boundaryPoints)
    || (Array.isArray(boundary.points) && boundary.points)
    || (Array.isArray(record.boundary_points) && record.boundary_points)
    || null;

  if (Array.isArray(rawPoints) && rawPoints.length > 0) {
    return (rawPoints as ApiRecord[])
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

  const polygon =
    (Array.isArray(record.gps_polygon) && record.gps_polygon)
    || (Array.isArray(boundary.gps_polygon) && boundary.gps_polygon)
    || [];

  return (polygon as unknown[])
    .map((entry, index): BoundaryPoint | null => {
      if (Array.isArray(entry) && entry.length >= 2) {
        const latitude = Number(entry[0]);
        const longitude = Number(entry[1]);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }
        return {
          id: `poly-${index}`,
          pointNo: index + 1,
          latitude,
          longitude,
          accuracy: 8,
          altitude: null,
          timestamp: new Date().toISOString(),
          manual: true,
        };
      }

      if (entry && typeof entry === 'object') {
        const point = entry as ApiRecord;
        const latitude = readNumber(point, 'latitude', 'lat');
        const longitude = readNumber(point, 'longitude', 'lng', 'lon');
        if (latitude == null || longitude == null) {
          return null;
        }
        return {
          id: `poly-obj-${index}`,
          pointNo: index + 1,
          latitude,
          longitude,
          accuracy: readNumber(point, 'accuracy') ?? 8,
          altitude: readNumber(point, 'altitude'),
          timestamp: new Date().toISOString(),
          manual: true,
        };
      }

      return null;
    })
    .filter((point): point is BoundaryPoint => point !== null);
}

/**
 * Farmer read-only farm boundary viewer (Phase 12.2 / 12.9).
 * Reuses ManualBoundaryMap in completed/readOnly mode — no edit, no current-location marker.
 * Done behaves as Back.
 */
export function FarmerFarmBoundaryViewScreen({ navigation, route }: Props) {
  const { farmId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<BoundaryPoint[]>([]);
  const [fitRequest, setFitRequest] = useState(0);
  const [farmerName, setFarmerName] = useState(route.params.farmerName ?? '');
  const [farmerIdLabel, setFarmerIdLabel] = useState(route.params.farmerDisplayId ?? '');
  const [farmName, setFarmName] = useState(route.params.farmName ?? '');
  const [farmIdLabel, setFarmIdLabel] = useState(route.params.farmCode ?? '');
  const [village, setVillage] = useState(route.params.village ?? '');
  const [declaredAreaLabel, setDeclaredAreaLabel] = useState<string | null>(
    route.params.areaLabel ?? null,
  );
  const [farmGps, setFarmGps] = useState<LatLng | null>(null);
  const [boundaryCenter, setBoundaryCenter] = useState<LatLng | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mappingPayload, farmPayload, authUser] = await Promise.all([
          getFarmerFarmMapping(farmId).catch(() => null),
          getFarmerFarmDetail(farmId),
          getAuthUser(),
        ]);

        const farmRecord = (farmPayload as ApiRecord)?.farm
          ? ((farmPayload as ApiRecord).farm as ApiRecord)
          : (farmPayload as ApiRecord);

        const mappingRecord = mappingPayload
          ? ((mappingPayload as ApiRecord).mapping as ApiRecord | undefined)
            ?? ((mappingPayload as ApiRecord).boundary as ApiRecord | undefined)
            ?? (mappingPayload as ApiRecord)
          : null;

        const savedPoints = mapPolygonToBoundary(
          mappingRecord && Object.keys(mappingRecord).length > 0
            ? ({ ...farmRecord, ...mappingRecord } as ApiRecord)
            : farmRecord,
        );

        const authRecord = (authUser ?? {}) as unknown as ApiRecord;
        const profile = (authRecord.farmer_profile as ApiRecord | undefined) ?? authRecord;
        const displayFarmerId = formatFarmerDisplayId({
          farmer_display_id: profile.farmer_display_id ?? authRecord.farmer_display_id,
          farmer_code: profile.farmer_code ?? authRecord.farmer_code,
        });
        const displayFarmId = formatFarmDisplayId({
          farm_display_id: farmRecord.farm_display_id ?? farmRecord.display_id,
          farm_code: farmRecord.farm_code,
        });

        const lat = readNumber(farmRecord, 'latitude', 'gps_latitude', 'farm_latitude');
        const lng = readNumber(farmRecord, 'longitude', 'gps_longitude', 'farm_longitude');
        const centerLat = mappingRecord
          ? readNumber(mappingRecord, 'center_latitude')
          : null;
        const centerLng = mappingRecord
          ? readNumber(mappingRecord, 'center_longitude')
          : null;

        if (!cancelled) {
          setPoints(savedPoints);
          setFitRequest((value) => value + 1);
          setFarmName(
            pickString(farmRecord, 'farm_name', 'name') !== '-'
              ? pickString(farmRecord, 'farm_name', 'name')
              : `Farm ${farmId}`,
          );
          setFarmIdLabel(displayFarmId !== 'ID Pending' ? displayFarmId : getFarmCode(farmRecord));
          setVillage(
            pickString(farmRecord, 'village') !== '-'
              ? pickString(farmRecord, 'village')
              : village || '—',
          );
          const farmFarmerName =
            pickString(farmRecord, 'farmer_name') !== '-'
              ? pickString(farmRecord, 'farmer_name')
              : '';
          setFarmerName(farmerName || authUser?.name || farmFarmerName || '—');
          setFarmerIdLabel(farmerIdLabel || displayFarmerId);
          setFarmGps(lat != null && lng != null ? { latitude: lat, longitude: lng } : null);
          setBoundaryCenter(
            centerLat != null && centerLng != null
              ? { latitude: centerLat, longitude: centerLng }
              : null,
          );
          const hectares = resolveFarmAreaHectares(farmRecord);
          if (hectares != null) {
            setDeclaredAreaLabel(formatHectares(hectares, 4));
          }
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
  }, [farmId]);

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
      farmId: farmIdLabel.trim() || 'ID Pending',
      farmerName: farmerName.trim() || 'Farmer',
      farmerId: farmerIdLabel.trim() || 'ID Pending',
    };
  }, [boundaryCenter, farmGps, farmIdLabel, farmName, farmerIdLabel, farmerName, points]);

  const done = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader title="View Farm" subtitle={farmName || farmerName} onBack={done} />

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
          <Line label="Farmer ID" value={farmerIdLabel} />
          <Line label="Farm" value={farmName} />
          <Line label="Farm ID" value={farmIdLabel} />
          <Line label="Village" value={village} />
          {declaredAreaLabel ? <Line label="Declared Area" value={declaredAreaLabel} /> : null}
          <Line
            label="Mapped Area"
            value={
              metrics
                ? formatHectares(metrics.areaHectare, 4)
                : points.length > 0
                  ? '—'
                  : 'Area not available'
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
