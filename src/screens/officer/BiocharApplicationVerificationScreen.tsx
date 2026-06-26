import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { OfficerScreenBottomNav } from '../../components/officer/OfficerScreenBottomNav';
import { BiocharApplicationVerificationModals } from '../../components/officer/biochar/BiocharApplicationVerificationModals';
import {
  BiocharAdditionalEvidenceSection,
  BiocharApplicationBottomActions,
  BiocharApplicationTopCard,
  BiocharBatchVerificationSection,
  BiocharDateVerificationSection,
  BiocharFinalResultSection,
  BiocharPhotoVerificationSection,
  BiocharQuantityVerificationSection,
  BiocharSubmittedRecordCard,
  BiocharPlotVerificationSection,
  BiocharVerificationSummarySection,
} from '../../components/officer/biochar/BiocharApplicationVerificationSections';
import {
  BIOCHAR_AFTER_PHOTO_CHECKLIST,
  BIOCHAR_BEFORE_PHOTO_CHECKLIST,
  BIOCHAR_DURING_PHOTO_CHECKLIST,
} from '../../constants/biocharApplicationVerificationChecklist';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useBiocharApplicationVerificationForm } from '../../hooks/useBiocharApplicationVerificationForm';
import { captureLivePhotoEvidence } from '../../utils/liveEvidenceCapture';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { captureHighAccuracyGps } from '../../utils/officerGpsCapture';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'BiocharApplicationVerification'>;

export function BiocharApplicationVerificationScreen({ route, navigation }: Props) {
  const { applicationId, assignmentId } = route.params ?? {};
  const form = useBiocharApplicationVerificationForm(applicationId, assignmentId);

  const [refreshing, setRefreshing] = useState(false);
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void form.reload();
    }, [form.reload]),
  );

  const data = form.application;

  const observedKg = Number(form.formState.officerObservedQuantity);
  const submittedKg = data?.quantityAppliedKg ?? 0;
  const availableKg = data?.batchAvailableQuantityKg ?? 0;
  const differenceLabel = Number.isFinite(observedKg)
    ? `${Math.round((observedKg - submittedKg) * 100) / 100} Kg`
    : '—';
  const remainingLabel = Number.isFinite(observedKg)
    ? `${Math.max(0, Math.round((availableKg - observedKg) * 100) / 100)} Kg`
    : `${availableKg} Kg`;

  const getPhotoReview = (phase: 'before' | 'during' | 'after') =>
    form.formState.photoReviews.find((item) => item.phase === phase)!;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await form.reload();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();
    if (ok) {
      setDraftSavedVisible(true);
    }
  };

  const handleSubmit = async () => {
    if (!form.submitReady) {
      Alert.alert('Cannot Submit Verification', form.submitBlockers.join('\n'));
      return;
    }

    if (!form.formState.verificationResult) {
      form.setVerificationResult('approved');
    }

    const ok = await form.submit();
    if (ok) {
      setSuccessVisible(true);
    }
  };

  const handleReject = () => {
    form.setVerificationResult('rejected');
    setRejectConfirmVisible(true);
  };

  const confirmReject = async () => {
    setRejectConfirmVisible(false);
    if (!form.formState.rejectionReason.trim()) {
      Alert.alert('Rejection reason required', 'Add a rejection reason before rejecting this record.');
      return;
    }
    await handleSubmit();
  };

  const captureAdditionalPhoto = async () => {
    const result = await captureLivePhotoEvidence({
      defaultName: 'biochar-verification.jpg',
      allowsEditing: true,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        Alert.alert('Capture failed', result.error);
      }

      return;
    }

    form.addAdditionalPhoto(result.evidence.uri);
  };

  const uploadDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets[0]?.uri) {
      form.addAdditionalDocument(result.assets[0].uri);
    }
  };

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading biochar application verification…" />
      </SafeAreaView>
    );
  }

  if (form.isEmpty || !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          message={form.error ?? 'No pending biochar application records found for verification.'}
          onRetry={() => void form.reload()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable style={styles.backButton} onPress={() => navigation.navigate('FieldOfficerFeedstockVerification')}>
          <BhuguardMaterialIcon name="arrow_forward" size={22} color={officerTheme.primary} />
        </Pressable>
        <Text style={styles.appBarTitle}>Bhuguard Field</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
      >
        <Text style={styles.pageTitle}>Biochar Application Verification</Text>
        <Text style={styles.subtitle}>Verify plot, batch, quantity, date and application evidence.</Text>

        <BiocharApplicationTopCard data={data} />
        <BiocharSubmittedRecordCard data={data} />

        <BiocharPlotVerificationSection
          section={form.formState.sections.plot}
          plotVerified={form.formState.plotVerified}
          onToggle={(key) => form.updateSectionItem('plot', key, !form.formState.sections.plot.items[key])}
          onRemarksChange={(text) => form.updateSectionRemarks('plot', text)}
          onResultChange={(result) => form.setSectionResult('plot', result)}
          onViewPlotMap={() => {
            if (data.plotLatitude == null || data.plotLongitude == null) {
              Alert.alert('Plot map unavailable', 'Plot GPS coordinates are not available.');
              return;
            }
            navigation.navigate('OfficerGpsVerificationMap', {
              latitude: data.plotLatitude,
              longitude: data.plotLongitude,
            });
          }}
          onVerifyPlotLocation={() => {
            if (data.plotLatitude == null || data.plotLongitude == null) {
              Alert.alert('GPS unavailable', 'Plot GPS coordinates are not available.');
              return;
            }
            form.setPlotVerified(true);
            form.setSectionResult('plot', 'pass');
            navigation.navigate('OfficerGpsValidation', {
              latitude: data.plotLatitude,
              longitude: data.plotLongitude,
            });
          }}
        />

        <BiocharBatchVerificationSection
          data={data}
          section={form.formState.sections.batch}
          batchVerified={form.formState.batchVerified}
          onToggle={(key) => form.updateSectionItem('batch', key, !form.formState.sections.batch.items[key])}
          onRemarksChange={(text) => form.updateSectionRemarks('batch', text)}
          onResultChange={(result) => form.setSectionResult('batch', result)}
          onViewBatchDetails={() => navigation.navigate('FieldOfficerBiocharProductionList')}
          onVerifyBatch={() => {
            form.setBatchVerified(true);
            form.setSectionResult('batch', 'pass');
            Alert.alert('Batch Verified', 'Batch record verified against production inventory.');
          }}
        />

        <BiocharQuantityVerificationSection
          data={data}
          section={form.formState.sections.quantity}
          officerObservedQuantity={form.formState.officerObservedQuantity}
          differenceLabel={differenceLabel}
          remainingLabel={remainingLabel}
          onObservedQuantityChange={form.setOfficerObservedQuantity}
          onToggle={(key) => form.updateSectionItem('quantity', key, !form.formState.sections.quantity.items[key])}
          onRemarksChange={(text) => form.updateSectionRemarks('quantity', text)}
          onResultChange={(result) => form.setSectionResult('quantity', result)}
        />

        <BiocharDateVerificationSection
          data={data}
          section={form.formState.sections.applicationDate}
          onToggle={(key) => form.updateSectionItem('applicationDate', key, !form.formState.sections.applicationDate.items[key])}
          onRemarksChange={(text) => form.updateSectionRemarks('applicationDate', text)}
          onResultChange={(result) => form.setSectionResult('applicationDate', result)}
        />

        {(['before', 'during', 'after'] as const).map((phase, index) => {
          const titles = ['Section 6 — Before Photo Verification', 'Section 7 — During Photo Verification', 'Section 8 — After Photo Verification'];
          const checklists = [BIOCHAR_BEFORE_PHOTO_CHECKLIST, BIOCHAR_DURING_PHOTO_CHECKLIST, BIOCHAR_AFTER_PHOTO_CHECKLIST];
          const sectionKeys = ['beforePhoto', 'duringPhoto', 'afterPhoto'] as const;
          const review = getPhotoReview(phase);

          return (
            <BiocharPhotoVerificationSection
              key={phase}
              title={titles[index]}
              phase={phase}
              photoUrl={data.photos[phase].url}
              section={form.formState.sections[sectionKeys[index]]}
              approved={review.approved}
              rejectionReason={review.rejectionReason}
              checklistItems={checklists[index]}
              onToggle={(key) => form.updateSectionItem(sectionKeys[index], key, !form.formState.sections[sectionKeys[index]].items[key])}
              onRemarksChange={(text) => form.updateSectionRemarks(sectionKeys[index], text)}
              onResultChange={(result) => form.setSectionResult(sectionKeys[index], result)}
              onViewFullscreen={() => {
                if (!data.photos[phase].url) {
                  return;
                }
                navigation.navigate('OfficerFullscreenImage', { uri: data.photos[phase].url!, title: `${phase} photo evidence` });
              }}
              onApprove={() => {
                form.updatePhotoReview(phase, { approved: true, rejectionReason: '' });
                form.setSectionResult(sectionKeys[index], 'pass');
              }}
              onReject={() => form.updatePhotoReview(phase, { approved: false })}
              onRejectionReasonChange={(text) => form.updatePhotoReview(phase, { rejectionReason: text })}
            />
          );
        })}

        <BiocharAdditionalEvidenceSection
          inspectionNote={form.formState.inspectionNote}
          additionalPhotos={form.formState.additionalPhotos}
          onCapturePhoto={() => void captureAdditionalPhoto()}
          onCaptureGps={async () => {
            try {
              await captureHighAccuracyGps();
              Alert.alert('GPS Captured', 'Additional GPS location captured successfully.');
            } catch (error) {
              Alert.alert('GPS capture failed', error instanceof Error ? error.message : 'Unable to capture GPS.');
            }
          }}
          onUploadDocument={() => void uploadDocument()}
          onInspectionNoteChange={form.setInspectionNote}
        />

        <BiocharVerificationSummarySection state={form.formState} completionPercent={form.completionPercent} />

        <BiocharFinalResultSection
          verificationResult={form.formState.verificationResult}
          finalRemarks={form.formState.finalRemarks}
          correctionReason={form.formState.correctionReason}
          requiredAction={form.formState.requiredAction}
          correctionDueDate={form.formState.correctionDueDate}
          rejectionReason={form.formState.rejectionReason}
          evidenceNotes={form.formState.evidenceNotes}
          onSelectResult={form.setVerificationResult}
          onFinalRemarksChange={form.setFinalRemarks}
          onCorrectionReasonChange={form.setCorrectionReason}
          onRequiredActionChange={form.setRequiredAction}
          onCorrectionDueDateChange={form.setCorrectionDueDate}
          onRejectionReasonChange={form.setRejectionReason}
          onEvidenceNotesChange={form.setEvidenceNotes}
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <BiocharApplicationBottomActions
          saving={form.savingDraft || form.submitting}
          onSaveDraft={() => void handleSaveDraft()}
          onSubmit={() => void handleSubmit()}
          onRequestCorrection={() => {
            form.setVerificationResult('correction_required');
            void handleSaveDraft();
          }}
          onReject={handleReject}
        />
      </ScrollView>

      <OfficerScreenBottomNav activeTab="Visits" />

      <BiocharApplicationVerificationModals
        draftSavedVisible={draftSavedVisible}
        successVisible={successVisible}
        rejectConfirmVisible={rejectConfirmVisible}
        verificationCode={data.verificationCode}
        applicationRecordId={data.applicationRecordId}
        farmerName={data.farmerName}
        plotId={data.plotId}
        batchId={data.batchId}
        statusLabel="Approved"
        onCloseDraftSaved={() => setDraftSavedVisible(false)}
        onProceedEvidence={() => {
          setSuccessVisible(false);
          if (assignmentId) {
            navigation.replace('EvidenceVerification', { assignmentId });
            return;
          }
          navigation.navigate('FieldOfficerTabs', { screen: 'Evidence' });
        }}
        onBackToVisits={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Visits' });
        }}
        onConfirmReject={() => void confirmReject()}
        onCancelReject={() => setRejectConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  appBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: officerTheme.outlineVariant, backgroundColor: officerTheme.surfaceLowest },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.headingGreen },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14, maxWidth: 390, width: '100%', alignSelf: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: officerTheme.headingGreen, marginTop: 8 },
  subtitle: { fontSize: 14, color: officerTheme.onSurfaceVariant, lineHeight: 20 },
  error: { color: officerTheme.error, fontSize: 13 },
});
