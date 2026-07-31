import { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation, useRoute } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RouteProp } from '@react-navigation/native';



import { createArtisanBiocharProduction, searchArtisanFarms } from '../../api/artisanApi';

import { getApiErrorMessage } from '../../api/authApi';

import {

  ArtisanBiocharProcessFormContent,

  type ArtisanFarmOption,

} from '../../components/officer/biochar/ArtisanBiocharProcessFormContent';

import { ProductionRecordCard } from '../../components/officer/biochar/BiocharProductionSections';

import { ErrorState } from '../../components/ErrorState';

import { LoadingState } from '../../components/LoadingState';

import { ScreenHeader } from '../../components/ScreenHeader';

import { LiveWorkCheckinCard } from '../../components/artisan/LiveWorkCheckinCard';

import { type BiocharEvidenceKey } from '../../constants/biocharProduction';

import { useArtisanGpsTracker } from '../../hooks/useArtisanGpsTracker';

import { useBiocharProductionForm } from '../../hooks/useBiocharProductionForm';

import { useArtisanWorkSession } from '../../context/ArtisanWorkSessionContext';

import type { ArtisanStackParamList } from '../../navigation/types';

import { artisanTheme } from '../../theme/artisanTheme';

import { type ApiRecord } from '../../utils/apiHelpers';

import { biocharEvidenceKeyToGpsStage } from '../../utils/artisanGpsAccuracy';

import { startBiocharProductionSyncListeners } from '../../services/biocharProductionSyncService';

import { getAuthUser } from '../../utils/authStorage';

import { formatFarmDisplayLabel } from '../../utils/farmDisplayLabel';

import type { ArtisanFarmSearchRecord } from '../../types/artisanFarmSearch';



type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanBiocharProduction'>;

type ScreenRoute = RouteProp<ArtisanStackParamList, 'ArtisanBiocharProduction'>;



function buildFarmOptions(records: ArtisanFarmSearchRecord[], farmerId: number): ArtisanFarmOption[] {

  const farmerFarms = records.filter((record) => record.farmer_id === farmerId);

  return farmerFarms.map((farm, index) => ({

    id: farm.farm_id,

    label: formatFarmDisplayLabel(

      { village: farm.village, farm_name: farm.farm_name },

      index,

    ),

  }));

}



export function ArtisanBiocharProductionScreen() {

  const navigation = useNavigation<Nav>();

  const route = useRoute<ScreenRoute>();

  const { ensureCheckedInOrPrompt } = useArtisanWorkSession();

  const params = route?.params ?? ({} as ScreenRoute['params']);

  const routeFarmId = Number(params?.farmId ?? 0) > 0 ? Number(params.farmId) : undefined;

  const routeFarmerId = Number(params?.farmerId ?? 0) > 0 ? Number(params.farmerId) : undefined;

  const selectionPrefill = useMemo(

    () => ({

      farmerName: params?.farmerName,

      farmerCode: params?.farmerCode,

      farmCode: params?.farmCode,

      village: params?.village,

      taluka: params?.taluka,

      district: params?.district,

      state: params?.state,

      latitude: params?.latitude,

      longitude: params?.longitude,

    }),

    [

      params?.district,

      params?.farmCode,

      params?.farmerCode,

      params?.farmerName,

      params?.latitude,

      params?.longitude,

      params?.state,

      params?.taluka,

      params?.village,

    ],

  );

  const form = useBiocharProductionForm({

    farmerId: routeFarmerId,

    farmId: routeFarmId,

    batchId: params?.batchId,

    submissionUuid: params?.submissionUuid,

    viewOnly: params?.viewOnly === true || Boolean(params?.submissionUuid),

    apiMode: 'artisan',

    selectionPrefill,

  });

  const gps = useArtisanGpsTracker({

    farmId: routeFarmId ?? null,

    batchId: form.batchId,

  });

  const [productionStartCaptured, setProductionStartCaptured] = useState(false);

  const [farmOptions, setFarmOptions] = useState<ArtisanFarmOption[]>([]);

  const readOnly =

    !form.canEdit ||

    form.recordStatus === 'submitted_for_review' ||

    form.recordStatus === 'pending_sync' ||

    form.recordStatus === 'completed' ||

    form.recordStatus === 'approved';



  useEffect(() => {

    void (async () => {

      const user = await getAuthUser();

      startBiocharProductionSyncListeners(user?.artisan_profile?.id ?? null);

    })();

  }, []);



  const loadFarmOptions = useCallback(async () => {

    if (!routeFarmerId) {

      return;

    }



    try {

      const response = await searchArtisanFarms({

        q: params?.farmerCode || params?.farmerName || undefined,

        limit: 50,

      });



      if (!response.success) {

        return;

      }



      const options = buildFarmOptions(response.data ?? [], routeFarmerId);

      setFarmOptions(options);



      if (options.length === 1) {

        form.selectFarm(options[0].id);

      } else if (routeFarmId) {

        form.selectFarm(routeFarmId);

      }

    } catch {

      if (routeFarmId) {

        setFarmOptions([

          {

            id: routeFarmId,

            label:

              params?.farmLabel ||

              formatFarmDisplayLabel({ village: params?.village, farm_name: params?.farmCode }, 0),

          },

        ]);

      }

    }

  }, [

    form.selectFarm,

    params?.farmCode,

    routeFarmId,

    params?.farmLabel,

    params?.farmerCode,

    routeFarmerId,

    params?.farmerName,

    params?.village,

  ]);



  useEffect(() => {

    void loadFarmOptions();

  }, [loadFarmOptions]);



  const farmerCode =

    params?.farmerCode ??

    form.farmerCode ??

    (form.selectedFarmerId ? `BHG-FRM-${String(form.selectedFarmerId).padStart(6, '0')}` : null);



  useEffect(() => {

    if (params?.gpsRecaptured) {

      void form.recaptureGps();

    }

  }, [form.recaptureGps, params?.gpsRecaptured]);



  useEffect(() => {

    if (form.batchId && !productionStartCaptured && form.canEdit) {

      setProductionStartCaptured(true);

      void gps.captureGps('production_start', {

        farmId: routeFarmId,

        biocharProductionId: form.batchId,

        silent: true,

      });

    }

  }, [form.batchId, form.canEdit, gps.captureGps, productionStartCaptured, routeFarmId]);



  useEffect(() => {

    if (gps.latitude != null && gps.longitude != null) {

      void form.syncGpsFromCapture(gps.latitude, gps.longitude, gps.accuracyM);

      void form.syncAltitudeFromCapture(gps.altitude ?? null);

    }

  }, [form.syncAltitudeFromCapture, form.syncGpsFromCapture, gps.accuracyM, gps.altitude, gps.latitude, gps.longitude]);



  if (!routeFarmId) {

    return (

      <SafeAreaView style={styles.safe}>

        <ScreenHeader title="Biochar Production" onBackPress={() => navigation.goBack()} />

        <ErrorState

          message="Farm context is missing. Please select a farm from Biochar Production lookup first."

          onRetry={() => navigation.navigate('ArtisanFarmLookup', { purpose: 'production' })}

        />

      </SafeAreaView>

    );

  }



  if (form.loading) {

    return (

      <SafeAreaView style={styles.safe}>

        <LoadingState message="Loading biochar production form..." />

      </SafeAreaView>

    );

  }



  if (form.error && !form.batchId && !form.canEdit) {

    return (

      <SafeAreaView style={styles.safe}>

        <ErrorState message={form.error} onRetry={form.reload} />

      </SafeAreaView>

    );

  }



  const ensureSession = async (): Promise<number | null> => {

    if (!ensureCheckedInOrPrompt()) {

      return null;

    }

    if (form.batchId) {

      return form.batchId;

    }



    const targetFarmId = form.resolvedFarmId ?? routeFarmId;

    if (!targetFarmId) {

      Alert.alert('Farm required', 'Select a farm before continuing.');

      return null;

    }



    try {

      const created = (await createArtisanBiocharProduction(targetFarmId)) as ApiRecord;

      const batch = (created.batch ?? created.record ?? created) as ApiRecord;

      const id = Number(batch.id);

      if (!Number.isFinite(id) || id <= 0) {

        return null;

      }

      form.attachBatchId(id);

      form.applyRemoteBatch(batch);

      return id;

    } catch (error) {

      Alert.alert('Unable to start session', getApiErrorMessage(error, 'Unable to create production session.'));

      return null;

    }

  };



  const handleCaptureBatchStartTime = async () => {

    if (form.batchStartedAt) {

      return;

    }



    const startedAt = new Date().toISOString();

    form.setBatchStartedAt(startedAt);

    form.setPyrolysisStartedAt(startedAt);



    if (!form.batchId) {

      await ensureSession().catch(() => null);

    }

  };



  const handleCaptureCompletionTime = () => {

    if (form.processCompletedAt) {

      return;

    }



    const completedAt = new Date().toISOString();

    form.setProcessCompletedAt(completedAt);

    form.setPyrolysisFinishedAt(completedAt);



    const startMs = form.batchStartedAt ? Date.parse(form.batchStartedAt) : NaN;

    const endMs = Date.parse(completedAt);

    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {

      const durationSeconds = Math.floor((endMs - startMs) / 1000);

      form.setPyrolysisDurationSeconds(durationSeconds);

      form.setPyrolysisDurationLabel(

        `${Math.floor(durationSeconds / 3600)}h ${Math.floor((durationSeconds % 3600) / 60)}m`,

      );

    }

  };



  const handleSubmit = async () => {

    const submitGps = await gps.captureGps('submit', {

      farmId: routeFarmId,

      biocharProductionId: form.batchId,

    });



    if (!submitGps) {

      Alert.alert('GPS required', 'GPS location is required before submit. Capture GPS and try again.');

      return;

    }



    await form.syncGpsFromCapture(submitGps.latitude, submitGps.longitude, submitGps.accuracyM);



    const result = await form.submit();

    if (!result) {

      return;

    }



    const statusParams = {

      farmId: routeFarmId,

      farmerId: routeFarmerId,

      farmerName: params?.farmerName,

      farmerCode: params?.farmerCode,

      farmCode: params?.farmCode,

      farmLabel: params?.farmLabel,

      village: params?.village,

      taluka: params?.taluka,

      district: params?.district,

      state: params?.state,

      latitude: params?.latitude,

      longitude: params?.longitude,

      savedAt: new Date().toISOString(),

    };



    try {

      if (typeof result === 'object' && result.offline && result.submissionUuid) {

        navigation.replace('ArtisanBiocharProductionStatus', {

          ...statusParams,

          submissionUuid: result.submissionUuid,

          batchCode: result.batchCode,

          status: result.status,

        });

        return;

      }



      const code = typeof result === 'string' ? result : result.batchCode;

      navigation.replace('ArtisanBiocharProductionStatus', {

        ...statusParams,

        submissionUuid: typeof result === 'object' ? result.submissionUuid : `online-${Date.now()}`,

        batchCode: code,

        status: 'submitted_for_review',

      });

    } catch (navError) {

      const message = getApiErrorMessage(

        navError,

        'Production was saved, but the status screen could not open. Open Submitted Production from the dashboard.',

      );

      Alert.alert('Saved', message);

    }

  };



  const handleEvidenceCaptured = async (key: BiocharEvidenceKey) => {

    if (!form.batchId) {

      await ensureSession();

    }

    const stage = biocharEvidenceKeyToGpsStage(key);

    if (stage) {

      await gps.captureGps(stage, {

        farmId: routeFarmId,

        biocharProductionId: form.batchId,

        silent: true,

      });

    }

  };



  const selectedFarmLabel =

    params?.farmLabel ||

    farmOptions.find((option) => option.id === form.resolvedFarmId)?.label ||

    params?.farmCode;



  const processSubtitle = selectedFarmLabel || form.farmerName || (farmerCode ?? 'Biochar production');



  const previewEvidence = (key: BiocharEvidenceKey) => {

    const asset = form.evidence[key];

    const uri = asset?.localUri || asset?.uri || asset?.remoteUrl;



    if (!uri) {

      Alert.alert('Evidence', 'Evidence file could not be found on this device.');

      return;

    }



    navigation.navigate('FullscreenImage', { uri, title: 'Production Evidence' });

  };



  return (

    <SafeAreaView style={styles.safe} edges={['top']}>

      <ScreenHeader

        title="Biochar Process"

        subtitle={processSubtitle}

        showBrandLogo

        logoOnPress={() => navigation.navigate('ArtisanDashboard')}

      />



      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <LiveWorkCheckinCard />

        <ArtisanBiocharProcessFormContent

          form={form}

          readOnly={readOnly}

          farmerCode={farmerCode}

          farmCode={params?.farmCode ?? form.resolvedFarmCode}

          farmLabel={selectedFarmLabel ?? null}

          farmOptions={farmOptions}

          onSelectFarm={form.selectFarm}

          onPreviewEvidence={previewEvidence}

          onEvidenceCaptured={(key) => void handleEvidenceCaptured(key)}

          onCaptureBatchStartTime={() => void handleCaptureBatchStartTime()}

          onCaptureCompletionTime={handleCaptureCompletionTime}

          batchStartedAt={form.batchStartedAt}

          processCompletedAt={form.processCompletedAt}

          headerSlot={

            <ProductionRecordCard

              productionRecordCode={form.productionRecordCode}

              batchCode={form.batchCode}

              officerName={form.officerName}

              farmerId={form.selectedFarmerId}

              farmerName={form.farmerName}

              productionDate={form.productionDate}

              statusLabel={form.statusLabel}

            />

          }

        />



        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}



        {form.canSubmit ? (

          <View style={styles.actions}>

            <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={form.submitting}>

              <Text style={styles.primaryButtonText}>

                {form.submitting ? 'Submitting…' : 'Submit Biochar Production'}

              </Text>

            </Pressable>

          </View>

        ) : (

          <View style={styles.readOnlyBanner}>

            <Text style={styles.readOnlyText}>

              Biochar Production Submitted Successfully. This record is read-only and cannot be edited.

            </Text>

            <Pressable

              style={styles.secondaryButton}

              onPress={() => navigation.navigate('ArtisanProductionRecords', { status: 'submitted' })}

            >

              <Text style={styles.secondaryButtonText}>View Batch Status</Text>

            </Pressable>

          </View>

        )}

      </ScrollView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },

  content: { padding: 16, gap: 14, paddingBottom: 120 },

  error: { color: artisanTheme.error, fontSize: 14, fontWeight: '600' },

  actions: { gap: 10, marginTop: 8, marginBottom: 8 },

  primaryButton: {

    backgroundColor: artisanTheme.actionGreen,

    borderRadius: 14,

    paddingVertical: 14,

    alignItems: 'center',

    ...artisanTheme.cardShadow,

  },

  primaryButtonText: { color: artisanTheme.white, fontWeight: '800', fontSize: 16 },

  secondaryButton: {

    backgroundColor: artisanTheme.lightGreenSurface,

    borderRadius: 14,

    paddingVertical: 14,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: artisanTheme.softBorder,

    marginTop: 10,

  },

  secondaryButtonText: { color: artisanTheme.actionGreen, fontWeight: '800', fontSize: 16 },

  readOnlyBanner: {

    backgroundColor: artisanTheme.white,

    borderRadius: 14,

    padding: 14,

    marginTop: 8,

    borderWidth: 1,

    borderColor: artisanTheme.softBorder,

  },

  readOnlyText: { color: artisanTheme.secondaryText, fontSize: 14, textAlign: 'center' },

});


