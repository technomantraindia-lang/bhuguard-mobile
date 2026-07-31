import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Location from 'expo-location';

import {
  getFieldOfficerFarmMapping,
  getFieldOfficerFarmerFarms,
  updateFieldOfficerFarmMapping,
} from '../../../api/fieldOfficerApi';
import {
  FoBoundaryActionFooter,
  type FoBoundaryWorkflowState,
} from '../../../components/officer/boundary/FoBoundaryActionFooter';
import { ManualBoundaryMap } from '../../../components/officer/boundary/ManualBoundaryMap';
import { useBoundaryCapture } from '../../../context/BoundaryCaptureContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { useManualBoundaryDrawing } from '../../../hooks/useManualBoundaryDrawing';
import { sampleHighAccuracyGps } from '../../../hooks/useHighAccuracyGps';
import { continueFarmerOnboardingAfterLandMapping } from '../../../navigation/continueFarmerOnboarding';
import type { FieldOfficerStackParamList } from '../../../navigation/types';
import { dashboardTheme } from '../../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../../utils/apiHelpers';
import { BIGHA_PER_ACRE, type BoundaryPoint } from '../../../utils/boundaryGeometry';
import { MIN_BOUNDARY_POINTS } from '../../../utils/foBoundaryGeometry';
import {
  formatFarmDisplayCode,
  formatFarmerDisplayCode,
  isValidEntityId,
  toPositiveEntityId,
} from '../../../utils/entityId';
import type { LatLng } from '../../../utils/farmSatelliteMap';
import {
  clearFarmBoundaryRecovery,
  loadFarmBoundaryRecovery,
  saveFarmBoundaryRecovery,
} from '../../../utils/farmBoundaryRecovery';
import { formatGpsAccuracy } from '../../../utils/formatGpsAccuracy';
import {
  buildManualBoundaryUploadPayload,
  formatManualGpsAccuracy,
  formatManualGpsAccuracyLabel,
  polygonCentroid,
  SQUARE_METERS_PER_ACRE,
  SQUARE_METERS_PER_HECTARE,
} from '../../../utils/manualBoundaryGeometry';
import {
  hasMapTilerApiKey,
  mapStyleModeToApiMapType,
  type MapTilerStyleMode,
} from '../../../utils/mapTilerConfig';

type MapRouteName = 'FarmBoundaryMap' | 'OnboardingBoundaryCapture';
type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, MapRouteName>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, MapRouteName>;

const MAP_HEIGHT = Math.max(280, Math.round(Dimensions.get('window').height * 0.48));
const MAP_HEIGHT_SAVED = Math.max(280, Math.round(Dimensions.get('window').height * 0.38));

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
        id: `saved-${pointNo}-${index}`,
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

function parseDeclaredAreaAcres(rawArea: string | null | undefined, unitRaw: string | null | undefined): number | null {
  if (!rawArea?.trim()) {
    return null;
  }
  const value = Number(String(rawArea).replace(/,/g, '').trim());
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  const unit = (unitRaw || 'acre').toLowerCase();
  if (unit.startsWith('hect')) {
    return value * (SQUARE_METERS_PER_HECTARE / SQUARE_METERS_PER_ACRE);
  }
  if (unit.startsWith('bigh')) {
    return value / BIGHA_PER_ACRE;
  }
  return value;
}

function workflowLocalStatusLabel(state: FoBoundaryWorkflowState): string {
  switch (state) {
    case 'ready':
      return 'Ready';
    case 'drawing':
      return 'Drawing';
    case 'completed_unsaved':
      return 'Boundary Completed — Not Saved';
    case 'editing':
      return 'Editing Boundary';
    case 'saving':
      return 'Saving Boundary…';
    case 'saved':
      return 'Saved';
    case 'save_failed':
      return 'Save failed';
    default:
      return 'Pending';
  }
}

export function FarmBoundaryManualDrawScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const {
    points: contextPoints,
    unit,
    mappingStatus,
    farmId,
    farmerId,
    farmName,
    farmCode,
    farmerName,
    currentLatitude,
    currentLongitude,
    currentAccuracy,
    currentAltitude,
    mappingStartedAt,
    setCaptureMethod,
    setPoints,
    setCurrentLocation,
    setSession,
    setFarm,
    finishBoundaryMapping,
    loadExistingBoundary,
  } = useBoundaryCapture();
  const { draft, result, updateDraft } = useOnboarding();
  const gpsWatchRef = useRef<Location.LocationSubscription | null>(null);
  const syncedPointsSignatureRef = useRef('');
  const savingRef = useRef(false);
  const navigatedAfterSaveRef = useRef(false);
  const recoveryCheckedRef = useRef(false);
  const mountedRef = useRef(true);

  const [mapStyleMode, setMapStyleMode] = useState<MapTilerStyleMode>('satellite');
  const [followGps, setFollowGps] = useState(true);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);
  const [farmLocation, setFarmLocation] = useState<LatLng | null>(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [resolvingFarm, setResolvingFarm] = useState(false);
  const [mapUsable, setMapUsable] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [gpsWarningDismissed, setGpsWarningDismissed] = useState(false);
  const mapConfigReady = hasMapTilerApiKey();
  const canStartDrawing = mapConfigReady && mapUsable && !resolvingFarm;

  const drawing = useManualBoundaryDrawing({
    initialPoints: contextPoints,
    currentAccuracy,
    currentAltitude,
    initialPersistedToBhuguard:
      contextPoints.length >= MIN_BOUNDARY_POINTS && mappingStatus === 'completed',
  });

  const currentLocation =
    currentLatitude !== null && currentLongitude !== null
      ? { latitude: currentLatitude, longitude: currentLongitude }
      : null;

  const resolvedFarmerId = toPositiveEntityId(route.params?.farmerId) ?? toPositiveEntityId(farmerId) ?? toPositiveEntityId(draft.farmer_id);
  const resolvedFarmId = toPositiveEntityId(route.params?.farmId) ?? toPositiveEntityId(farmId) ?? toPositiveEntityId(draft.farm_id);
  const displayFarmerName = route.params?.farmerName || farmerName || draft.farmer_name || 'Farmer';
  const displayFarmName =
    route.params?.farmName
    || farmName
    || draft.farm_name
    || (draft.village_name ? `${draft.village_name} - ${draft.land_survey_number}` : 'Farm');
  const village = route.params?.village?.trim() || draft.village_name?.trim() || '—';
  const displayFarmerCode = formatFarmerDisplayCode(
    resolvedFarmerId,
    route.params?.farmerCode || draft.farmer_code || undefined,
  );
  const displayFarmIdLabel = formatFarmDisplayCode(
    resolvedFarmId,
    route.params?.farmCode || farmCode || draft.farm_code || undefined,
  );
  const declaredAreaRaw = route.params?.declaredArea?.trim() || draft.land_area?.trim() || null;
  const declaredAreaUnit = route.params?.declaredAreaUnit || draft.land_area_unit || '';
  const declaredAreaLabel = declaredAreaRaw
    ? `${declaredAreaRaw}${declaredAreaUnit ? ` ${declaredAreaUnit}` : ''}`
    : null;
  const returnScreen = route.params?.returnScreen ?? 'OnboardingBoundaryStart';

  const workflowState: FoBoundaryWorkflowState = useMemo(() => {
    if (saving) {
      return 'saving';
    }
    if (drawing.phase === 'editing') {
      return 'editing';
    }
    if (drawing.persistedToBhuguard) {
      return 'saved';
    }
    if (saveFailed && drawing.phase === 'completed') {
      return 'save_failed';
    }
    if (drawing.phase === 'drawing') {
      return 'drawing';
    }
    if (drawing.phase === 'completed') {
      return 'completed_unsaved';
    }
    return 'ready';
  }, [drawing.persistedToBhuguard, drawing.phase, saveFailed, saving]);

  // Backend Completed only when this session has confirmed persistence (load or save).
  const backendMappingStatus = drawing.persistedToBhuguard
    ? 'Completed'
    : 'Pending / Not Saved';

  const localStatusLabel = workflowLocalStatusLabel(workflowState);

  const mappedAcres = drawing.validation.metrics?.areaAcre ?? null;
  const declaredAcres = useMemo(
    () => parseDeclaredAreaAcres(declaredAreaRaw, declaredAreaUnit),
    [declaredAreaRaw, declaredAreaUnit],
  );
  const areaDifferenceAcres =
    mappedAcres != null && declaredAcres != null
      ? Number((mappedAcres - declaredAcres).toFixed(4))
      : null;
  const areaDiffSignificant =
    areaDifferenceAcres != null
    && declaredAcres != null
    && declaredAcres > 0
    && (Math.abs(areaDifferenceAcres) > 1 || Math.abs(areaDifferenceAcres) / declaredAcres > 0.3);

  const gpsFormat = formatGpsAccuracy(currentAccuracy);
  const showGpsWarning =
    !gpsWarningDismissed
    && (gpsFormat.status === 'poor' || gpsFormat.status === 'very_poor')
    && typeof currentAccuracy === 'number';

  const canSaveBoundary =
    drawing.validation.valid
    && drawing.points.length >= MIN_BOUNDARY_POINTS
    && (drawing.validation.metrics?.areaSquareMeters ?? 0) > 0
    && !saving;

  const startDrawingLabel = resolvingFarm
    ? 'Preparing…'
    : !mapConfigReady
      ? 'MapTiler key missing'
      : !mapUsable
        ? 'Waiting for Hybrid map…'
        : 'Start Drawing';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (workflowState !== 'ready' && summaryExpanded) {
      setSummaryExpanded(false);
    }
    // Collapse once when mapping begins; user can re-expand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowState === 'ready' ? 'ready' : 'mapping']);

  useEffect(() => {
    const paramFarmerId = toPositiveEntityId(route.params?.farmerId);
    const paramFarmId = toPositiveEntityId(route.params?.farmId);
    if (paramFarmerId == null || paramFarmId == null) {
      return;
    }

    setSession({
      sessionMode: 'onboarding',
      farmerId: paramFarmerId,
      farmId: paramFarmId,
      farmerName: route.params.farmerName || draft.farmer_name || 'Farmer',
      farmName:
        route.params.farmName
        || draft.farm_name
        || (draft.village_name ? `${draft.village_name} - ${draft.land_survey_number}` : 'Farm'),
      farmCode: route.params.farmCode || draft.farm_code || '',
      declaredArea: route.params.declaredArea || draft.land_area,
      declaredUnit: route.params.declaredAreaUnit || ((draft.land_area_unit as 'acre' | 'hectare' | 'bigha') || 'acre'),
      unit: route.params.declaredAreaUnit || ((draft.land_area_unit as 'acre' | 'hectare' | 'bigha') || 'acre'),
    });
    updateDraft({
      farmer_id: paramFarmerId,
      farm_id: paramFarmId,
      farmer_code: route.params.farmerCode || draft.farmer_code,
      farm_code: route.params.farmCode || draft.farm_code,
      farm_name: route.params.farmName || draft.farm_name,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.farmerId, route.params?.farmId]);

  const ensureFarmForDrawing = useCallback(async (): Promise<boolean> => {
    if (isValidEntityId(resolvedFarmerId) && isValidEntityId(resolvedFarmId)) {
      return true;
    }

    if (!isValidEntityId(resolvedFarmerId)) {
      Alert.alert(
        'Farmer missing',
        'No farm record was found. Please complete the Farm Details step first.',
      );
      return false;
    }

    setResolvingFarm(true);
    try {
      const farms = await getFieldOfficerFarmerFarms(resolvedFarmerId!);
      if (!farms.length) {
        Alert.alert(
          'No farm found',
          'No farm record was found. Please complete the Farm Details step first.',
        );
        return false;
      }

      if (farms.length === 1) {
        const only = farms[0];
        const nextFarmId = toPositiveEntityId(only.id);
        if (nextFarmId == null) {
          Alert.alert('No farm found', 'No farm record was found. Please complete the Farm Details step first.');
          return false;
        }
        setFarm(nextFarmId, only.location_name || only.village || 'Farm', only.farm_code || '');
        updateDraft({
          farm_id: nextFarmId,
          farm_code: only.farm_code || '',
          farm_name: only.location_name || only.village || '',
        });
        return true;
      }

      return await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Select farm',
          'This farmer has more than one farm. Choose the correct farm before starting drawing.',
          [
            ...farms.slice(0, 3).map((farm) => ({
              text: farm.farm_code || farm.location_name || `Farm ${farm.id}`,
              onPress: () => {
                const nextFarmId = toPositiveEntityId(farm.id);
                if (nextFarmId == null) {
                  resolve(false);
                  return;
                }
                setFarm(nextFarmId, farm.location_name || farm.village || 'Farm', farm.farm_code || '');
                updateDraft({
                  farm_id: nextFarmId,
                  farm_code: farm.farm_code || '',
                  farm_name: farm.location_name || farm.village || '',
                });
                resolve(true);
              },
            })),
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          ],
        );
      });
    } catch {
      Alert.alert('Farm lookup failed', 'Could not load farms for this farmer. Please try again.');
      return false;
    } finally {
      setResolvingFarm(false);
    }
  }, [resolvedFarmerId, resolvedFarmId, setFarm, updateDraft]);

  const handleStartDrawing = useCallback(async () => {
    const ready = await ensureFarmForDrawing();
    if (!ready) {
      return;
    }
    setSaveFailed(false);
    setSaveErrorMessage(null);
    setShowSuccessBanner(false);
    drawing.startDrawing();
  }, [drawing, ensureFarmForDrawing]);

  useFocusEffect(
    useCallback(() => {
      setCaptureMethod('manual');

      let active = true;
      const startGps = async () => {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted || !active) {
          return;
        }

        const services = await Location.hasServicesEnabledAsync();
        if (!services) {
          Alert.alert('Location services off', 'Enable device location services to use GPS centering.');
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 1,
            timeInterval: 2000,
          },
          (position) => {
            if (!active) {
              return;
            }
            setCurrentLocation(
              position.coords.latitude,
              position.coords.longitude,
              position.coords.accuracy ?? 12,
              position.coords.altitude,
            );
          },
        );

        gpsWatchRef.current = subscription;
      };

      void startGps();

      return () => {
        active = false;
        gpsWatchRef.current?.remove();
        gpsWatchRef.current = null;
      };
    }, [setCaptureMethod, setCurrentLocation]),
  );

  useEffect(() => {
    const signature = drawing.points
      .map((point) => `${point.id}:${point.latitude}:${point.longitude}:${point.pointNo}`)
      .join('|');

    if (signature === syncedPointsSignatureRef.current) {
      return;
    }

    syncedPointsSignatureRef.current = signature;
    setPoints(drawing.points);

    if (farmId && drawing.points.length > 0 && !drawing.persistedToBhuguard) {
      void saveFarmBoundaryRecovery({
        farmId,
        farmerId,
        vertices: drawing.points,
        phase: drawing.phase,
        mapCenter: mapCenter,
        timestamp: new Date().toISOString(),
      });
    }
  }, [drawing.persistedToBhuguard, drawing.phase, drawing.points, farmId, farmerId, mapCenter, setPoints]);

  useEffect(() => {
    if (!farmId || !farmerId || recoveryCheckedRef.current) {
      return;
    }

    recoveryCheckedRef.current = true;
    let cancelled = false;

    const bootstrap = async () => {
      setLoadingExisting(true);
      try {
        const recovery = await loadFarmBoundaryRecovery(farmId);
        if (cancelled) {
          return;
        }

        if (recovery && recovery.vertices.length > 0 && contextPoints.length === 0) {
          Alert.alert(
            'Resume mapping?',
            'Unsaved boundary points were found for this farm.',
            [
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => {
                  void clearFarmBoundaryRecovery(farmId);
                },
              },
              {
                text: 'Resume',
                onPress: () => {
                  drawing.loadPoints(recovery.vertices, false);
                  if (recovery.phase === 'drawing' || recovery.phase === 'completed' || recovery.phase === 'editing') {
                    drawing.setPhase(recovery.phase === 'editing' ? 'completed' : recovery.phase);
                  }
                  setFitRequest((value) => value + 1);
                },
              },
            ],
          );
        }

        try {
          const payload = (await getFieldOfficerFarmMapping(farmerId, farmId)) as ApiRecord;
          const boundary = (payload.boundary ?? payload.mapping ?? payload) as ApiRecord;
          const centerLat = readNumber(boundary, 'center_latitude', 'centerLatitude', 'latitude');
          const centerLng = readNumber(boundary, 'center_longitude', 'centerLongitude', 'longitude');
          if (
            !cancelled
            && centerLat != null
            && centerLng != null
            && centerLat >= -90
            && centerLat <= 90
            && centerLng >= -180
            && centerLng <= 180
          ) {
            setFarmLocation({ latitude: centerLat, longitude: centerLng });
          }

          const savedPoints = mapApiPointsToBoundary(payload);
          if (!cancelled && savedPoints.length >= MIN_BOUNDARY_POINTS && drawing.points.length === 0) {
            drawing.loadPoints(savedPoints, true);
            loadExistingBoundary(payload);
            setShowSuccessBanner(false);
            setFitRequest((value) => value + 1);
          }
        } catch {
          // 404 = mapping pending — expected
        }
      } finally {
        if (!cancelled) {
          setLoadingExisting(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId, farmerId]);

  const centerGps = useCallback(async () => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Location required', 'Enable location permission to center the map on your GPS position.');
      return;
    }

    setFollowGps(true);
    setGpsWarningDismissed(false);

    try {
      const reading = await sampleHighAccuracyGps();
      setCurrentLocation(
        reading.latitude,
        reading.longitude,
        reading.accuracy ?? 12,
        reading.altitude,
      );
      setMapCenter({ latitude: reading.latitude, longitude: reading.longitude });
    } catch {
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
      setCurrentLocation(
        position.coords.latitude,
        position.coords.longitude,
        position.coords.accuracy ?? 12,
        position.coords.altitude,
      );
      setMapCenter({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    }
  }, [setCurrentLocation]);

  const handleCompleteBoundary = useCallback(() => {
    if (drawing.points.length < MIN_BOUNDARY_POINTS) {
      Alert.alert('Invalid boundary', 'Please add at least 3 boundary points to submit.');
      return;
    }
    const error = drawing.completeBoundary();
    if (error) {
      Alert.alert('Invalid boundary', error);
      return;
    }
    setSaveFailed(false);
    setSaveErrorMessage(null);
    setShowSuccessBanner(false);
    setFitRequest((value) => value + 1);
  }, [drawing]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Farm Boundary?',
      'This will remove all captured points and calculated area.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Boundary',
          style: 'destructive',
          onPress: () => {
            drawing.resetBoundary();
            setSaveFailed(false);
            setSaveErrorMessage(null);
            setShowSuccessBanner(false);
            if (farmId) {
              void clearFarmBoundaryRecovery(farmId);
            }
          },
        },
      ],
    );
  }, [drawing, farmId]);

  const handleSaveChanges = useCallback(() => {
    const error = drawing.finishEditMode();
    if (error) {
      Alert.alert('Invalid boundary', error);
      return;
    }
    setSaveFailed(false);
    setShowSuccessBanner(false);
    setFitRequest((value) => value + 1);
  }, [drawing]);

  const handleCancelEdit = useCallback(() => {
    drawing.cancelEditMode();
  }, [drawing]);

  const persistToApi = useCallback(async (): Promise<boolean> => {
    const activeFarmerId = resolvedFarmerId ?? toPositiveEntityId(farmerId);
    const activeFarmId = resolvedFarmId ?? toPositiveEntityId(farmId);

    if (!isValidEntityId(activeFarmerId) || !isValidEntityId(activeFarmId)) {
      Alert.alert('Farm required', 'Select a farmer and farm before saving the boundary.');
      return false;
    }

    if (!drawing.validation.valid) {
      Alert.alert('Invalid boundary', drawing.validation.message ?? 'Please adjust the boundary points.');
      return false;
    }

    const payload = buildManualBoundaryUploadPayload(
      activeFarmId!,
      unit,
      drawing.points,
      formatManualGpsAccuracy(currentAccuracy),
      {
        mappingStartedAt: drawing.drawingStartedAt ?? mappingStartedAt,
        mappingFinishedAt: drawing.drawingCompletedAt ?? new Date().toISOString(),
        status: 'completed',
        mapType: mapStyleModeToApiMapType(mapStyleMode),
        mapProvider: 'maptiler_maplibre',
        mapStyle: mapStyleMode === 'street' ? 'streets-v4' : 'hybrid-v4',
        captureMethod: 'manual_hybrid_tap',
        officerLatitude: currentLatitude,
        officerLongitude: currentLongitude,
        officerAccuracy: currentAccuracy,
        village: village !== '—' ? village : null,
      },
    );

    await updateFieldOfficerFarmMapping(activeFarmerId!, activeFarmId!, payload);
    await clearFarmBoundaryRecovery(activeFarmId!);
    drawing.markPersistedToBhuguard();
    finishBoundaryMapping();
    return true;
  }, [
    currentAccuracy,
    currentLatitude,
    currentLongitude,
    drawing,
    farmId,
    farmerId,
    finishBoundaryMapping,
    mapStyleMode,
    mappingStartedAt,
    resolvedFarmId,
    resolvedFarmerId,
    unit,
    village,
  ]);

  const navigateAfterDone = useCallback(() => {
    const activeFarmerId = resolvedFarmerId ?? toPositiveEntityId(farmerId);
    const activeFarmId = resolvedFarmId ?? toPositiveEntityId(farmId);

    if (returnScreen === 'OnboardingBoundaryStart') {
      navigation.navigate('OnboardingBoundaryStart', {
        farmerId: activeFarmerId ?? undefined,
        farmId: activeFarmId ?? undefined,
        farmerName: displayFarmerName,
        farmName: displayFarmName,
        farmCode: route.params?.farmCode || farmCode || draft.farm_code || undefined,
        farmerCode: route.params?.farmerCode || draft.farmer_code || undefined,
        village: village !== '—' ? village : undefined,
        mappingStatus: 'completed',
        landArea: route.params?.declaredArea || draft.land_area || undefined,
        landAreaUnit: route.params?.declaredAreaUnit || (draft.land_area_unit as 'acre' | 'hectare' | 'bigha') || undefined,
      });
      return;
    }

    navigation.navigate('OnboardingBoundaryPreview', {
      farmerId: activeFarmerId ?? undefined,
      farmId: activeFarmId ?? undefined,
      farmerName: displayFarmerName,
      farmName: displayFarmName,
      farmCode: route.params?.farmCode || farmCode || draft.farm_code || undefined,
      farmerCode: route.params?.farmerCode || draft.farmer_code || undefined,
      village: village !== '—' ? village : undefined,
      mappingStatus: 'completed',
    });
  }, [
    displayFarmName,
    displayFarmerName,
    draft.farm_code,
    draft.farmer_code,
    draft.land_area,
    draft.land_area_unit,
    farmCode,
    farmId,
    farmerId,
    navigation,
    resolvedFarmId,
    resolvedFarmerId,
    returnScreen,
    route.params?.declaredArea,
    route.params?.declaredAreaUnit,
    route.params?.farmCode,
    route.params?.farmerCode,
    village,
  ]);

  const saveBoundary = useCallback(async () => {
    if (savingRef.current) {
      return;
    }

    if (drawing.phase === 'editing') {
      const editError = drawing.finishEditMode();
      if (editError) {
        Alert.alert('Invalid boundary', editError);
        return;
      }
    } else if (drawing.phase === 'drawing') {
      const completeError = drawing.completeBoundary();
      if (completeError) {
        Alert.alert('Invalid boundary', completeError);
        return;
      }
    }

    if (!drawing.validation.valid || drawing.points.length < MIN_BOUNDARY_POINTS) {
      Alert.alert(
        'Invalid boundary',
        drawing.points.length < MIN_BOUNDARY_POINTS
          ? 'Please add at least 3 boundary points to submit.'
          : (drawing.validation.message ?? 'Please complete a valid boundary first.'),
      );
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveFailed(false);
    setSaveErrorMessage(null);
    setShowSuccessBanner(false);

    try {
      setPoints(drawing.points);
      setCaptureMethod('manual');
      const center =
        polygonCentroid(drawing.points.map((point) => ({ latitude: point.latitude, longitude: point.longitude })))
        ?? (drawing.points[0]
          ? { latitude: drawing.points[0].latitude, longitude: drawing.points[0].longitude }
          : null);
      const lastAccuracy = drawing.points[drawing.points.length - 1]?.accuracy;

      updateDraft({
        boundary_points: drawing.points,
        boundary_unit: unit,
        boundary_capture_method: 'manual',
        boundary_mapping_status: 'mapped',
        boundary_verification_status: 'pending_review',
        gps_latitude: center ? String(center.latitude.toFixed(7)) : draft.gps_latitude,
        gps_longitude: center ? String(center.longitude.toFixed(7)) : draft.gps_longitude,
        gps_accuracy: lastAccuracy != null ? String(lastAccuracy) : draft.gps_accuracy,
        gps_captured_at: new Date().toISOString(),
      });

      const activeFarmerId = resolvedFarmerId ?? toPositiveEntityId(farmerId);
      const activeFarmId = resolvedFarmId ?? toPositiveEntityId(farmId);

      if (!isValidEntityId(activeFarmerId) || !isValidEntityId(activeFarmId)) {
        throw new Error('Select a farmer and farm before saving the boundary.');
      }

      const ok = await persistToApi();
      if (!ok) {
        if (mountedRef.current) {
          setSaveFailed(true);
          setSaveErrorMessage('Boundary could not be saved. Please try again.');
        }
        return;
      }

      // Onboarding: advance to next incomplete step once after confirmed save.
      // Do not mark whole onboarding complete; do not hardcode FieldOfficerTabs (breaks Artisan Pro).
      if (returnScreen === 'OnboardingBoundaryStart' && !navigatedAfterSaveRef.current) {
        navigatedAfterSaveRef.current = true;
        const draftAfterSave = {
          ...draft,
          boundary_points: drawing.points,
          boundary_unit: unit,
          boundary_capture_method: 'manual' as const,
          boundary_mapping_status: 'mapped' as const,
          boundary_verification_status: 'pending_review' as const,
          service_interests: draft.service_interests.includes('Biochar')
            ? draft.service_interests
            : ['Biochar'],
          service_interest: 'Biochar',
          project_interest: ['Biochar'] as string[],
        };
        updateDraft({
          service_interests: draftAfterSave.service_interests,
          service_interest: 'Biochar',
          project_interest: ['Biochar'],
        });
        continueFarmerOnboardingAfterLandMapping(navigation, draftAfterSave, result, {
          farmerId: activeFarmerId ?? undefined,
          farmId: activeFarmId ?? undefined,
          farmerName: displayFarmerName,
          farmName: displayFarmName,
          farmCode: route.params?.farmCode || farmCode || draft.farm_code || undefined,
          farmerCode: route.params?.farmerCode || draft.farmer_code || undefined,
          village: village !== '—' ? village : undefined,
          mappingStatus: 'completed',
        });
        return;
      }

      if (mountedRef.current) {
        setShowSuccessBanner(true);
      }
    } catch (error) {
      if (mountedRef.current) {
        setSaveFailed(true);
        setSaveErrorMessage(
          error instanceof Error
            ? error.message
            : 'Boundary could not be saved. Please try again.',
        );
      }
    } finally {
      savingRef.current = false;
      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }, [
    displayFarmName,
    displayFarmerName,
    draft,
    drawing,
    farmCode,
    farmId,
    farmerId,
    navigation,
    persistToApi,
    resolvedFarmId,
    resolvedFarmerId,
    result,
    returnScreen,
    route.params?.farmCode,
    route.params?.farmerCode,
    setCaptureMethod,
    setPoints,
    unit,
    updateDraft,
    village,
  ]);

  const handleEditBoundary = useCallback(() => {
    setShowSuccessBanner(false);
    setSaveFailed(false);
    drawing.enterEditMode();
  }, [drawing]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            Map Land Boundary
          </Text>
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText} numberOfLines={1}>
              {localStatusLabel}
            </Text>
          </View>
          <Text style={styles.headerLine} numberOfLines={1}>
            Mapping status: {backendMappingStatus}
          </Text>
          {summaryExpanded ? (
            <>
              <Text style={styles.headerLine} numberOfLines={2} ellipsizeMode="tail">
                {displayFarmerName}
              </Text>
              {displayFarmName ? (
                <Text style={styles.headerLine} numberOfLines={2} ellipsizeMode="tail">
                  {displayFarmName}
                </Text>
              ) : null}
              <Text style={styles.headerLine} numberOfLines={1}>
                Farmer ID: {displayFarmerCode}
              </Text>
              <Text style={styles.headerLine} numberOfLines={1}>
                Farm ID: {displayFarmIdLabel}
              </Text>
              <Text style={styles.headerLine} numberOfLines={1}>
                Village: {village}
              </Text>
              {declaredAreaLabel ? (
                <Text style={styles.headerLine} numberOfLines={1}>
                  Declared area: {declaredAreaLabel}
                </Text>
              ) : null}
              {drawing.farmLocked ? (
                <Text style={styles.lockText}>Farm selection locked while mapping</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.headerLine} numberOfLines={1} ellipsizeMode="tail">
              {displayFarmerName} · {displayFarmName}
            </Text>
          )}
          <Pressable onPress={() => setSummaryExpanded((value) => !value)} hitSlop={8}>
            <Text style={styles.summaryToggle}>
              {summaryExpanded ? 'Hide Summary' : 'Show Summary'}
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.styleToggle}
          onPress={() => setMapStyleMode((mode) => (mode === 'satellite' ? 'street' : 'satellite'))}
        >
          <Text style={styles.styleToggleText}>{mapStyleMode === 'satellite' ? 'Street' : 'Hybrid'}</Text>
        </Pressable>
      </View>

      <View
        style={[
          styles.mapWrap,
          {
            height:
              workflowState === 'saved' || workflowState === 'completed_unsaved'
                ? MAP_HEIGHT_SAVED
                : MAP_HEIGHT,
          },
        ]}
      >
        {loadingExisting ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={dashboardTheme.primaryContainer} />
          </View>
        ) : (
          <ManualBoundaryMap
            points={drawing.points}
            currentLocation={currentLocation}
            farmLocation={farmLocation}
            phase={drawing.phase}
            isValid={drawing.validation.valid}
            showPolygon={drawing.points.length >= 2}
            selectedPointId={drawing.selectedPointId}
            selectedVertexIndex={drawing.selectedVertexIndex}
            invalidVertexIndex={drawing.invalidVertexIndex}
            editableLngLats={drawing.editableLngLats}
            isDraggingVertex={drawing.isDraggingVertex}
            mapStyleMode={mapStyleMode}
            onMapStyleModeChange={setMapStyleMode}
            persistedToBhuguard={drawing.persistedToBhuguard}
            followGps={followGps}
            showFitBoundaryButton
            onUserPanAway={() => setFollowGps(false)}
            onRegionCenterChange={setMapCenter}
            onMapUsableChange={setMapUsable}
            requestFitToPolygon={fitRequest}
            onMapPress={drawing.handleMapPress}
            onSelectVertex={drawing.setSelectedPointId}
            onSelectVertexIndex={drawing.selectVertexIndex}
            onVertexDragStart={drawing.beginVertexDrag}
            onVertexDrag={drawing.moveVertexDuringDrag}
            onVertexDragEnd={drawing.endVertexDrag}
            onCenterGps={() => void centerGps()}
          />
        )}
      </View>

      {(workflowState === 'saved' || workflowState === 'completed_unsaved') && drawing.validation.metrics ? (
        <View style={styles.pinnedSummary}>
          <Text style={styles.pinnedSummaryTitle}>
            {workflowState === 'saved' ? 'Boundary Saved' : 'Boundary Completed'}
          </Text>
          <Text style={styles.pinnedSummaryLine}>Mapping status: {backendMappingStatus}</Text>
          <Text style={styles.pinnedSummaryLine}>
            Declared Area:{' '}
            {declaredAcres != null
              ? `${declaredAcres.toFixed(4)} acres`
              : declaredAreaLabel ?? '—'}
          </Text>
          <Text style={styles.pinnedSummaryLine}>
            Mapped Area: {mappedAcres != null ? `${mappedAcres.toFixed(4)} acres` : '—'}
          </Text>
          {workflowState === 'saved' ? (
            <Text style={styles.pinnedSummarySaved}>Status: Saved to Bhuguard</Text>
          ) : (
            <Text style={styles.pinnedSummaryPending}>Status: Not saved yet</Text>
          )}
          {(displayFarmerName || displayFarmName) ? (
            <Text style={styles.pinnedSummaryLine} numberOfLines={2}>
              {displayFarmerName}
              {displayFarmName ? ` · ${displayFarmName}` : ''}
            </Text>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        style={styles.metaScroll}
        contentContainerStyle={styles.metaContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showSuccessBanner ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>Farm boundary saved successfully.</Text>
          </View>
        ) : null}

        {saveFailed && saveErrorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{saveErrorMessage}</Text>
          </View>
        ) : null}

        {showGpsWarning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningBannerText}>
              GPS accuracy is currently ±{currentAccuracy!.toFixed(1)} m. Move to an open area for better accuracy.
            </Text>
            <View style={styles.warningActions}>
              <Pressable style={styles.warningChip} onPress={() => void centerGps()}>
                <Text style={styles.warningChipText}>Refresh GPS</Text>
              </Pressable>
              <Pressable style={styles.warningChip} onPress={() => setGpsWarningDismissed(true)}>
                <Text style={styles.warningChipText}>Continue Anyway</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.metaLine}>{formatManualGpsAccuracyLabel(currentAccuracy)}</Text>
        <Text style={styles.metaLine}>
          Points: {drawing.vertexCount}
          {drawing.points.length > 0
            ? ` · ${drawing.points.map((point) => `P${point.pointNo}`).join(', ')}`
            : ''}
        </Text>

        {workflowState === 'editing' ? (
          <Text style={styles.metaLine}>
            Use Edit Points to drag orange vertices, or Move Map to pan.
            {drawing.editMessage ? ` ${drawing.editMessage}` : ''}
          </Text>
        ) : null}

        {drawing.validation.metrics ? (
          <View style={styles.areaCard}>
            <Text style={styles.areaLine}>
              Square metres: {drawing.validation.metrics.areaSquareMeters.toFixed(2)}
            </Text>
            <Text style={styles.areaLine}>
              Square feet: {drawing.validation.metrics.areaSquareFeet.toFixed(2)}
            </Text>
            <Text style={styles.areaLine}>
              Acres: {drawing.validation.metrics.areaAcre.toFixed(4)}
            </Text>
            <Text style={styles.areaLine}>
              Hectares: {drawing.validation.metrics.areaHectare.toFixed(4)}
            </Text>
            {declaredAcres != null ? (
              <>
                <Text style={styles.areaDivider}>Declared Area: {declaredAcres.toFixed(4)} acres</Text>
                <Text style={styles.areaLine}>
                  Mapped Area: {mappedAcres != null ? mappedAcres.toFixed(4) : '—'} acres
                </Text>
                <Text style={styles.areaLine}>
                  Difference: {areaDifferenceAcres != null ? areaDifferenceAcres.toFixed(4) : '—'} acres
                </Text>
              </>
            ) : null}
            {areaDiffSignificant ? (
              <Text style={styles.areaWarn}>
                Mapped area differs significantly from the declared area. Please verify the boundary.
              </Text>
            ) : null}
          </View>
        ) : null}

        {!drawing.validation.valid && drawing.points.length >= MIN_BOUNDARY_POINTS ? (
          <Text style={styles.invalidText}>{drawing.validation.message}</Text>
        ) : null}
      </ScrollView>

      <FoBoundaryActionFooter
        workflowState={workflowState}
        canStartDrawing={canStartDrawing}
        startDrawingLabel={startDrawingLabel}
        canComplete={drawing.canComplete}
        canSaveBoundary={canSaveBoundary}
        canSaveChanges={drawing.validation.valid}
        onStartDrawing={() => void handleStartDrawing()}
        onCenterGps={() => void centerGps()}
        onUndoLastPoint={drawing.undoLastVertex}
        onCompleteBoundary={handleCompleteBoundary}
        onResetBoundary={handleReset}
        onEditBoundary={handleEditBoundary}
        onSaveBoundary={() => void saveBoundary()}
        onSaveChanges={handleSaveChanges}
        onCancelEdit={handleCancelEdit}
        onDone={navigateAfterDone}
        onRetrySave={() => void saveBoundary()}
        onCancelBack={() => navigation.goBack()}
        onViewFarmDetails={
          returnScreen === 'OnboardingBoundaryStart' || returnScreen === 'OnboardingBoundaryPreview'
            ? navigateAfterDone
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  backButton: {
    flexShrink: 0,
    paddingTop: 2,
  },
  backText: { color: dashboardTheme.primaryContainer, fontWeight: '700', fontSize: 14 },
  headerMeta: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: dashboardTheme.onSurface,
    flexShrink: 1,
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: dashboardTheme.surfaceLow,
  },
  statusChipText: {
    color: dashboardTheme.headingGreen,
    fontSize: 11,
    fontWeight: '800',
  },
  headerLine: {
    fontSize: 12,
    color: dashboardTheme.onSurfaceVariant,
    fontWeight: '600',
    flexShrink: 1,
  },
  summaryToggle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: dashboardTheme.primaryContainer,
  },
  lockText: { fontSize: 11, color: '#B45309', fontWeight: '700', marginTop: 2 },
  styleToggle: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: dashboardTheme.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  styleToggleText: { color: dashboardTheme.primaryContainer, fontWeight: '700', fontSize: 12 },
  mapWrap: { width: '100%', minHeight: 280 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pinnedSummary: {
    flexShrink: 0,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  pinnedSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  pinnedSummaryLine: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    lineHeight: 18,
  },
  pinnedSummarySaved: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginTop: 2,
  },
  pinnedSummaryPending: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  metaScroll: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 72,
    maxHeight: 260,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.outlineVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
  },
  metaContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 6,
  },
  metaLine: { fontSize: 12, color: dashboardTheme.onSurfaceVariant, fontWeight: '600' },
  areaCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 1,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  areaLine: { fontSize: 12, fontWeight: '700', color: dashboardTheme.onSurface, lineHeight: 18 },
  areaDivider: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '800',
    color: dashboardTheme.headingGreen,
    lineHeight: 18,
  },
  areaWarn: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    lineHeight: 16,
  },
  invalidText: { color: '#DC2626', fontWeight: '700', fontSize: 12 },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  successBannerText: { color: '#166534', fontWeight: '800', fontSize: 13 },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: { color: '#991B1B', fontWeight: '700', fontSize: 13 },
  warningBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 8,
  },
  warningBannerText: { color: '#9A3412', fontWeight: '700', fontSize: 12, lineHeight: 17 },
  warningActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  warningChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDBA74',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFBEB',
  },
  warningChipText: { color: '#9A3412', fontWeight: '800', fontSize: 12 },
});
