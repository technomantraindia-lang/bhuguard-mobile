import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { ArtisanGpsStatusCard } from '../../components/artisan/ArtisanGpsStatusCard';
import { BiocharProductionSuccessModal } from '../../components/officer/biochar/BiocharProductionSuccessModal';
import {
  BiocharEvidenceCaptureSection,
  MoistureSection,
  OfficerNotesSection,
  ProcessDataSection,
  ProductionBatchSection,
  ProductionRecordCard,
  ProductionTimeSection,
} from '../../components/officer/biochar/BiocharProductionSections';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import {
  BIOCHAR_BATCH_EVIDENCE_SLOT,
  BIOCHAR_MOISTURE_EVIDENCE_SLOT,
  BIOCHAR_OUTPUT_EVIDENCE_SLOT,
  BIOCHAR_PROCESS_EVIDENCE_SLOTS,
  type BiocharEvidenceKey,
} from '../../constants/biocharProduction';
import { useArtisanGpsTracker } from '../../hooks/useArtisanGpsTracker';
import { useBiocharProductionForm } from '../../hooks/useBiocharProductionForm';
import type { ArtisanStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { biocharEvidenceKeyToGpsStage } from '../../utils/artisanGpsAccuracy';
import type { FeedstockQuantityUnit, FeedstockTypeValue } from '../../constants/feedstockTypes';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanBiocharProduction'>;
type ScreenRoute = RouteProp<ArtisanStackParamList, 'ArtisanBiocharProduction'>;

export function ArtisanBiocharProductionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const form = useBiocharProductionForm({
    farmId: route.params.farmId,
    batchId: route.params?.batchId,
    apiMode: 'artisan',
  });
  const gps = useArtisanGpsTracker({
    farmId: route.params.farmId,
    batchId: form.batchId,
  });
  const [successVisible, setSuccessVisible] = useState(false);
  const [submittedBatchCode, setSubmittedBatchCode] = useState('');
  const [productionStartCaptured, setProductionStartCaptured] = useState(false);
  const readOnly = !form.canEdit;

  useEffect(() => {
    if (route.params?.gpsRecaptured) {
      void form.recaptureGps();
    }
  }, [form, route.params?.gpsRecaptured]);

  useEffect(() => {
    if (form.batchId && !productionStartCaptured && form.canEdit) {
      setProductionStartCaptured(true);
      void gps.captureGps('production_start', { farmId: route.params.farmId, biocharProductionId: form.batchId, silent: true });
    }
  }, [form.batchId, form.canEdit, gps, productionStartCaptured, route.params.farmId]);

  useEffect(() => {
    if (gps.latitude != null && gps.longitude != null) {
      void form.syncGpsFromCapture(gps.latitude, gps.longitude, gps.accuracyM);
    }
  }, [form, gps.accuracyM, gps.latitude, gps.longitude]);

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading biochar production form..." />
      </SafeAreaView>
    );
  }

  if (form.error && !form.batchId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    const submitGps = await gps.captureGps('submit', {
      farmId: route.params.farmId,
      biocharProductionId: form.batchId,
    });

    if (!submitGps) {
      Alert.alert('GPS required', 'GPS location is required before submit. Capture GPS and try again.');
      return;
    }

    await form.syncGpsFromCapture(submitGps.latitude, submitGps.longitude, submitGps.accuracyM);

    const code = await form.submit();
    if (code) {
      setSubmittedBatchCode(code);
      setSuccessVisible(true);
    }
  };

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();
    if (ok) {
      void gps.captureGps('feedstock_check', {
        farmId: route.params.farmId,
        biocharProductionId: form.batchId,
        silent: true,
      });
      Alert.alert('Draft saved', 'Production record saved as draft.');
    }
  };

  const handleAddEvidence = async (key: BiocharEvidenceKey) => {
    await form.addEvidence(key);
    const stage = biocharEvidenceKeyToGpsStage(key);
    if (stage) {
      await gps.captureGps(stage, {
        farmId: route.params.farmId,
        biocharProductionId: form.batchId,
        silent: true,
      });
    }
  };

  const handleEndTimeChange = (value: string) => {
    form.setEndTime(value);
    if (value.trim()) {
      void gps.captureGps('production_finish', {
        farmId: route.params.farmId,
        biocharProductionId: form.batchId,
        silent: true,
      });
    }
  };

  const renderEvidenceCapture = (slot: typeof BIOCHAR_BATCH_EVIDENCE_SLOT) => (
    <BiocharEvidenceCaptureSection
      key={slot.key}
      slot={slot}
      evidence={form.evidence[slot.key]}
      readOnly={readOnly}
      onAddEvidence={(key) => void handleAddEvidence(key)}
      onRemoveEvidence={form.removeEvidence}
      onPreviewEvidence={() => Alert.alert('Evidence', 'Captured and ready for upload.')}
    />
  );

  const gpsCardProps = {
    latitude: gps.latitude,
    longitude: gps.longitude,
    accuracyM: gps.accuracyM,
    accuracyTier: gps.accuracyTier,
    lastCapturedAt: gps.lastCapturedAt,
    capturing: gps.capturing,
    isPoorAccuracy: gps.isPoorAccuracy,
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Biochar Activity" subtitle={route.params.farmLabel} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProductionRecordCard
          productionRecordCode={form.productionRecordCode}
          batchCode={form.batchCode}
          officerName={form.officerName}
          farmerName={form.farmerName}
          productionDate={form.productionDate}
          statusLabel={form.statusLabel}
        />

        <ArtisanGpsStatusCard
          title="Production Start GPS"
          {...gpsCardProps}
          onCaptureGps={() =>
            void gps.captureGps('production_start', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
          onRetryGps={() =>
            void gps.retryGps('production_start', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
        />

        <ProductionBatchSection
          batchCode={form.batchCode}
          feedstockQuantity={form.feedstockQuantity}
          feedstockUnit={form.feedstockUnit}
          feedstockType={form.feedstockType}
          onGenerateBatchCode={() => void form.regenerateCodes()}
          onFeedstockQuantityChange={form.setFeedstockQuantity}
          onFeedstockUnitChange={(value) => form.setFeedstockUnit(value as FeedstockQuantityUnit)}
          onFeedstockTypeChange={(value) => form.setFeedstockType(value as FeedstockTypeValue)}
        />

        <ArtisanGpsStatusCard
          title="Feedstock Check GPS"
          {...gpsCardProps}
          onCaptureGps={() =>
            void gps.captureGps('feedstock_check', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
          onRetryGps={() =>
            void gps.retryGps('feedstock_check', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
        />

        {renderEvidenceCapture(BIOCHAR_BATCH_EVIDENCE_SLOT)}

        <MoistureSection
          moistureValue={form.moistureValue}
          moistureNotes={form.moistureNotes}
          onMoistureValueChange={form.setMoistureValue}
          onMoistureNotesChange={form.setMoistureNotes}
          readOnly={readOnly}
        />

        {renderEvidenceCapture(BIOCHAR_MOISTURE_EVIDENCE_SLOT)}

        <ProductionTimeSection
          startTime={form.startTime}
          endTime={form.endTime}
          onStartTimeChange={form.setStartTime}
          onEndTimeChange={handleEndTimeChange}
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

        {BIOCHAR_PROCESS_EVIDENCE_SLOTS.map(renderEvidenceCapture)}
        {renderEvidenceCapture(BIOCHAR_OUTPUT_EVIDENCE_SLOT)}

        <ArtisanGpsStatusCard
          title="Production Finish GPS"
          {...gpsCardProps}
          onCaptureGps={() =>
            void gps.captureGps('production_finish', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
          onRetryGps={() =>
            void gps.retryGps('production_finish', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
        />

        <OfficerNotesSection value={form.officerNotes} onChange={form.setOfficerNotes} />

        <ArtisanGpsStatusCard
          title="Submit GPS"
          {...gpsCardProps}
          onCaptureGps={() =>
            void gps.captureGps('submit', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
          onRetryGps={() =>
            void gps.retryGps('submit', { farmId: route.params.farmId, biocharProductionId: form.batchId })
          }
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        {form.canSubmit ? (
          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={form.submitting}>
              <Text style={styles.primaryButtonText}>{form.submitting ? 'Submitting…' : 'Submit'}</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void handleSaveDraft()} disabled={form.submitting}>
              <Text style={styles.secondaryButtonText}>{form.submitting ? 'Saving…' : 'Save as Draft'}</Text>
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
        onBackToVisits={() => {
          setSuccessVisible(false);
          navigation.navigate('ArtisanProductionRecords', { status: 'submitted' });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 120 },
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
