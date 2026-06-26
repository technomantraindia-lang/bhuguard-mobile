import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FarmVerificationChecklistModals } from '../../components/officer/farm/FarmVerificationChecklistModals';
import { SignatureCaptureModal } from '../../components/officer/SignatureCaptureModal';
import {
  FarmActiveStatusSection,
  FarmBoundarySection,
  FarmCropSection,
  FarmDigitalSignatureSection,
  FarmEvidenceSummarySection,
  FarmExistenceSection,
  FarmFinalRemarksSection,
  FarmLandAreaSection,
  FarmVerificationBottomActions,
  FarmVerificationResultSection,
  FarmVerificationTopCard,
} from '../../components/officer/farm/FarmVerificationChecklistSections';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { useFarmVerificationChecklistForm } from '../../hooks/useFarmVerificationChecklistForm';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import type { FarmPhotoKey } from '../../constants/farmVerificationChecklist';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { captureLivePhotoEvidence } from '../../utils/liveEvidenceCapture';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'FarmVerificationChecklist'>;

async function capturePhotoFromCamera(): Promise<string | null> {
  const result = await captureLivePhotoEvidence({
    defaultName: 'farm-evidence.jpg',
    allowsEditing: true,
  });

  if (result.ok) {
    return result.evidence.uri;
  }

  if (!result.cancelled && result.error) {
    Alert.alert('Capture failed', result.error);
  }

  return null;
}

async function capturePhotoFromGallery(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Gallery permission required', 'Allow gallery access to attach farm evidence photos.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.8,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  return result.assets[0].uri;
}

export function FarmVerificationChecklistScreen({ route, navigation }: Props) {
  const { assignmentId } = route.params;
  const form = useFarmVerificationChecklistForm(assignmentId);
  const { progress } = useVisitVerificationProgress(assignmentId, 'checklist');

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

  const handlePhoto = async (key: FarmPhotoKey, source: 'camera' | 'gallery') => {
    const uri = source === 'camera' ? await capturePhotoFromCamera() : await capturePhotoFromGallery();

    if (uri) {
      form.setPhoto(key, uri);
    }
  };

  const handleVerifyBoundary = () => {
    form.setBoundaryVerified(true);
    form.updateBoundaryItem('boundary_matches_registration', true);
    form.updateBoundaryItem('boundary_visible', true);
  };

  const handleViewBoundary = () => {
    if (form.viewModel?.farmLatitude != null && form.viewModel.farmLongitude != null) {
      navigation.navigate('OfficerGpsVerificationMap', {
        latitude: form.viewModel.farmLatitude,
        longitude: form.viewModel.farmLongitude,
      });
      return;
    }

    Alert.alert('Boundary unavailable', 'Registered farm boundary coordinates are not available.');
  };

  const handleOpenFarmMap = () => {
    handleViewBoundary();
  };

  const handleSaveDraft = async () => {
    const saved = await form.saveDraft();

    if (saved) {
      setDraftSavedVisible(true);
    }
  };

  const handleSubmitVerification = async () => {
    if (!form.submitReady) {
      Alert.alert('Cannot Submit Verification', form.submitBlockers.join('\n'));
      return;
    }

    if (!form.state.verificationResult) {
      form.setVerificationResult('approved');
    }

    const saved = await form.submitVerification();

    if (saved) {
      setSuccessVisible(true);
    }
  };

  const handleRequestCorrection = async () => {
    form.setVerificationResult('correction_required');
    const saved = await form.saveCorrectionRequired();

    if (saved) {
      Alert.alert('Correction Requested', 'Farm verification marked as correction required.');
    }
  };

  const handleReject = () => {
    setRejectConfirmVisible(true);
  };

  const confirmReject = async () => {
    setRejectConfirmVisible(false);
    const saved = await form.saveRejected();

    if (saved) {
      Alert.alert('Verification Rejected', 'Farm verification has been marked as rejected.', [
        {
          text: 'Back to Dashboard',
          onPress: () => navigation.navigate('FieldOfficerTabs', { screen: 'Home' }),
        },
        { text: 'Stay Here', style: 'cancel' },
      ]);
    }
  };

  const statusLabel =
    form.state.verificationResult === 'approved' ||
    form.state.verificationResult === 'approved_with_remarks'
      ? 'Approved'
      : form.state.verificationResult === 'rejected'
        ? 'Rejected'
        : form.state.verificationResult === 'correction_required'
          ? 'Correction Required'
          : 'Pending Verification';

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading farm verification checklist…" />
      </SafeAreaView>
    );
  }

  if (!form.viewModel) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState
          message={form.error ?? 'Unable to load farm verification data.'}
          onRetry={() => void form.reload()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId })}
        >
          <BhuguardMaterialIcon name="arrow_forward" size={22} color={officerTheme.primary} />
        </Pressable>
        <Text style={styles.appBarTitle}>Bhuguard Field</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
      >
        <Text style={styles.pageTitle}>Farm Field Verification</Text>
        <Text style={styles.subtitle}>Extended farm boundary and crop verification (feedstock / field audit flows).</Text>

        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        <FarmVerificationTopCard data={form.viewModel} />

        <FarmExistenceSection
          state={form.state.existence}
          photos={form.state.photos}
          onToggleItem={(key) => form.updateExistenceItem(key, !form.state.existence.items[key])}
          onRemarksChange={form.updateExistenceRemarks}
          onTakePhoto={(key) => void handlePhoto(key, 'camera')}
          onUploadGallery={(key) => void handlePhoto(key, 'gallery')}
        />

        <FarmBoundarySection
          data={form.viewModel}
          state={form.state.boundary}
          onToggleItem={(key) => form.updateBoundaryItem(key, !form.state.boundary.items[key])}
          onRemarksChange={form.updateBoundaryRemarks}
          onViewBoundary={handleViewBoundary}
          onOpenFarmMap={handleOpenFarmMap}
          onVerifyBoundary={handleVerifyBoundary}
          onIssueTypeChange={form.setBoundaryIssueType}
          onCorrectionNotesChange={form.setBoundaryCorrectionNotes}
        />

        <FarmLandAreaSection
          state={form.state.landArea}
          onToggleItem={(key) => form.updateLandAreaItem(key, !form.state.landArea.items[key])}
          onRemarksChange={form.updateLandAreaRemarks}
        />

        <FarmCropSection
          data={form.viewModel}
          state={form.state.crop}
          photos={form.state.photos}
          onToggleItem={(key) => form.updateCropItem(key, !form.state.crop.items[key])}
          onRemarksChange={form.updateCropRemarks}
          onCropConditionChange={form.setCropCondition}
          onTakePhoto={(key) => void handlePhoto(key, 'camera')}
          onUploadGallery={(key) => void handlePhoto(key, 'gallery')}
        />

        <FarmActiveStatusSection
          state={form.state.activeStatus}
          onToggleItem={(key) => form.updateActiveStatusItem(key, !form.state.activeStatus.items[key])}
          onRemarksChange={form.updateActiveStatusRemarks}
          onFarmStatusChange={form.setFarmStatus}
        />

        <FarmEvidenceSummarySection
          evidence={form.state.evidence}
          onViewEvidence={() => navigation.navigate('VisitEvidenceUpload', { assignmentId })}
          onAddEvidence={() => navigation.navigate('VisitEvidenceUpload', { assignmentId })}
        />

        <FarmDigitalSignatureSection
          farmerCaptured={form.state.signatures.farmerCaptured}
          officerCaptured={form.state.signatures.officerCaptured}
          onCaptureFarmer={() => setSignatureRole('farmer')}
          onCaptureOfficer={() => setSignatureRole('officer')}
          onClearFarmer={() => form.clearSignature('farmer')}
          onClearOfficer={() => form.clearSignature('officer')}
        />

        <FarmVerificationResultSection
          state={form.state}
          completionPercent={form.completionPercent}
          verificationResult={form.state.verificationResult}
          onSelectResult={form.setVerificationResult}
        />

        <FarmFinalRemarksSection value={form.state.finalRemarks} onChange={form.setFinalRemarks} />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <FarmVerificationBottomActions
          saving={form.saving}
          onSaveDraft={() => void handleSaveDraft()}
          onSubmitVerification={() => void handleSubmitVerification()}
          onRequestCorrection={() => void handleRequestCorrection()}
          onReject={handleReject}
        />
      </ScrollView>

      <FarmVerificationChecklistModals
        draftSavedVisible={draftSavedVisible}
        successVisible={successVisible}
        rejectConfirmVisible={rejectConfirmVisible}
        verificationId={form.viewModel.verificationId}
        farmerName={form.viewModel.farmerName}
        farmName={form.viewModel.farmName}
        statusLabel={statusLabel}
        onCloseDraftSaved={() => setDraftSavedVisible(false)}
        onProceedFeedstock={() => {
          setSuccessVisible(false);
          navigation.replace('FieldOfficerFeedstockVerification', { assignmentId });
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scaleX: -1 }],
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: officerTheme.headingGreen,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
    maxWidth: 390,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: officerTheme.headingGreen,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: officerTheme.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 4,
  },
  error: { color: officerTheme.error, fontSize: 13 },
});
