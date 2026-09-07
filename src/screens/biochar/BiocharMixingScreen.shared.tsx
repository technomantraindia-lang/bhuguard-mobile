import { useContext, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  BiocharMixingBasicSection,
  BiocharMixingBatchSection,
  BiocharMixingEvidenceCard,
  BiocharMixingFarmerSection,
  BiocharMixingLocationSection,
  BiocharMixingNotesSection,
} from '../../components/biochar/BiocharMixingSections';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { KeyboardSafeScrollView } from '../../components/layout/KeyboardSafeScrollView';
import { AppButton } from '../../components/AppButton';
import { BIOCHAR_MIXING_EVIDENCE_SLOTS } from '../../constants/biocharMixing';
import { ArtisanWorkSessionContext } from '../../context/ArtisanWorkSessionContext';
import { useBiocharMixingForm } from '../../hooks/useBiocharMixingForm';
import { colors } from '../../theme/colors';

type MixingRouteParams = {
  recordId?: number;
  farmerId?: number;
  farmId?: number;
  farmLabel?: string;
  farmerCode?: string;
  farmerName?: string;
  farmCode?: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
};

interface BiocharMixingScreenProps<T extends MixingRouteParams> {
  apiMode: 'farmer' | 'officer' | 'artisan';
  title?: string;
  stackName: string;
}

export function createBiocharMixingScreen<T extends MixingRouteParams>({
  apiMode,
  title = 'Biochar Mixing',
}: BiocharMixingScreenProps<T>) {
  return function BiocharMixingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
    const route = useRoute<RouteProp<Record<string, T | undefined>, string>>();
    const params = route.params ?? ({} as T);
    const farmId = Number(params.farmId ?? 0) > 0 ? Number(params.farmId) : undefined;

    const selectionPrefill = useMemo(
      () => ({
        farmerName: params.farmerName,
        farmerCode: params.farmerCode,
        farmCode: params.farmCode,
        farmLabel: params.farmLabel,
        village: params.village,
        taluka: params.taluka,
        district: params.district,
        state: params.state,
      }),
      [
        params.district,
        params.farmCode,
        params.farmLabel,
        params.farmerCode,
        params.farmerName,
        params.state,
        params.taluka,
        params.village,
      ],
    );

    const form = useBiocharMixingForm({
      apiMode,
      recordId: params.recordId,
      farmerId: params.farmerId,
      farmId,
      selectionPrefill,
    });

    const workSession = useContext(ArtisanWorkSessionContext);
    const [submitSuccess, setSubmitSuccess] = useState<{ mixingCode: string } | null>(null);

    const readOnly = !form.canEdit;
    const isSubmitted = Boolean(form.recordId && !form.canEdit);
    const isArtisanMode = apiMode === 'artisan';
    const showOfficerContinue =
      !isArtisanMode &&
      (!isSubmitted || (apiMode === 'officer' && form.biocharApplicationRouteReady));

    if (!farmId && !params.recordId) {
      return (
        <SafeAreaView style={styles.safe}>
          <ScreenHeader title={title} onBackPress={() => navigation.goBack()} />
          <ErrorState message="Farm context is missing. Please select a farm before starting Biochar Mixing." />
        </SafeAreaView>
      );
    }

    if (form.loading) {
      return (
        <SafeAreaView style={styles.safe}>
          <LoadingState message="Loading Biochar Mixing form..." />
        </SafeAreaView>
      );
    }

    if (form.error && params.recordId && !form.recordId) {
      return (
        <SafeAreaView style={styles.safe}>
          <ErrorState message={form.error} onRetry={form.reload} />
        </SafeAreaView>
      );
    }

    const openPreview = (uri: string) => {
      if (apiMode === 'officer') {
        navigation.navigate('OfficerFullscreenImage', { uri, title: 'Biochar Mixing Evidence' });
        return;
      }

      navigation.navigate('FullscreenImage', { uri, title: 'Biochar Mixing Evidence' });
    };

    const navigateToApplication = (result: {
      mixingId: number;
      farmId: number | null;
      farmerId: number | null;
      farmCode: string;
      farmerCode: string;
      farmerName: string;
      selectedBatchIds: number[];
      village?: string;
      taluka?: string;
      district?: string;
      state?: string;
    }) => {
      if (!result.farmId || !result.farmerId) {
        Alert.alert('Submitted', 'Biochar Mixing completed, but Farm/Farmer context is incomplete for Application.');
        navigation.goBack();
        return;
      }

      const payload = {
        mixingId: result.mixingId,
        farmId: result.farmId,
        farmerId: result.farmerId,
        farmCode: result.farmCode,
        farmerCode: result.farmerCode,
        farmerName: result.farmerName,
        selectedBatchIds: result.selectedBatchIds,
        village: result.village,
        taluka: result.taluka,
        district: result.district,
        state: result.state,
      };

      navigation.replace('FieldOfficerBiocharApplication', payload);
    };

    const handleArtisanSubmit = async () => {
      if (workSession && !workSession.ensureCheckedInOrPrompt()) {
        return;
      }

      const result = await form.submit();
      if (!result) {
        return;
      }

      setSubmitSuccess({ mixingCode: result.mixingCode });
    };

    const handleContinue = async () => {
      if (isSubmitted && form.biocharApplicationRouteReady && form.recordId) {
        navigateToApplication({
          mixingId: form.recordId,
          farmId: form.resolvedFarmId,
          farmerId: form.resolvedFarmerId ?? params.farmerId ?? null,
          farmCode: form.farmCode,
          farmerCode: form.farmerCode,
          farmerName: form.farmerName,
          selectedBatchIds: form.selectedBatchIds,
          village: form.villageName,
          taluka: form.talukaName,
          district: form.districtName,
          state: form.stateName,
        });
        return;
      }

      if (isSubmitted && form.hasBiocharApplication) {
        Alert.alert(
          'Application exists',
          'Biochar Application already exists for this Mixing record.',
          [{ text: 'OK' }],
        );
        return;
      }

      const result = await form.submit();
      if (!result) {
        return;
      }

      if (apiMode === 'farmer') {
        Alert.alert('Submitted', `Biochar Mixing ${result.mixingCode} completed successfully.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      navigateToApplication(result);
    };

    const goToDashboard = () => {
      if (isArtisanMode) {
        navigation.navigate('ArtisanDashboard');
        return;
      }

      navigation.goBack();
    };

    if (submitSuccess || (isArtisanMode && isSubmitted && !form.canEdit)) {
      const mixingCode = submitSuccess?.mixingCode ?? form.mixingRecordId ?? form.heroMeta;

      return (
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader title={title} />
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Biochar Mixing Submitted Successfully</Text>
            <Text style={styles.successMeta}>Mixing record: {mixingCode}</Text>
            <AppButton label="Go to Dashboard" onPress={goToDashboard} />
          </View>
        </SafeAreaView>
      );
    }

    const primaryLabel =
      apiMode === 'farmer'
        ? 'Submit Biochar Mixing'
        : isArtisanMode
          ? 'Submit Biochar Mixing'
          : 'Continue to Biochar Application';

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={title} />
        <KeyboardSafeScrollView contentContainerStyle={styles.content} extraBottomPadding={24} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Biochar Mixing</Text>
            <Text style={styles.heroMeta}>{form.heroMeta}</Text>
          </View>

          <BiocharMixingBasicSection
            site={form.site}
            dateOfMixing={form.dateOfMixing}
            readOnly={readOnly}
            onSiteChange={form.setSite}
          />

          <BiocharMixingLocationSection
            latitude={form.latitude}
            longitude={form.longitude}
            altitude={form.altitude}
            accuracyM={form.accuracyM}
            accuracyTier={form.gpsAccuracyTier}
            gpsCapturedAt={form.gpsCapturedAt}
            villageName={form.villageName}
            talukaName={form.talukaName}
            districtName={form.districtName}
            stateName={form.stateName}
            locationStatus={form.locationStatus}
            capturing={form.capturingGps}
            readOnly={readOnly}
            onCaptureGps={() => void form.recaptureGps()}
          />

          <BiocharMixingFarmerSection
            farmerName={form.farmerName}
            farmerCode={form.farmerCode}
            farmCode={params.farmLabel ?? form.farmCode}
          />

          <BiocharMixingBatchSection
            batches={form.batches}
            selectedBatchIds={form.selectedBatchIds}
            selectedBatchCount={form.selectedBatchCount}
            combinedSelectedQuantity={form.combinedSelectedQuantity}
            loadingBatches={form.loadingBatches}
            batchesError={form.batchesError}
            emptyMessage={form.batchesEmptyMessage}
            readOnly={readOnly}
            onToggleBatch={form.toggleBatchSelection}
            onSelectAll={form.selectAllBatches}
            onDeselectAll={form.deselectAllBatches}
            onRefresh={form.refreshBatches}
            onGoBack={() => navigation.goBack()}
          />

          <Text style={styles.sectionHeading}>Mixing Evidence</Text>
          {BIOCHAR_MIXING_EVIDENCE_SLOTS.map((slot) => (
            <BiocharMixingEvidenceCard
              key={slot.key}
              slot={slot}
              evidence={form.evidence[slot.key]}
              readOnly={readOnly}
              onAdd={() => void form.addEvidence(slot.key)}
              onRemove={() => form.removeEvidence(slot.key)}
              onPreview={openPreview}
            />
          ))}

          <BiocharMixingNotesSection notes={form.notes} readOnly={readOnly} onNotesChange={form.setNotes} />

          {isArtisanMode && !readOnly ? (
            <View style={styles.actions}>
              <AppButton
                label="Submit Biochar Mixing"
                onPress={() => void handleArtisanSubmit()}
                loading={form.submitting}
                disabled={form.submitting}
              />
              <AppButton label="Go to Dashboard" variant="secondary" onPress={goToDashboard} />
            </View>
          ) : null}

          {showOfficerContinue && !isArtisanMode ? (
            <View style={styles.actions}>
              <AppButton
                label={primaryLabel}
                onPress={() => void handleContinue()}
                loading={form.submitting}
                disabled={form.submitting}
              />
            </View>
          ) : null}

          {apiMode === 'farmer' && !readOnly ? (
            <View style={styles.actions}>
              <AppButton
                label={primaryLabel}
                onPress={() => void handleContinue()}
                loading={form.submitting}
                disabled={form.submitting}
              />
            </View>
          ) : null}
        </KeyboardSafeScrollView>
      </SafeAreaView>
    );
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  successContent: { flex: 1, padding: 16, gap: 14, justifyContent: 'center' },
  successTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  successMeta: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 8 },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E0D8',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heroTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  heroMeta: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  sectionHeading: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  actions: { gap: 10, marginTop: 4 },
});
