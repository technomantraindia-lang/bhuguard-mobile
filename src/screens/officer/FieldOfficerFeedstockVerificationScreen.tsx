import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FeedstockVerificationModals } from '../../components/officer/feedstock/FeedstockVerificationModals';
import {
  CollectionDateVerificationSection,
  FeedstockTypeVerificationSection,
  FeedstockVerificationBottomActions,
  FeedstockVerificationTopCard,
  FinalVerificationResultSection,
  GpsVerificationSection,
  OfficerAdditionalEvidenceSection,
  PhotosVerificationSection,
  QuantityVerificationSection,
  SubmittedFeedstockRecordSection,
  VerificationSummarySection,
  WeightSlipVerificationSection,
} from '../../components/officer/feedstock/FeedstockVerificationSections';
import { OfficerFeedstockVerificationHeader } from '../../components/officer/feedstock/OfficerFeedstockVerificationHeader';
import { OfficerScreenBottomNav } from '../../components/officer/OfficerScreenBottomNav';
import { useFeedstockVerificationForm } from '../../hooks/useFeedstockVerificationForm';
import { getFieldOfficerProfile } from '../../api/fieldOfficerApi';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { captureLivePhotoEvidence } from '../../utils/liveEvidenceCapture';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerFeedstockVerification'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerFeedstockVerification'>;

async function capturePhotoFromCamera(): Promise<string | null> {
  const result = await captureLivePhotoEvidence({
    defaultName: 'feedstock-evidence.jpg',
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
    Alert.alert('Gallery permission required', 'Allow gallery access to attach evidence photos.');
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

export function FieldOfficerFeedstockVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const [officerName, setOfficerName] = useState('Field Officer');
  const form = useFeedstockVerificationForm(route.params?.verificationId, officerName);

  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);
  const [downloadSuccessVisible, setDownloadSuccessVisible] = useState(false);

  useEffect(() => {
    void getFieldOfficerProfile().then((data) => {
      const user = (data.user ?? data) as ApiRecord;
      const name = pickString(user, 'name') !== '-' ? pickString(user, 'name') : 'Field Officer';
      setOfficerName(name);
    });
  }, []);

  useEffect(() => {
    if (route.params?.gpsVerified) {
      form.setGpsVerified(true);
      form.setGpsFlagged(false);
    }
  }, [route.params?.gpsVerified, form]);

  const handleBack = () => {
    if (route.params?.assignmentId) {
      navigation.navigate('FarmVerificationChecklist', { assignmentId: route.params.assignmentId });
      return;
    }

    navigation.navigate('FieldOfficerTabs', { screen: 'Visits' });
  };

  if (form.loading && !form.verification) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading feedstock verification..." />
      </SafeAreaView>
    );
  }

  if (form.isEmpty && !form.verification) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <OfficerFeedstockVerificationHeader
          officerName={officerName}
          onBackPress={handleBack}
          onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
          onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
        />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No Feedstock Records Yet</Text>
          <Text style={styles.emptyMessage}>
            When an assigned farmer submits feedstock collection, it will appear here for verification.
          </Text>
          <Pressable style={styles.emptyButtonWrap} onPress={() => void form.reload()}>
            <Text style={styles.emptyButton}>Refresh</Text>
          </Pressable>
        </View>
        <OfficerScreenBottomNav activeTab="Home" />
      </SafeAreaView>
    );
  }

  if (form.error && !form.verification) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={form.error} onRetry={form.reload} />
      </SafeAreaView>
    );
  }

  const data = form.verification!;
  const { formState } = form;

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

    if (!formState.rejectionReason.trim()) {
      Alert.alert('Rejection reason required', 'Add a rejection reason before rejecting this record.');
      return;
    }

    await handleSubmit();
  };

  const openGpsMap = () => {
    if (data.gps.latitude == null || data.gps.longitude == null) {
      Alert.alert('GPS unavailable', 'This record does not include GPS coordinates.');
      return;
    }

    navigation.navigate('OfficerGpsVerificationMap', {
      latitude: data.gps.latitude,
      longitude: data.gps.longitude,
      distanceKm: data.gps.distanceFromFarmKm ?? undefined,
    });
  };

  const openGpsValidation = () => {
    if (data.gps.latitude == null || data.gps.longitude == null) {
      Alert.alert('GPS unavailable', 'This record does not include GPS coordinates.');
      return;
    }

    navigation.navigate('OfficerGpsValidation', {
      latitude: data.gps.latitude,
      longitude: data.gps.longitude,
      accuracyM: data.gps.accuracyM ?? undefined,
      distanceKm: data.gps.distanceFromFarmKm ?? undefined,
      verificationId: data.id,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerFeedstockVerificationHeader
        officerName={officerName}
        onBackPress={handleBack}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Verify feedstock quantity, evidence and collection details.</Text>

        <FeedstockVerificationTopCard data={data} />
        <SubmittedFeedstockRecordSection data={data} />

        <FeedstockTypeVerificationSection
          state={formState.sections.typeVerification}
          onToggleItem={(key) =>
            form.updateSectionItem('typeVerification', key, !formState.sections.typeVerification.items[key])
          }
          onResultChange={(result) => form.updateSectionResult('typeVerification', result)}
          onRemarksChange={(text) => form.updateSectionRemarks('typeVerification', text)}
        />

        <QuantityVerificationSection
          data={data}
          state={formState.sections.quantityVerification}
          officerObservedQuantity={formState.officerObservedQuantity}
          onObservedQuantityChange={form.setOfficerObservedQuantity}
          onToggleItem={(key) =>
            form.updateSectionItem('quantityVerification', key, !formState.sections.quantityVerification.items[key])
          }
          onResultChange={(result) => form.updateSectionResult('quantityVerification', result)}
          onRemarksChange={(text) => form.updateSectionRemarks('quantityVerification', text)}
        />

        <CollectionDateVerificationSection
          data={data}
          state={formState.sections.collectionDateVerification}
          onToggleItem={(key) =>
            form.updateSectionItem(
              'collectionDateVerification',
              key,
              !formState.sections.collectionDateVerification.items[key],
            )
          }
          onResultChange={(result) => form.updateSectionResult('collectionDateVerification', result)}
          onRemarksChange={(text) => form.updateSectionRemarks('collectionDateVerification', text)}
        />

        <WeightSlipVerificationSection
          data={data}
          state={formState.sections.weightSlipVerification}
          weightSlipApproved={formState.weightSlipApproved}
          weightSlipRejectionReason={formState.weightSlipRejectionReason}
          onToggleItem={(key) =>
            form.updateSectionItem('weightSlipVerification', key, !formState.sections.weightSlipVerification.items[key])
          }
          onResultChange={(result) => form.updateSectionResult('weightSlipVerification', result)}
          onRemarksChange={(text) => form.updateSectionRemarks('weightSlipVerification', text)}
          onView={() => {
            if (data.weightSlip.url) {
              navigation.navigate('OfficerDocumentViewer', {
                url: data.weightSlip.url,
                title: 'Weight Slip',
              });
            }
          }}
          onDownload={() => {
            if (data.weightSlip.url) {
              void Linking.openURL(data.weightSlip.url);
              setDownloadSuccessVisible(true);
            }
          }}
          onApprove={() => form.setWeightSlipApproved(true)}
          onReject={() => form.setWeightSlipApproved(false)}
          onRejectionReasonChange={form.setWeightSlipRejectionReason}
        />

        <GpsVerificationSection
          data={data}
          state={formState.sections.gpsVerification}
          gpsVerified={formState.gpsVerified}
          gpsFlagged={formState.gpsFlagged}
          gpsOverrideReason={formState.gpsOverrideReason}
          gpsOverridePhotoUri={formState.gpsOverridePhotoUri}
          onToggleItem={(key) =>
            form.updateSectionItem('gpsVerification', key, !formState.sections.gpsVerification.items[key])
          }
          onResultChange={(result) => form.updateSectionResult('gpsVerification', result)}
          onRemarksChange={(text) => form.updateSectionRemarks('gpsVerification', text)}
          onOpenMap={openGpsMap}
          onVerifyGps={openGpsValidation}
          onFlagGps={() => {
            form.setGpsFlagged(true);
            form.setGpsVerified(false);
          }}
          onOverrideReasonChange={form.setGpsOverrideReason}
          onCaptureOverridePhoto={async () => {
            const uri = await capturePhotoFromCamera();
            if (uri) {
              form.setGpsOverridePhotoUri(uri);
            }
          }}
        />

        <PhotosVerificationSection
          data={data}
          state={formState.sections.photosVerification}
          photoReviews={formState.photoReviews}
          onToggleItem={(key) =>
            form.updateSectionItem('photosVerification', key, !formState.sections.photosVerification.items[key])
          }
          onResultChange={(result) => form.updateSectionResult('photosVerification', result)}
          onRemarksChange={(text) => form.updateSectionRemarks('photosVerification', text)}
          onPhotoPress={(_photoId, url) =>
            navigation.navigate('OfficerFullscreenImage', { uri: url, title: 'Feedstock Evidence' })
          }
          onApprovePhoto={(photoId) =>
            form.updatePhotoReview(photoId, { approved: true, rejected: false, rejectionReason: '' })
          }
          onRejectPhoto={(photoId) =>
            form.updatePhotoReview(photoId, { approved: false, rejected: true })
          }
          onPhotoRemarkChange={(photoId, remark) => form.updatePhotoReview(photoId, { remark })}
          onPhotoRejectionReasonChange={(photoId, rejectionReason) =>
            form.updatePhotoReview(photoId, { rejectionReason })
          }
          onAddMoreEvidence={async () => {
            const uri = await capturePhotoFromGallery();
            if (uri) {
              form.addOfficerEvidencePhoto(uri);
            }
          }}
        />

        <OfficerAdditionalEvidenceSection
          evidencePhotos={formState.officerEvidencePhotos}
          onCaptureFeedstockPhoto={async () => {
            const uri = await capturePhotoFromCamera();
            if (uri) {
              form.addOfficerEvidencePhoto(uri);
            }
          }}
          onUploadAdditionalPhoto={async () => {
            const uri = await capturePhotoFromGallery();
            if (uri) {
              form.addOfficerEvidencePhoto(uri);
            }
          }}
          onCaptureGpsAgain={() => openGpsValidation()}
          onAddDocument={async () => {
            const uri = await capturePhotoFromGallery();
            if (uri) {
              form.addOfficerEvidencePhoto(uri);
            }
          }}
        />

        <VerificationSummarySection
          formState={formState}
          data={data}
          completionPercent={form.completionPercent}
        />

        <FinalVerificationResultSection
          verificationResult={formState.verificationResult}
          correctionNotes={formState.correctionNotes}
          requiredChanges={formState.requiredChanges}
          correctionDueDate={formState.correctionDueDate}
          rejectionReason={formState.rejectionReason}
          evidenceNotes={formState.evidenceNotes}
          finalRemarks={formState.officerRemarks}
          onSelectResult={form.setVerificationResult}
          onCorrectionNotesChange={form.setCorrectionNotes}
          onRequiredChangesChange={form.setRequiredChanges}
          onCorrectionDueDateChange={form.setCorrectionDueDate}
          onRejectionReasonChange={form.setRejectionReason}
          onEvidenceNotesChange={form.setEvidenceNotes}
          onFinalRemarksChange={form.setOfficerRemarks}
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <FeedstockVerificationBottomActions
          savingDraft={form.savingDraft}
          submitting={form.submitting}
          onSaveDraft={() => void handleSaveDraft()}
          onSubmitVerification={() => void handleSubmit()}
          onRequestCorrection={() => {
            form.setVerificationResult('correction_required');
            navigation.navigate('OfficerFeedstockCorrection', {
              verificationId: data.id,
              initialNotes: formState.correctionNotes,
              initialRequiredChanges: formState.requiredChanges,
              initialDueDate: formState.correctionDueDate,
            });
          }}
          onReject={handleReject}
        />
      </ScrollView>

      <OfficerScreenBottomNav activeTab="Home" />

      <FeedstockVerificationModals
        draftSavedVisible={draftSavedVisible}
        successVisible={successVisible}
        rejectConfirmVisible={rejectConfirmVisible}
        downloadSuccessVisible={downloadSuccessVisible}
        verificationCode={data.verificationCode}
        feedstockCode={data.feedstockCode}
        farmerName={data.farmerName}
        quantityLabel={data.quantityLabel}
        statusLabel={data.verificationStatusLabel}
        onCloseDraftSaved={() => setDraftSavedVisible(false)}
        onCloseSuccess={() => setSuccessVisible(false)}
        onProceedBiocharApplication={() => {
          setSuccessVisible(false);
          navigation.navigate('BiocharApplicationVerification', {
            assignmentId: route.params?.assignmentId,
          });
        }}
        onBackToVisits={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Visits' });
        }}
        onConfirmReject={() => void confirmReject()}
        onCancelReject={() => setRejectConfirmVisible(false)}
        onCloseDownloadSuccess={() => setDownloadSuccessVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: {
    padding: officerTheme.marginMobile,
    gap: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  error: { color: officerTheme.error, fontSize: 14 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: officerTheme.primary,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 22,
    color: officerTheme.onSurfaceVariant,
    textAlign: 'center',
  },
  emptyButtonWrap: {
    marginTop: 8,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButton: {
    color: officerTheme.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
