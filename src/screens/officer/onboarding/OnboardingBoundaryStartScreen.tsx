import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';

import { BoundaryFlowHeader } from '../../../components/farmer/boundary/BoundaryFlowHeader';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { getNextIncompleteFarmerOnboardingStep } from '../../../constants/onboardingSteps';
import { continueFarmerOnboardingAfterLandMapping } from '../../../navigation/continueFarmerOnboarding';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { MIN_BOUNDARY_POINTS, type AreaUnit } from '../../../utils/boundaryGeometry';
import { formatFarmDisplayCode, formatFarmerDisplayCode, isValidEntityId, toPositiveEntityId } from '../../../utils/entityId';
import {
  ensureOnboardingFarmerFarm,
  type EnsuredOnboardingIds,
  type EnsureOnboardingFarmerFarmResult,
} from '../../../utils/ensureOnboardingFarmerFarm';
import { mappedAreaLabelForDraft } from '../../../utils/onboardingBoundary';
import { refreshFarmMappingStatus } from '../../../utils/farmMappingStatus';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'OnboardingBoundaryStart'>;

type GateState =
  | { kind: 'loading' }
  | { kind: 'ready'; ids: EnsuredOnboardingIds }
  | { kind: 'missing_profile'; message: string }
  | { kind: 'missing_farm'; message: string }
  | { kind: 'network_error'; message: string };

function buildCaptureParams(ids: EnsuredOnboardingIds, village?: string, mappingStatus?: 'pending' | 'completed') {
  return {
    farmerId: ids.farmerId,
    farmId: ids.farmId,
    farmerName: ids.farmerName,
    farmerCode: ids.farmerCode ?? undefined,
    farmName: ids.farmName ?? undefined,
    farmCode: ids.farmCode ?? undefined,
    village,
    mappingStatus,
  };
}

function resultToGate(result: EnsureOnboardingFarmerFarmResult): GateState {
  if (result.status === 'ready') {
    return { kind: 'ready', ids: result.ids };
  }
  return { kind: result.status, message: result.message };
}

export function OnboardingBoundaryStartScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const { draft, result, updateDraft } = useOnboarding();
  const boundary = useBoundaryCapture();
  const [gate, setGate] = useState<GateState>({ kind: 'loading' });
  const [openingNativeMap, setOpeningNativeMap] = useState(false);
  const [mappingCompleted, setMappingCompleted] = useState(false);
  const gpsStartedRef = useRef(false);
  const openingNativeMapRef = useRef(false);
  const continuingRef = useRef(false);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const ensuringRef = useRef(false);

  const applySession = useCallback(
    (ids: EnsuredOnboardingIds) => {
      const currentDraft = draftRef.current;
      const farmName =
        ids.farmName
        ?? route.params?.farmName
        ?? (currentDraft.village_name ? `${currentDraft.village_name} - ${currentDraft.land_survey_number}` : 'Farm');
      const farmerName = ids.farmerName || route.params?.farmerName || currentDraft.farmer_name || 'Farmer';

      boundary.setSession({
        sessionMode: 'onboarding',
        farmId: ids.farmId,
        farmerId: ids.farmerId,
        farmName,
        farmCode: ids.farmCode ?? route.params?.farmCode ?? '',
        farmerName,
        declaredArea: route.params?.landArea ?? currentDraft.land_area,
        declaredUnit: route.params?.landAreaUnit ?? ((currentDraft.land_area_unit as AreaUnit) || 'acre'),
        unit: route.params?.landAreaUnit ?? ((currentDraft.land_area_unit as AreaUnit) || 'acre'),
      });
      boundary.setPoints(currentDraft.boundary_points);
      boundary.setCaptureMethod(currentDraft.boundary_capture_method);
    },
    [boundary, route.params],
  );

  const resolveGate = useCallback(async () => {
    if (ensuringRef.current) {
      return;
    }
    ensuringRef.current = true;
    setGate({ kind: 'loading' });

    try {
      const currentDraft = draftRef.current;
      const routeFarmerId = toPositiveEntityId(route.params?.farmerId);
      const routeFarmId = toPositiveEntityId(route.params?.farmId);

      if (routeFarmerId != null && routeFarmId != null) {
        const ids: EnsuredOnboardingIds = {
          farmerId: routeFarmerId,
          farmId: routeFarmId,
          farmerCode: route.params?.farmerCode?.trim() || currentDraft.farmer_code || null,
          farmerDisplayId: currentDraft.farmer_display_id || null,
          farmCode: route.params?.farmCode?.trim() || currentDraft.farm_code || null,
          farmDisplayId: currentDraft.farm_display_id || null,
          farmerName: route.params?.farmerName?.trim() || currentDraft.farmer_name || 'Farmer',
          farmName: route.params?.farmName?.trim() || currentDraft.farm_name || null,
        };
        updateDraft({
          farmer_id: ids.farmerId,
          farm_id: ids.farmId,
          farmer_code: ids.farmerCode ?? '',
          farmer_display_id: ids.farmerDisplayId ?? '',
          farm_code: ids.farmCode ?? '',
          farm_display_id: ids.farmDisplayId ?? '',
          farm_name: ids.farmName ?? '',
        });
        applySession(ids);
        setGate({ kind: 'ready', ids });
        return;
      }

      const result = await ensureOnboardingFarmerFarm(currentDraft);
      const nextGate = resultToGate(result);

      if (nextGate.kind === 'ready') {
        updateDraft({
          farmer_id: nextGate.ids.farmerId,
          farm_id: nextGate.ids.farmId,
          farmer_code: nextGate.ids.farmerCode ?? '',
          farmer_display_id: nextGate.ids.farmerDisplayId ?? '',
          farm_code: nextGate.ids.farmCode ?? '',
          farm_display_id: nextGate.ids.farmDisplayId ?? '',
          farm_name: nextGate.ids.farmName ?? '',
        });
        applySession(nextGate.ids);
      }

      setGate(nextGate);
    } finally {
      ensuringRef.current = false;
    }
  }, [applySession, route.params, updateDraft]);

  const refreshMappingFromBackend = useCallback(async (farmerId: number, farmId: number) => {
    const status = await refreshFarmMappingStatus(farmerId, farmId);
    if (status.mapped) {
      setMappingCompleted(true);
      updateDraft({ boundary_mapping_status: 'mapped' });
    }
  }, [updateDraft]);

  useFocusEffect(
    useCallback(() => {
      void resolveGate();
    }, [resolveGate]),
  );

  useFocusEffect(
    useCallback(() => {
      if (gate.kind !== 'ready') {
        return;
      }
      void refreshMappingFromBackend(gate.ids.farmerId, gate.ids.farmId);
    }, [gate, refreshMappingFromBackend]),
  );

  useFocusEffect(
    useCallback(() => {
      if (gpsStartedRef.current) {
        return;
      }
      gpsStartedRef.current = true;

      const initGps = async () => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          return;
        }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        boundary.setCurrentLocation(
          position.coords.latitude,
          position.coords.longitude,
          position.coords.accuracy ?? 8,
        );
      };

      void initGps();
    }, [boundary]),
  );

  const handleStartFarmMapping = useCallback(() => {
    if (openingNativeMapRef.current || gate.kind !== 'ready') {
      return;
    }
    const ids = gate.ids;
    if (!isValidEntityId(ids.farmerId) || !isValidEntityId(ids.farmId)) {
      return;
    }

    openingNativeMapRef.current = true;
    setOpeningNativeMap(true);

    const village = route.params?.village ?? draft.village_name;
    const mappingStatus: 'pending' | 'completed' =
      mappingCompleted
      || route.params?.mappingStatus === 'completed'
      || draft.boundary_mapping_status === 'mapped'
      || draft.boundary_mapping_status === 'pending_review'
        ? 'completed'
        : 'pending';

    navigation.navigate('FarmBoundaryMap', {
      farmerId: ids.farmerId,
      farmId: ids.farmId,
      farmerName: ids.farmerName,
      farmerCode: ids.farmerCode ?? undefined,
      farmName: ids.farmName ?? undefined,
      farmCode: ids.farmCode ?? undefined,
      village: village || undefined,
      mappingStatus,
      declaredArea: (route.params?.landArea ?? draft.land_area) || undefined,
      declaredAreaUnit: route.params?.landAreaUnit ?? ((draft.land_area_unit as AreaUnit) || undefined),
      returnScreen: 'OnboardingBoundaryStart',
    });

    // Allow re-entry when user returns to this screen.
    setTimeout(() => {
      openingNativeMapRef.current = false;
      setOpeningNativeMap(false);
    }, 600);
  }, [
    draft.boundary_mapping_status,
    draft.land_area,
    draft.land_area_unit,
    draft.village_name,
    gate,
    mappingCompleted,
    navigation,
    route.params?.landArea,
    route.params?.landAreaUnit,
    route.params?.mappingStatus,
    route.params?.village,
  ]);

  if (gate.kind === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BoundaryFlowHeader
          title="Map Land Boundary"
          subtitle="Loading Farmer and Farm details…"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={dashboardTheme.primaryContainer} />
          <Text style={styles.loadingText}>Loading Farmer and Farm details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (gate.kind === 'missing_farm' || gate.kind === 'missing_profile') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BoundaryFlowHeader
          title="Map Land Boundary"
          subtitle="Farm Details required"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <Text style={styles.errorText}>{gate.message}</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate(gate.kind === 'missing_profile' ? 'FarmerBasicDetails' : 'FarmerLandDetails')}
          >
            <Text style={styles.primaryButtonText}>
              {gate.kind === 'missing_profile' ? 'Complete Farmer Details' : 'Go to Farm Details'}
            </Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => navigation.goBack()}>
            <Text style={styles.outlineButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (gate.kind === 'network_error') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BoundaryFlowHeader
          title="Map Land Boundary"
          subtitle="Could not prepare farm"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <Text style={styles.errorText}>{gate.message}</Text>
          <Pressable style={styles.primaryButton} onPress={() => void resolveGate()}>
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => navigation.goBack()}>
            <Text style={styles.outlineButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const ensured = gate.ids;
  if (!isValidEntityId(ensured.farmerId) || !isValidEntityId(ensured.farmId)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BoundaryFlowHeader
          title="Map Land Boundary"
          subtitle="Farm Details required"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content}>
          <Text style={styles.errorText}>Please complete and save the Farm Details step before mapping.</Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('FarmerLandDetails')}>
            <Text style={styles.primaryButtonText}>Go to Farm Details</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const mappedLabel = mappedAreaLabelForDraft(draft);
  const village = route.params?.village ?? draft.village_name;
  const captureParams = buildCaptureParams(
    ensured,
    village,
    route.params?.mappingStatus
      ?? (draft.boundary_mapping_status === 'mapped' || draft.boundary_mapping_status === 'pending_review'
        ? 'completed'
        : 'pending'),
  );
  const mappingIsDone =
    mappingCompleted
    || captureParams.mappingStatus === 'completed'
    || draft.boundary_mapping_status === 'mapped'
    || draft.boundary_mapping_status === 'pending_review';
  const nextAfterMapping = getNextIncompleteFarmerOnboardingStep(draft, result);

  const continueOnboarding = () => {
    if (continuingRef.current) {
      return;
    }

    continuingRef.current = true;
    continueFarmerOnboardingAfterLandMapping(navigation, draft, result, {
      farmerId: ensured.farmerId,
      farmId: ensured.farmId,
      farmerName: ensured.farmerName,
      farmName: ensured.farmName ?? undefined,
      farmCode: ensured.farmCode ?? undefined,
      farmerCode: ensured.farmerCode ?? undefined,
      village: village || undefined,
      mappingStatus: mappingIsDone ? 'completed' : 'pending',
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <BoundaryFlowHeader
        title="Map Land Boundary"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Farmer</Text>
          <Text style={styles.value}>{ensured.farmerName}</Text>
          <Text style={styles.label}>Farmer ID</Text>
          <Text style={styles.value}>{formatFarmerDisplayCode(ensured.farmerId, ensured.farmerCode)}</Text>
          <Text style={styles.label}>Farm</Text>
          <Text style={styles.value}>
            {ensured.farmName
              ?? (draft.village_name ? `${draft.village_name} - ${draft.land_survey_number}` : 'Farm')}
          </Text>
          <Text style={styles.label}>Farm ID</Text>
          <Text style={styles.value}>{formatFarmDisplayCode(ensured.farmId, ensured.farmCode)}</Text>
          <Text style={styles.label}>Village</Text>
          <Text style={styles.value}>{village || '—'}</Text>
          <Text style={styles.label}>Declared area</Text>
          <Text style={styles.value}>
            {route.params?.landArea ?? (draft.land_area || '-')} {route.params?.landAreaUnit ?? draft.land_area_unit}
          </Text>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>
            {mappingIsDone ? 'Mapping Completed' : 'Pending'}
          </Text>
          <Text style={styles.label}>GPS accuracy</Text>
          <Text style={styles.value}>{boundary.gpsAccuracyLabel}</Text>
          <Text style={styles.label}>Captured points</Text>
          <Text style={styles.value}>
            {boundary.points.length} / min {MIN_BOUNDARY_POINTS}
          </Text>
          {mappedLabel ? <Text style={styles.mapped}>Mapped: {mappedLabel}</Text> : null}
        </View>

        {mappingIsDone ? (
          <Pressable style={styles.primaryButton} onPress={continueOnboarding}>
            <Text style={styles.primaryButtonText}>
              {nextAfterMapping?.key === 'documents'
                ? 'Continue to Documents'
                : nextAfterMapping?.key === 'farm_mapping'
                  ? 'Continue to Farm Mapping'
                  : nextAfterMapping?.key === 'consent_legal'
                    ? 'Continue to Consent & Legal'
                : nextAfterMapping?.key === 'final_review_submit'
                  ? 'Continue to Final Review'
                  : 'Continue Onboarding'}
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          style={[
            mappingIsDone ? styles.outlineButton : styles.primaryButton,
            openingNativeMap && styles.buttonDisabled,
          ]}
          disabled={openingNativeMap}
          onPress={handleStartFarmMapping}
        >
          <Text style={mappingIsDone ? styles.outlineButtonText : styles.primaryButtonText}>
            {openingNativeMap
              ? 'Opening map…'
              : mappingIsDone
                ? 'View / Edit Farm Boundary'
                : 'Start Farm Mapping'}
          </Text>
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
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  loadingText: {
    textAlign: 'center',
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '600',
  },
  content: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 4,
  },
  label: { marginTop: 6, fontSize: 12, fontWeight: '600', color: dashboardTheme.onSurfaceVariant },
  value: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onSurface },
  mapped: { marginTop: 8, fontSize: 13, fontWeight: '700', color: dashboardTheme.primary },
  errorText: { fontSize: 15, lineHeight: 22, color: '#B91C1C', fontWeight: '600', marginBottom: 12 },
  primaryButton: {
    backgroundColor: dashboardTheme.primaryContainer,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onPrimary },
  buttonDisabled: { opacity: 0.55 },
  outlineButton: {
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  outlineButtonText: { fontSize: 14, fontWeight: '700', color: dashboardTheme.primaryContainer },
  cancelButton: { paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: dashboardTheme.onSurfaceVariant },
});
