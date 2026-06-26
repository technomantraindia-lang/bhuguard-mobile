import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { MrvVerificationChecklistModals } from '../../components/officer/mrv/MrvVerificationChecklistModals';
import { SignatureCaptureModal } from '../../components/officer/SignatureCaptureModal';
import {
  MrvApplicationVerificationSection,
  MrvBottomActions,
  MrvDigitalSignatureSection,
  MrvEvidenceVerificationSection,
  MrvFarmVerificationSection,
  MrvFeedstockVerificationSection,
  MrvFinalRemarksSection,
  MrvGpsCheckInSection,
  MrvInventoryVerificationSection,
  MrvProductionVerificationSection,
  MrvTopVerificationCard,
  MrvVerificationSummarySection,
} from '../../components/officer/mrv/MrvVerificationChecklistSections';
import { OfficerMrvVerificationHeader } from '../../components/officer/mrv/OfficerMrvVerificationHeader';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { useMrvVerificationChecklistForm } from '../../hooks/useMrvVerificationChecklistForm';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VerificationChecklist'>;

export function VerificationChecklistScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const form = useMrvVerificationChecklistForm(assignmentId);
  const { progress } = useVisitVerificationProgress(assignmentId, 'checklist');

  const [capturingGps, setCapturingGps] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);
  const [signatureRole, setSignatureRole] = useState<'farmer' | 'officer' | null>(null);

  useFocusEffect(
    useCallback(() => {
      void form.reload();
    }, [form.reload]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await form.reload();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCaptureGps = async () => {
    setCapturingGps(true);
    try {
      await form.captureGps();
    } finally {
      setCapturingGps(false);
    }
  };

  const handleSaveDraft = async () => {
    const saved = await form.saveDraft();
    if (saved) {
      setDraftSavedVisible(true);
    }
  };

  const handleGenerateReport = async () => {
    if (!form.reportReady) {
      Alert.alert('Cannot Generate MRV Report', form.reportBlockers.join('\n'));
      return;
    }

    const saved = await form.saveWithReportGenerated();
    if (saved) {
      setSuccessVisible(true);
    }
  };

  const handleSubmitApproval = async () => {
    if (!form.approvalReady) {
      Alert.alert(
        'Cannot Submit For Approval',
        'Generate the MRV report before submitting for approval.',
      );
      return;
    }

    const saved = await form.submitForApproval();

    if (saved) {
      navigation.navigate('VisitReportReview', { assignmentId });
    }
  };

  const handleRequestCorrection = async () => {
    form.setVerificationResult('correction_required');
    const saved = await form.saveCorrectionRequired();
    if (saved) {
      Alert.alert(
        'Correction Requested',
        'Verification marked as correction required. Final remarks have been saved.',
        [
          {
            text: 'Open Report Review',
            onPress: () => navigation.navigate('VisitReportReview', { assignmentId }),
          },
          { text: 'Stay Here', style: 'cancel' },
        ],
      );
    }
  };

  const handleReject = () => {
    setRejectConfirmVisible(true);
  };

  const confirmReject = async () => {
    setRejectConfirmVisible(false);
    const saved = await form.saveRejected();
    if (saved) {
      Alert.alert('Verification Rejected', 'The verification has been marked as rejected.', [
        {
          text: 'Back to Dashboard',
          onPress: () => navigation.navigate('FieldOfficerTabs', { screen: 'Home' }),
        },
      ]);
    }
  };

  if (form.loading && !form.viewModel) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading verification checklist..." />
      </SafeAreaView>
    );
  }

  if (form.error && !form.viewModel) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  if (!form.viewModel) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Verification checklist could not be loaded." onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const officerName = form.viewModel.officerName;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerMrvVerificationHeader
        officerName={officerName}
        onBackPress={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
      >
        <Text style={styles.pageTitle}>Verification Checklist</Text>
        <Text style={styles.subtitle}>
          Verify all project activities before report submission. Pull down to refresh live data.
        </Text>

        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <MrvTopVerificationCard data={form.viewModel} />

        <MrvGpsCheckInSection
          gps={form.state.gps}
          capturing={capturingGps || form.verifyingGps}
          onCaptureGps={() => void handleCaptureGps()}
          onVerifyLocation={() => void form.verifyLocation()}
          onOpenGpsCheckIn={() => navigation.navigate('VisitCheckIn', { assignmentId })}
        />

        <MrvFarmVerificationSection
          section={form.state.farm}
          onToggleItem={(key) =>
            form.updateSectionItem('farm', key, !form.state.farm.items[key])
          }
          onRemarksChange={(text) => form.updateSectionRemarks('farm', text)}
        />

        <MrvFeedstockVerificationSection
          section={form.state.feedstock}
          onToggleItem={(key) =>
            form.updateSectionItem('feedstock', key, !form.state.feedstock.items[key])
          }
          onRemarksChange={(text) => form.updateSectionRemarks('feedstock', text)}
        />

        <MrvProductionVerificationSection
          section={form.state.production}
          onToggleItem={(key) =>
            form.updateSectionItem('production', key, !form.state.production.items[key])
          }
          onRemarksChange={(text) => form.updateSectionRemarks('production', text)}
        />

        <MrvApplicationVerificationSection
          section={form.state.application}
          onToggleItem={(key) =>
            form.updateSectionItem('application', key, !form.state.application.items[key])
          }
          onRemarksChange={(text) => form.updateSectionRemarks('application', text)}
        />

        <MrvInventoryVerificationSection
          section={form.state.inventory}
          onToggleItem={(key) =>
            form.updateSectionItem('inventory', key, !form.state.inventory.items[key])
          }
          onRemarksChange={(text) => form.updateSectionRemarks('inventory', text)}
        />

        <MrvEvidenceVerificationSection
          evidence={form.state.evidence}
          onViewEvidence={() => navigation.navigate('VisitEvidenceUpload', { assignmentId })}
          onApprove={() => form.setEvidenceStatus('approved')}
          onReject={() => form.setEvidenceStatus('rejected')}
        />

        <MrvDigitalSignatureSection
          farmerCaptured={form.state.signatures.farmerCaptured}
          officerCaptured={form.state.signatures.officerCaptured}
          onCaptureFarmer={() => setSignatureRole('farmer')}
          onCaptureOfficer={() => setSignatureRole('officer')}
          onClearFarmer={() => form.clearSignature('farmer')}
          onClearOfficer={() => form.clearSignature('officer')}
        />

        <MrvVerificationSummarySection
          state={form.state}
          completionPercent={form.completionPercent}
          verificationResult={form.state.verificationResult}
          onSelectResult={form.setVerificationResult}
        />

        <MrvFinalRemarksSection value={form.state.finalRemarks} onChange={form.setFinalRemarks} />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <MrvBottomActions
          saving={form.saving}
          onSaveDraft={() => void handleSaveDraft()}
          onGenerateReport={() => void handleGenerateReport()}
          onSubmitApproval={() => void handleSubmitApproval()}
          onRequestCorrection={() => void handleRequestCorrection()}
          onReject={handleReject}
        />
      </ScrollView>

      <MrvVerificationChecklistModals
        draftSavedVisible={draftSavedVisible}
        successVisible={successVisible}
        rejectConfirmVisible={rejectConfirmVisible}
        verificationId={form.viewModel.verificationId}
        onCloseDraftSaved={() => setDraftSavedVisible(false)}
        onCloseSuccess={() => setSuccessVisible(false)}
        onGenerateReport={() => {
          setSuccessVisible(false);
          navigation.navigate('VisitReportReview', { assignmentId });
        }}
        onGoDashboard={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Home' });
        }}
        onConfirmReject={() => void confirmReject()}
        onCancelReject={() => setRejectConfirmVisible(false)}
      />

      <SignatureCaptureModal
        visible={signatureRole !== null}
        title={signatureRole === 'farmer' ? 'Farmer Signature' : 'Officer Signature'}
        saving={form.capturingSignature}
        onClose={() => setSignatureRole(null)}
        onCaptured={(uri) => {
          if (!signatureRole) {
            return;
          }

          void form.uploadSignature(signatureRole, uri).then((saved) => {
            if (saved) {
              setSignatureRole(null);
            }
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },
  scroll: { flex: 1 },
  content: {
    padding: officerTheme.marginMobile,
    gap: 14,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: officerTheme.headingGreen,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    marginBottom: 4,
  },
  error: {
    color: officerTheme.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
