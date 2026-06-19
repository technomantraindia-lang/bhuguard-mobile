import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { BiocharProductionSuccessModal } from '../../components/officer/biochar/BiocharProductionSuccessModal';
import {
  EvidenceCollectionSection,
  OfficerNotesSection,
  ProcessDataSection,
  ProductionBatchSection,
  ProductionRecordCard,
  ProductionTimeSection,
  ProductionUnitSection,
  VerificationResultSection,
} from '../../components/officer/biochar/BiocharProductionSections';
import { OfficerBiocharProductionHeader } from '../../components/officer/biochar/OfficerBiocharProductionHeader';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { useBiocharProductionForm } from '../../hooks/useBiocharProductionForm';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import type { BiocharEvidenceKey } from '../../constants/biocharProduction';
import type { FeedstockQuantityUnit, FeedstockTypeValue } from '../../constants/feedstockTypes';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerBiocharProduction'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerBiocharProduction'>;

export function FieldOfficerBiocharProductionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const form = useBiocharProductionForm({ farmerId: route.params?.farmerId });
  const [successVisible, setSuccessVisible] = useState(false);
  const [submittedBatchCode, setSubmittedBatchCode] = useState('');

  useEffect(() => {
    if (route.params?.gpsRecaptured && route.params.latitude != null && route.params.longitude != null) {
      void form.recaptureGps();
    }
  }, [form, route.params?.gpsRecaptured, route.params?.latitude, route.params?.longitude]);

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading biochar production form..." />
      </SafeAreaView>
    );
  }

  if (form.error && form.units.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (form.verificationResult === 'draft') {
      Alert.alert('Select submission status', 'Choose Submit for Review, Mark as Completed, or Correction Required.');
      return;
    }

    const batchCode = await form.submit();
    if (batchCode) {
      setSubmittedBatchCode(batchCode);
      setSuccessVisible(true);
    }
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

    if (key === 'production_video') {
      Alert.alert('Production video', 'Video evidence captured and ready for upload.');
      return;
    }

    navigation.navigate('OfficerFullscreenImage', { uri: asset.uri, title: 'Production Evidence' });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerBiocharProductionHeader
        officerName={form.officerName}
        onBackPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Visits' })}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Biochar Production</Text>

        <ProductionRecordCard
          productionRecordCode={form.productionRecordCode}
          batchCode={form.batchCode}
          officerName={form.officerName}
          statusLabel={form.statusLabel}
        />

        <ProductionUnitSection
          units={form.units}
          selectedUnitId={form.selectedUnitId}
          operatorName={form.operatorName}
          latitude={form.latitude}
          longitude={form.longitude}
          accuracyM={form.accuracyM}
          gpsCaptured={form.gpsCaptured}
          onSelectUnit={form.selectUnit}
          onOperatorNameChange={form.setOperatorName}
          onRecaptureGps={() => void form.recaptureGps()}
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

        <EvidenceCollectionSection
          evidence={form.evidence}
          onAddEvidence={(key) => void form.addEvidence(key)}
          onRemoveEvidence={form.removeEvidence}
          onPreviewEvidence={previewEvidence}
        />

        <OfficerNotesSection value={form.officerNotes} onChange={form.setOfficerNotes} />

        <VerificationResultSection value={form.verificationResult} onChange={form.setVerificationResult} />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={form.submitting}>
            <Text style={styles.primaryButtonText}>
              {form.submitting ? 'Submitting...' : 'Submit Production Record'}
            </Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => void handleSaveDraft()} disabled={form.submitting}>
            <Text style={styles.secondaryButtonText}>Save Draft</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BiocharProductionSuccessModal
        visible={successVisible}
        batchCode={submittedBatchCode || form.batchCode}
        onClose={() => setSuccessVisible(false)}
        onBackToVisits={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Visits' });
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
    paddingBottom: 120,
  },
  pageTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: officerTheme.onSurface,
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
});
