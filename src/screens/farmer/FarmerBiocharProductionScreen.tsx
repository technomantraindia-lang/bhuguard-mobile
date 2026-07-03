import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { BiocharProductionSuccessModal } from '../../components/officer/biochar/BiocharProductionSuccessModal';
import {
  BiocharEvidenceCaptureSection,
  FinalStageSection,
  InitialDataSection,
  MoistureReadingsSection,
  OfficerNotesSection,
  ProcessDataSection,
  ProductionBatchSection,
  ProductionRecordCard,
  ProductionTimeSection,
  ProductionUnitSection,
} from '../../components/officer/biochar/BiocharProductionSections';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
  BIOCHAR_BATCH_EVIDENCE_SLOT,
  BIOCHAR_MOISTURE_EVIDENCE_SLOT,
  BIOCHAR_PROCESS_EVIDENCE_SLOTS,
  type BiocharEvidenceKey,
} from '../../constants/biocharProduction';
import { useBiocharProductionForm } from '../../hooks/useBiocharProductionForm';
import type { FarmerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { FeedstockQuantityUnit, FeedstockTypeValue } from '../../constants/feedstockTypes';

type Nav = NativeStackNavigationProp<FarmerStackParamList, 'FarmerBiocharProduction'>;
type ScreenRoute = RouteProp<FarmerStackParamList, 'FarmerBiocharProduction'>;

export function FarmerBiocharProductionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const form = useBiocharProductionForm({
    batchId: route.params?.batchId,
    apiMode: 'farmer',
  });
  const [successVisible, setSuccessVisible] = useState(false);
  const [submittedBatchCode, setSubmittedBatchCode] = useState('');
  const readOnly = !form.canEdit;
  const isAddFlow = route.params?.batchId == null;
  const showBlockingError = Boolean(form.error) && !isAddFlow;

  useEffect(() => {
    if (route.params?.gpsRecaptured && route.params.latitude != null && route.params.longitude != null) {
      void form.recaptureGps();
    }
  }, [form.recaptureGps, route.params?.gpsRecaptured, route.params?.latitude, route.params?.longitude]);

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading Biochar activity form..." />
      </SafeAreaView>
    );
  }

  if (showBlockingError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error ?? 'Unable to load Biochar activity.'} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    const code = await form.submit();
    if (code) {
      setSubmittedBatchCode(code);
      setSuccessVisible(true);
    }
  };

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();
    if (ok) {
      Alert.alert('Draft saved', 'Biochar activity saved as draft. You can continue editing later.');
    }
  };

  const previewEvidence = (key: BiocharEvidenceKey) => {
    const asset = form.evidence[key];
    if (!asset) {
      return;
    }

    if (key === 'process_video') {
      Alert.alert('Process video', 'Video evidence captured and ready for upload.');
      return;
    }

    navigation.navigate('FullscreenImage', { uri: asset.uri, title: 'Biochar Evidence' });
  };

  const renderEvidenceCapture = (slot: typeof BIOCHAR_BATCH_EVIDENCE_SLOT) => (
    <BiocharEvidenceCaptureSection
      key={slot.key}
      slot={slot}
      evidence={form.evidence[slot.key]}
      readOnly={readOnly}
      onAddEvidence={(key) => void form.addEvidence(key)}
      onUploadEvidence={(key) => void form.uploadEvidence(key)}
      onRemoveEvidence={form.removeEvidence}
      onPreviewEvidence={previewEvidence}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Biochar Process" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {form.error && isAddFlow ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningTitle}>Some details are missing</Text>
            <Text style={styles.warningText}>
              You can still save this Biochar activity as draft. Add farm details before final submit if required.
            </Text>
          </View>
        ) : null}

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

        <ProductionBatchSection
          batchCode={form.batchCode}
          feedstockQuantity={form.feedstockQuantity}
          feedstockUnit={form.feedstockUnit}
          feedstockType={form.feedstockType}
          onGenerateBatchCode={() => void form.regenerateCodes()}
          onBatchCodeChange={form.setBatchCode}
          onFeedstockQuantityChange={form.setFeedstockQuantity}
          onFeedstockUnitChange={(value) => form.setFeedstockUnit(value as FeedstockQuantityUnit)}
          onFeedstockTypeChange={(value) => form.setFeedstockType(value as FeedstockTypeValue)}
        />

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
          onTimestampDateChange={form.setTimestampDate}
          onTimestampTimeChange={form.setTimestampTime}
          onAltitudeChange={(value) => form.setAltitude(value === '' ? null : Number(value))}
          onVillageNameChange={form.setVillageName}
          onTalukaNameChange={form.setTalukaName}
          onDistrictNameChange={form.setDistrictName}
          onStateNameChange={form.setStateName}
          onCaptureGps={() => void form.recaptureGps()}
          onRecaptureGps={() => void form.recaptureGps()}
          mapPreviewUrl={form.mapPreviewUrl}
        />

        {renderEvidenceCapture(BIOCHAR_BATCH_EVIDENCE_SLOT)}
        {renderEvidenceCapture(BIOCHAR_MOISTURE_EVIDENCE_SLOT)}

        <MoistureReadingsSection
          readings={form.moistureReadings}
          readOnly={readOnly}
          onAddReading={form.addMoistureReading}
          onRemoveReading={form.removeMoistureReading}
          onChangeReading={(key, value) => form.updateMoistureReading(key, 'moistureReading', value)}
          onChangeNotes={(key, value) => form.updateMoistureReading(key, 'notes', value)}
          onCapturePhoto={(key) => void form.captureMoistureReadingPhoto(key)}
          onUploadPhoto={(key) => void form.uploadMoistureReadingPhoto(key)}
        />

        {BIOCHAR_PROCESS_EVIDENCE_SLOTS.slice(0, 3).map(renderEvidenceCapture)}

        <FinalStageSection
          finalStageTime={form.finalStageTime}
          quenchingTime={form.quenchingTime}
          onFinalStageTimeChange={form.setFinalStageTime}
          onQuenchingTimeChange={form.setQuenchingTime}
        />

        {BIOCHAR_PROCESS_EVIDENCE_SLOTS.slice(3).map(renderEvidenceCapture)}

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

        <OfficerNotesSection value={form.officerNotes} onChange={form.setOfficerNotes} />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        {form.canSubmit ? (
          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={form.submitting}>
              <Text style={styles.primaryButtonText}>{form.submitting ? 'Submitting...' : 'Submit'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void handleSaveDraft()} disabled={form.submitting}>
              <Text style={styles.secondaryButtonText}>{form.submitting ? 'Saving...' : 'Save as Draft'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyText}>This activity has been submitted and can no longer be edited.</Text>
          </View>
        )}
      </ScrollView>

      <BiocharProductionSuccessModal
        visible={successVisible}
        batchCode={submittedBatchCode || form.batchCode}
        onClose={() => setSuccessVisible(false)}
        onBackToVisits={() => {
          setSuccessVisible(false);
          navigation.navigate('FarmerBiocharActivities');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  warningBanner: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  warningTitle: { color: '#9A3412', fontWeight: '700', fontSize: 14 },
  warningText: { color: '#9A3412', fontSize: 13, lineHeight: 18 },
  error: { color: '#B91C1C', fontSize: 14 },
  actions: { gap: 10, marginTop: 8, marginBottom: 8 },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    backgroundColor: '#EAF7EF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  readOnlyBanner: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 8 },
  readOnlyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
});
