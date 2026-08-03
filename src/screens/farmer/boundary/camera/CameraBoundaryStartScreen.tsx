import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { getFarmerFarmBoundary, getFarmerFarmDetail } from '../../../../api/farmerApi';
import { BoundaryFlowHeader } from '../../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../../context/BoundaryCaptureContext';
import type { FarmerStackParamList } from '../../../../navigation/types';
import { dashboardTheme } from '../../../../theme/bhuguardDashboardTheme';
import type { AreaUnit } from '../../../../utils/boundaryGeometry';
import { MIN_BOUNDARY_POINTS } from '../../../../utils/boundaryGeometry';
import { getFarmCode } from '../../../../utils/farmMapHelpers';
import { pickString, type ApiRecord } from '../../../../utils/apiHelpers';
import { getBoundaryFlowRoutes } from '../../../../utils/boundaryFlowRoutes';
import { boundaryRouteParams, resolveBoundaryFarmId } from '../../../../utils/boundaryNavigation';

type Props = NativeStackScreenProps<FarmerStackParamList, 'CameraBoundaryStart'>;

// Bigha hidden from Farmer-facing boundary UI — client requires Acre/Hectare only.
const UNITS: AreaUnit[] = ['acre', 'hectare'];

export function CameraBoundaryStartScreen({ navigation, route }: Props) {
  const farmId = resolveBoundaryFarmId(route.params);
  const boundary = useBoundaryCapture();
  const routes = getBoundaryFlowRoutes(boundary.sessionMode);
  const { setFarm, setCaptureMethod, loadExistingBoundary, setCurrentLocation } = boundary;
  const [loading, setLoading] = useState(true);
  const [farmName, setFarmName] = useState('Farm');
  const [farmCode, setFarmCode] = useState('BG-FARM-000');

  useEffect(() => {
    setCaptureMethod('camera');
  }, [setCaptureMethod]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        if (boundary.sessionMode === 'onboarding' || boundary.sessionMode === 'prefarm' || !farmId) {
          if (mounted) {
            setFarmName(boundary.farmName);
            setFarmCode(boundary.farmCode);
          }

          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.granted) {
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
            setCurrentLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy ?? 8);
          }

          return;
        }

        const data = (await getFarmerFarmDetail(farmId)) as ApiRecord;
        const farm = (data.farm ?? data) as ApiRecord;
        const name = pickString(farm, 'farm_name', 'name');
        const code = getFarmCode(farm);

        if (mounted) {
          setFarmName(name !== '-' ? name : `Farm ${farmId}`);
          setFarmCode(code);
          setFarm(farmId, name !== '-' ? name : `Farm ${farmId}`, code);
        }

        try {
          const boundaryData = (await getFarmerFarmBoundary(farmId)) as ApiRecord;
          if (mounted && boundaryData.boundary) {
            loadExistingBoundary(boundaryData.boundary as ApiRecord);
          }
        } catch {
          // No existing boundary yet.
        }

        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.granted) {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setCurrentLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy ?? 8);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [farmId, setFarm, loadExistingBoundary, setCurrentLocation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={dashboardTheme.primaryContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title="Capture Farm Boundary"
        subtitle="Walk around your farm and capture each corner."
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.farmCard}>
          <Text style={styles.farmLabel}>Farm Name</Text>
          <Text style={styles.farmName}>{farmName}</Text>
          <Text style={styles.farmCode}>Farm ID: {farmCode}</Text>
        </View>

        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            To map uneven land, stand at every corner or turning point of your farm and take a photo. Bhuguard will save
            GPS coordinates with every photo and calculate your land area.
          </Text>
        </View>

        <InfoRow label="GPS Accuracy" value={boundary.gpsAccuracyLabel} />
        <InfoRow label="Captured Points" value={String(boundary.points.length)} />
        <InfoRow label="Minimum Points Required" value={String(MIN_BOUNDARY_POINTS)} />

        <Text style={styles.unitLabel}>Selected Unit</Text>
        <View style={styles.unitRow}>
          {UNITS.map((unit) => (
            <Pressable
              key={unit}
              style={[styles.unitChip, boundary.unit === unit && styles.unitChipActive]}
              onPress={() => boundary.setUnit(unit)}
            >
              <Text style={[styles.unitChipText, boundary.unit === unit && styles.unitChipTextActive]}>
                {unit.charAt(0).toUpperCase() + unit.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate(routes.cameraLive as 'CameraBoundaryLive', boundaryRouteParams(farmId))}
        >
          <Text style={styles.primaryButtonText}>Start Camera Capture</Text>
        </Pressable>

        <Pressable
          style={styles.outlineButton}
          onPress={() => navigation.navigate(routes.start as 'FarmBoundaryStart', boundaryRouteParams(farmId))}
        >
          <Text style={styles.outlineButtonText}>Use GPS Only Mapping</Text>
        </Pressable>

        {farmId ? (
        <Pressable style={styles.outlineButton} onPress={() => navigation.navigate('FarmerFarmDetail', { farmId })}>
          <Text style={styles.outlineButtonText}>View Existing Boundary</Text>
        </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  farmCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 4,
  },
  farmLabel: { fontSize: 12, color: dashboardTheme.textMuted, fontWeight: '600' },
  farmName: { fontSize: 20, fontWeight: '700', color: dashboardTheme.headingGreen },
  farmCode: { fontSize: 13, color: dashboardTheme.onSurfaceVariant },
  instructionCard: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.secondaryContainer,
  },
  instructionText: { fontSize: 14, lineHeight: 21, color: dashboardTheme.onSurface },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
  },
  infoLabel: { fontSize: 14, color: dashboardTheme.onSurfaceVariant, flex: 1 },
  infoValue: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurface, flex: 1, textAlign: 'right' },
  unitLabel: { fontSize: 14, fontWeight: '600', color: dashboardTheme.onSurfaceVariant, marginTop: 4 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  unitChipActive: { backgroundColor: dashboardTheme.primaryContainer, borderColor: dashboardTheme.primaryContainer },
  unitChipText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer },
  unitChipTextActive: { color: dashboardTheme.onPrimary },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  outlineButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  outlineButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.primaryContainer },
});
