import { useCallback, useEffect, useState } from 'react';
import { Alert, SafeAreaView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getAssignmentEvidence } from '../../api/evidenceApi';
import { AppButton } from '../../components/AppButton';
import { AppCard } from '../../components/AppCard';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { EvidenceUploadForm } from '../../components/evidence/EvidenceUploadForm';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { OFFICER_EVIDENCE_CATEGORY_OPTIONS } from '../../constants/evidenceCategories';
import { useEvidenceUpload } from '../../hooks/useEvidenceUpload';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { extractList, type ApiRecord } from '../../utils/apiHelpers';
import type { LiveCapturedEvidence } from '../../utils/liveEvidenceCapture';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitEvidenceUpload'>;

export function VisitEvidenceUploadScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const { progress, reload: reloadProgress } = useVisitVerificationProgress(assignmentId, 'evidence');
  const [category, setCategory] = useState('verification_photo');
  const [remarks, setRemarks] = useState('');
  const [slipNumber, setSlipNumber] = useState('');
  const [grossWeight, setGrossWeight] = useState('');
  const [tareWeight, setTareWeight] = useState('');
  const [netWeight, setNetWeight] = useState('');
  const [unit, setUnit] = useState('');
  const [weighingDate, setWeighingDate] = useState('');

  const evidenceUpload = useEvidenceUpload({
    role: 'field_officer',
    visitId: assignmentId,
    onSuccess: () => void reloadProgress(),
  });

  const loadEvidence = useCallback(async () => {
    await evidenceUpload.refreshList();
  }, [evidenceUpload]);

  useEffect(() => {
    void loadEvidence();
  }, [assignmentId]);

  if (!assignmentId) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Visit ID is missing. Please reopen this visit and try again." />
      </SafeAreaView>
    );
  }

  const handleSubmit = async (file: LiveCapturedEvidence | { uri: string; name: string; type: string }) => {
    const saved = await evidenceUpload.submitEvidence(file, {
      evidence_category: category,
      visit_id: assignmentId,
      remarks,
      notes: remarks,
      slip_number: slipNumber,
      gross_weight: grossWeight,
      tare_weight: tareWeight,
      net_weight: netWeight,
      unit,
      weighing_date: weighingDate,
    });

    if (!saved) {
      return;
    }

    setRemarks('');
    setSlipNumber('');
    setGrossWeight('');
    setTareWeight('');
    setNetWeight('');
    setUnit('');
    setWeighingDate('');
    Alert.alert('Evidence uploaded', 'Your evidence was saved successfully.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Upload Evidence" subtitle={`Assignment #${assignmentId}`} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <AppCard
          title="Uploaded evidence"
          subtitle={
            evidenceUpload.loadingList
              ? 'Loading saved evidence...'
              : `${evidenceUpload.uploadedCount} file${evidenceUpload.uploadedCount === 1 ? '' : 's'} saved on server`
          }
        />

        <EvidenceUploadForm
          categories={OFFICER_EVIDENCE_CATEGORY_OPTIONS}
          selectedCategory={category}
          onCategoryChange={setCategory}
          remarks={remarks}
          onRemarksChange={setRemarks}
          uploading={evidenceUpload.uploading}
          error={evidenceUpload.error}
          onSubmit={handleSubmit}
          showWeightSlipFields={category === 'weight_slip'}
          slipNumber={slipNumber}
          grossWeight={grossWeight}
          tareWeight={tareWeight}
          netWeight={netWeight}
          unit={unit}
          weighingDate={weighingDate}
          onSlipNumberChange={setSlipNumber}
          onGrossWeightChange={setGrossWeight}
          onTareWeightChange={setTareWeight}
          onNetWeightChange={setNetWeight}
          onUnitChange={setUnit}
          onWeighingDateChange={setWeighingDate}
        />

        <AppButton
          label="Continue to Review"
          onPress={() => navigation.navigate('VisitReportReview', { assignmentId })}
          variant="secondary"
          disabled={evidenceUpload.uploadedCount === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  container: { padding: 20, gap: 12 },
});
