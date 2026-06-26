import { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EvidenceVerificationModals } from '../../components/officer/evidence/EvidenceVerificationModals';
import {
  ApplicationPhotosSection,
  DocumentsSection,
  EvidenceCompletionSection,
  EvidenceFinalResultSection,
  EvidenceSummaryCards,
  EvidenceVerificationBottomActions,
  EvidenceVerificationTopCard,
  FeedstockPhotosSection,
  GpsRecordsSection,
  ProductionPhotosSection,
  WeightSlipSection,
} from '../../components/officer/evidence/EvidenceVerificationSections';
import { OfficerScreenBottomNav } from '../../components/officer/OfficerScreenBottomNav';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useEvidenceVerificationForm } from '../../hooks/useEvidenceVerificationForm';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'EvidenceVerification'>;

export function EvidenceVerificationScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const form = useEvidenceVerificationForm(assignmentId);

  const [refreshing, setRefreshing] = useState(false);
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);
  const [downloadSuccessVisible, setDownloadSuccessVisible] = useState(false);
  const [rejectionSheetVisible, setRejectionSheetVisible] = useState(false);
  const [rejectionTargetLabel, setRejectionTargetLabel] = useState('evidence item');
  const [pendingRejectAction, setPendingRejectAction] = useState<(() => void) | null>(null);
  const [sheetRejectionReason, setSheetRejectionReason] = useState('');

  useFocusEffect(
    useCallback(() => {
      void form.reload();
    }, [form.reload]),
  );

  const data = form.viewModel;

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
      Alert.alert('Cannot Submit Evidence Verification', form.submitBlockers.join('\n'));
      return;
    }

    if (!form.formState.verificationResult) {
      form.setVerificationResult('approved');
    }

    if (!form.formState.officerRemarks.trim() && form.formState.finalRemarks.trim()) {
      form.setOfficerRemarks(form.formState.finalRemarks);
    }

    const ok = await form.submit();
    if (ok) {
      setSuccessVisible(true);
    }
  };

  const openRejectSheet = (label: string, action: () => void) => {
    setRejectionTargetLabel(label);
    setPendingRejectAction(() => action);
    setSheetRejectionReason('');
    setRejectionSheetVisible(true);
  };

  const confirmRejectSheet = () => {
    setRejectionSheetVisible(false);
    pendingRejectAction?.();
    setPendingRejectAction(null);
  };

  const handleReject = () => {
    form.setVerificationResult('rejected');
    setRejectConfirmVisible(true);
  };

  const confirmReject = async () => {
    setRejectConfirmVisible(false);
    if (!form.formState.rejectionReason.trim()) {
      Alert.alert('Rejection reason required', 'Add a rejection reason before rejecting evidence.');
      return;
    }
    await handleSubmit();
  };

  const openDocument = (url: string | null, title: string) => {
    if (!url) {
      return;
    }
    navigation.navigate('OfficerDocumentViewer', { url, title });
  };

  const downloadDocument = async (url: string | null) => {
    if (!url) {
      return;
    }
    try {
      await Linking.openURL(url);
      setDownloadSuccessVisible(true);
    } catch {
      Alert.alert('Download failed', 'Unable to open document download link.');
    }
  };

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading evidence verification…" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error ?? 'Unable to load evidence verification.'} onRetry={() => void form.reload()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable
          style={styles.backButton}
          onPress={() =>
            navigation.navigate('BiocharApplicationVerification', {
              assignmentId,
            })
          }
        >
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
        <Text style={styles.pageTitle}>Evidence Verification</Text>
        <Text style={styles.subtitle}>Review photos, GPS records, weight slips and documents.</Text>

        <EvidenceVerificationTopCard data={data} />
        <EvidenceSummaryCards summary={data.summary} />

        <FeedstockPhotosSection
          photos={data.feedstockPhotos}
          reviews={form.formState.feedstockPhotoReviews}
          onViewFullscreen={(uri, title) => navigation.navigate('OfficerFullscreenImage', { uri, title })}
          onApprove={(id) => form.updatePhotoReview('feedstock', id, 'approved')}
          onReject={(id) =>
            openRejectSheet('feedstock photo', () => form.updatePhotoReview('feedstock', id, 'rejected'))
          }
          onRemarkChange={(id, text) => form.setPhotoRemark('feedstock', id, text)}
        />

        <ProductionPhotosSection
          photos={data.productionPhotos}
          reviews={form.formState.productionPhotoReviews}
          onViewFullscreen={(uri, title) => navigation.navigate('OfficerFullscreenImage', { uri, title })}
          onApprove={(id) => form.updatePhotoReview('production', id, 'approved')}
          onReject={(id) =>
            openRejectSheet('production photo', () => form.updatePhotoReview('production', id, 'rejected'))
          }
          onRemarkChange={(id, text) => form.setPhotoRemark('production', id, text)}
        />

        <ApplicationPhotosSection
          photos={data.applicationPhotos}
          reviews={form.formState.applicationPhotoReviews}
          onViewFullscreen={(uri, title) => navigation.navigate('OfficerFullscreenImage', { uri, title })}
          onApprove={(id) => form.updatePhotoReview('application', id, 'approved')}
          onReject={(id) =>
            openRejectSheet('application photo', () => form.updatePhotoReview('application', id, 'rejected'))
          }
          onRemarkChange={(id, text) => form.setPhotoRemark('application', id, text)}
        />

        <GpsRecordsSection
          records={data.gpsRecords}
          reviews={form.formState.gpsRecordReviews}
          onViewMap={(record) =>
            navigation.navigate('OfficerGpsVerificationMap', {
              latitude: record.latitude,
              longitude: record.longitude,
            })
          }
          onVerifyGps={(id) => {
            form.updateGpsReview(id, 'verified', 'Verified');
            Alert.alert('GPS Verified', 'GPS record verified successfully.');
          }}
          onFlagIssue={(id) => {
            form.updateGpsReview(id, 'outside_radius', 'Outside Radius');
            openRejectSheet('GPS record', () => form.updateGpsReview(id, 'outside_radius', 'Outside Radius'));
          }}
          onRemarkChange={(id, text) => form.setGpsRemark(id, text)}
        />

        <WeightSlipSection
          weightSlip={data.weightSlip}
          review={form.formState.weightSlipReview}
          onViewDocument={() => openDocument(data.weightSlip?.url ?? null, 'Weight Slip')}
          onDownload={() => void downloadDocument(data.weightSlip?.url ?? null)}
          onApprove={() => form.updateWeightSlipReview('approved')}
          onReject={() =>
            openRejectSheet('weight slip', () => form.updateWeightSlipReview('rejected'))
          }
          onRemarkChange={form.setWeightSlipRemark}
        />

        <DocumentsSection
          documents={data.documents}
          reviews={form.formState.documentReviews}
          onView={(doc) => openDocument(doc.url, doc.title)}
          onDownload={(doc) => void downloadDocument(doc.url)}
          onApprove={(id) => form.updateDocumentReview(id, 'approved')}
          onReject={(id) =>
            openRejectSheet('document', () => form.updateDocumentReview(id, 'rejected'))
          }
          onRemarkChange={form.setDocumentRemark}
        />

        <EvidenceCompletionSection
          checklist={form.formState.completionChecklist}
          completionPercent={form.completionPercent}
          onToggle={form.toggleCompletionItem}
        />

        <EvidenceFinalResultSection
          verificationResult={form.formState.verificationResult}
          finalRemarks={form.formState.finalRemarks}
          correctionReason={form.formState.correctionReason}
          requiredEvidence={form.formState.requiredEvidence}
          correctionDueDate={form.formState.correctionDueDate}
          rejectionReason={form.formState.rejectionReason}
          evidenceNotes={form.formState.evidenceNotes}
          onSelectResult={form.setVerificationResult}
          onFinalRemarksChange={form.setFinalRemarks}
          onCorrectionReasonChange={form.setCorrectionReason}
          onRequiredEvidenceChange={form.setRequiredEvidence}
          onCorrectionDueDateChange={form.setCorrectionDueDate}
          onRejectionReasonChange={form.setRejectionReason}
          onEvidenceNotesChange={form.setEvidenceNotes}
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <EvidenceVerificationBottomActions
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

      <OfficerScreenBottomNav activeTab="Evidence" />

      <EvidenceVerificationModals
        draftSavedVisible={draftSavedVisible}
        successVisible={successVisible}
        rejectConfirmVisible={rejectConfirmVisible}
        downloadSuccessVisible={downloadSuccessVisible}
        rejectionSheetVisible={rejectionSheetVisible}
        rejectionTargetLabel={rejectionTargetLabel}
        verificationCode={data.verificationCode}
        visitId={data.visitId}
        farmerName={data.farmerName}
        onCloseDraftSaved={() => setDraftSavedVisible(false)}
        onProceedDigitalSignature={() => {
          setSuccessVisible(false);
          navigation.replace('VisitReportReview', { assignmentId });
        }}
        onBackToVisits={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Visits' });
        }}
        onConfirmReject={() => void confirmReject()}
        onCancelReject={() => setRejectConfirmVisible(false)}
        onCloseDownloadSuccess={() => setDownloadSuccessVisible(false)}
        onCloseRejectionSheet={() => setRejectionSheetVisible(false)}
        onConfirmRejectionSheet={() => confirmRejectSheet()}
        rejectionReason={sheetRejectionReason}
        onRejectionReasonChange={setSheetRejectionReason}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: officerTheme.outlineVariant,
    backgroundColor: officerTheme.surfaceLowest,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', transform: [{ scaleX: -1 }] },
  appBarTitle: { fontSize: 16, fontWeight: '700', color: officerTheme.headingGreen },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 14, maxWidth: 390, width: '100%', alignSelf: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: officerTheme.headingGreen, marginTop: 8 },
  subtitle: { fontSize: 14, color: officerTheme.onSurfaceVariant, lineHeight: 20 },
  error: { color: officerTheme.error, fontSize: 13 },
});
