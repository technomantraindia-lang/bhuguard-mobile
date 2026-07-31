import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { BiocharProcessFormContent } from '../../components/officer/biochar/BiocharProcessFormContent';
import { BiocharProductionSuccessModal } from '../../components/officer/biochar/BiocharProductionSuccessModal';
import {
  InitialDataSection,
  ProcessDataSection,
  ProductionRecordCard,
  ProductionTimeSection,
  ProductionUnitSection,
} from '../../components/officer/biochar/BiocharProductionSections';
import { OfficerBiocharProductionHeader } from '../../components/officer/biochar/OfficerBiocharProductionHeader';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { type BiocharEvidenceKey } from '../../constants/biocharProduction';
import { useBiocharProductionForm } from '../../hooks/useBiocharProductionForm';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerBiocharProduction'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerBiocharProduction'>;

export function FieldOfficerBiocharProductionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const selectionPrefill = useMemo(
    () => ({
      farmerName: route.params?.farmerName,
      village: route.params?.village,
      taluka: route.params?.taluka,
      district: route.params?.district,
      state: route.params?.state,
      latitude: route.params?.latitude,
      longitude: route.params?.longitude,
      gpsAccuracy: route.params?.gpsAccuracy,
      fieldOfficerId: route.params?.fieldOfficerId,
      visitId: route.params?.visitId,
    }),
    [
      route.params?.district,
      route.params?.farmerName,
      route.params?.fieldOfficerId,
      route.params?.gpsAccuracy,
      route.params?.latitude,
      route.params?.longitude,
      route.params?.state,
      route.params?.taluka,
      route.params?.village,
      route.params?.visitId,
    ],
  );
  const form = useBiocharProductionForm({
    farmerId: route.params?.farmerId,
    farmId: route.params?.farmId,
    batchId: route.params?.batchId,
    selectionPrefill,
  });
  const [successVisible, setSuccessVisible] = useState(false);
  const [submittedBatchCode, setSubmittedBatchCode] = useState('');
  const readOnly = !form.canEdit;

  const farmerCode = useMemo(() => {
    const selected = form.farmers.find((item) => item.id === form.selectedFarmerId);
    return (
      form.farmerCode ??
      selected?.farmerCode ??
      (form.selectedFarmerId ? `BHG-FRM-${String(form.selectedFarmerId).padStart(6, '0')}` : null)
    );
  }, [form.farmerCode, form.farmers, form.selectedFarmerId]);

  useEffect(() => {
    if (route.params?.gpsRecaptured && route.params.latitude != null && route.params.longitude != null) {
      void form.recaptureGps();
    }
  }, [form.recaptureGps, route.params?.gpsRecaptured, route.params?.latitude, route.params?.longitude]);

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading biochar production form..." />
      </SafeAreaView>
    );
  }

  if (form.error && !form.productionRecordCode && form.farmers.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    const result = await form.submit();
    if (!result) {
      return;
    }
    setSubmittedBatchCode(typeof result === 'string' ? result : result.batchCode);
    setSuccessVisible(true);
  };

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();
    if (ok) {
      Alert.alert('Draft saved', 'Biochar production record saved as draft.');
    }
  };

  const previewEvidence = (key: BiocharEvidenceKey) => {
    const asset = form.evidence[key];
    if (!asset) {
      return;
    }

    navigation.navigate('OfficerFullscreenImage', { uri: asset.uri, title: 'Production Evidence' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerBiocharProductionHeader
        officerName={form.officerName}
        onBackPress={() => navigation.navigate('FieldOfficerBiocharProductionList')}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BiocharProcessFormContent
          form={form}
          readOnly={readOnly}
          farmerCode={farmerCode}
          onPreviewEvidence={previewEvidence}
          headerSlot={
            <ProductionRecordCard
              productionRecordCode={form.productionRecordCode}
              batchCode={form.batchCode}
              officerName={form.officerName}
              farmerId={form.selectedFarmerId}
              farmerName={form.farmerName}
              productionDate={form.productionDate}
              onProductionDateChange={readOnly ? undefined : form.setProductionDate}
              statusLabel={form.statusLabel}
            />
          }
          extraSectionsSlot={
            <>
              <InitialDataSection
                timestampDate={form.timestampDate}
                timestampTime={form.timestampTime}
                altitude={form.altitude}
                villageName={form.villageName}
                talukaName={form.talukaName}
                districtName={form.districtName}
                stateName={form.stateName}
                latitude={form.latitude}
                longitude={form.longitude}
                accuracyM={form.accuracyM}
                accuracyTier={form.gpsAccuracyTier}
                farmerCode={farmerCode}
                onTimestampDateChange={form.setTimestampDate}
                onTimestampTimeChange={form.setTimestampTime}
                onAltitudeChange={form.setAltitudeInput}
                onVillageNameChange={form.setVillageName}
                onTalukaNameChange={form.setTalukaName}
                onDistrictNameChange={form.setDistrictName}
                onStateNameChange={form.setStateName}
                onCaptureGps={() => void form.recaptureGps()}
                onRecaptureGps={() => void form.recaptureGps()}
                mapPreviewUrl={form.mapPreviewUrl}
              />
              <ProductionUnitSection
                units={form.units}
                kilnId={form.kilnId}
                operatorName={form.operatorName}
                latitude={form.latitude}
                longitude={form.longitude}
                accuracyM={form.accuracyM}
                gpsCaptured={form.gpsCaptured}
                onKilnIdChange={form.setKilnId}
                onSelectUnit={form.selectUnit}
                onOperatorNameChange={form.setOperatorName}
                onRecaptureGps={() => void form.recaptureGps()}
              />
              <ProductionTimeSection
                startTime={form.startTime}
                endTime={form.endTime}
                onStartTimeChange={form.setStartTime}
                onEndTimeChange={form.setEndTime}
              />
              <ProcessDataSection
                temperature={form.temperature}
                residenceTime={form.residenceTime}
                biocharOutput={form.biocharOutput}
                biocharOutputUnit={form.biocharOutputUnit}
                feedstockQuantity={form.feedstockQuantity}
                onTemperatureChange={form.setTemperature}
                onResidenceTimeChange={form.setResidenceTime}
                onBiocharOutputChange={form.setBiocharOutput}
                onBiocharOutputUnitChange={form.setBiocharOutputUnit}
              />
            </>
          }
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        {form.canSubmit ? (
          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={() => void handleSaveDraft()} disabled={form.submitting}>
              <Text style={styles.secondaryButtonText}>{form.submitting ? 'Saving...' : 'Save Draft'}</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={form.submitting}>
              <Text style={styles.primaryButtonText}>{form.submitting ? 'Submitting...' : 'Submit'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>This record has been submitted and can no longer be edited.</Text>
          </View>
        )}
      </ScrollView>

      <BiocharProductionSuccessModal
        visible={successVisible}
        batchCode={submittedBatchCode || form.batchCode}
        onClose={() => setSuccessVisible(false)}
        onAddNewBatch={() => {
          setSuccessVisible(false);
          void form.regenerateCodes();
          navigation.replace('FieldOfficerBiocharProduction', {
            farmerId: form.selectedFarmerId ?? route.params?.farmerId,
          });
        }}
        onBackToDashboard={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Home' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: {
    padding: officerTheme.marginMobile,
    gap: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  error: { color: officerTheme.error, fontSize: 14 },
  actions: { gap: 10, marginTop: 8, marginBottom: 8 },
  primaryButton: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    backgroundColor: '#EAF7EF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: officerTheme.primaryContainer, fontWeight: '700', fontSize: 16 },
  readOnlyBanner: {
    backgroundColor: officerTheme.surfaceLow,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  readOnlyText: { color: officerTheme.onSurfaceVariant, fontSize: 14, textAlign: 'center' },
});
