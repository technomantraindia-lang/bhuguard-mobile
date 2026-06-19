import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FeedstockVerificationModals } from '../../components/officer/feedstock/FeedstockVerificationModals';
import {
  EvidenceVerificationSection,
  FarmerCollectionRecordCard,
  FeedstockChecklistSection,
  GpsVerificationCard,
  OfficerRemarksSection,
  VerificationResultSection,
  VerificationStatusCard,
  WeightSlipVerificationCard,
} from '../../components/officer/feedstock/FeedstockVerificationSections';
import { OfficerFeedstockVerificationHeader } from '../../components/officer/feedstock/OfficerFeedstockVerificationHeader';
import { useFeedstockVerificationForm } from '../../hooks/useFeedstockVerificationForm';
import { getFieldOfficerProfile } from '../../api/fieldOfficerApi';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList, 'FieldOfficerFeedstockVerification'>;
type ScreenRoute = RouteProp<FieldOfficerStackParamList, 'FieldOfficerFeedstockVerification'>;

export function FieldOfficerFeedstockVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const form = useFeedstockVerificationForm(route.params?.verificationId);

  const [officerName, setOfficerName] = useState('Field Officer');
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);

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
          onBackPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Visits' })}
          onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
          onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
        />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No Feedstock Records Yet</Text>
          <Text style={styles.emptyMessage}>
            When an assigned farmer submits feedstock collection, it will appear here for verification.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => void form.reload()}>
            <Text style={styles.emptyButtonText}>Refresh</Text>
          </Pressable>
          <Pressable
            style={styles.emptyLink}
            onPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Visits' })}
          >
            <Text style={styles.emptyLinkText}>Go to Assigned Visits</Text>
          </Pressable>
        </View>
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

  const handleSaveDraft = async () => {
    const ok = await form.saveDraft();
    if (ok) {
      setDraftSavedVisible(true);
    }
  };

  const handleSubmit = async () => {
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
    if (!form.rejectionReason.trim()) {
      Alert.alert('Rejection reason required', 'Add a rejection reason before rejecting this record.');
      return;
    }
    await handleSubmit();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerFeedstockVerificationHeader
        officerName={officerName}
        onBackPress={() => navigation.navigate('FieldOfficerTabs', { screen: 'Visits' })}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Verify farmer feedstock collection records.</Text>

        <VerificationStatusCard data={data} />
        <FarmerCollectionRecordCard data={data} />
        <FeedstockChecklistSection items={form.checklist} onChange={form.updateChecklistItem} />

        <GpsVerificationCard
          gps={data.gps}
          gpsVerified={form.gpsVerified}
          gpsFlagged={form.gpsFlagged}
          onOpenMap={() => {
            if (data.gps.latitude == null || data.gps.longitude == null) {
              return;
            }
            navigation.navigate('OfficerGpsVerificationMap', {
              latitude: data.gps.latitude,
              longitude: data.gps.longitude,
              distanceKm: data.gps.distanceFromFarmKm ?? undefined,
            });
          }}
          onVerifyGps={() => {
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
          }}
          onFlagGps={() => {
            form.setGpsFlagged(true);
            form.setGpsVerified(false);
          }}
        />

        <EvidenceVerificationSection
          photos={data.photos}
          photosCount={data.photosCount}
          onPhotoPress={(_photoId, url) =>
            navigation.navigate('OfficerFullscreenImage', { uri: url, title: 'Feedstock Evidence' })
          }
          onApprovePhoto={(photoId) =>
            form.updatePhotoReview(photoId, { approved: true, rejected: false })
          }
          onRejectPhoto={(photoId) =>
            form.updatePhotoReview(photoId, { approved: false, rejected: true })
          }
        />

        <WeightSlipVerificationCard
          weightSlip={data.weightSlip}
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
            }
          }}
          onApprove={() => form.setWeightSlipApproved(true)}
          onReject={() => form.setWeightSlipApproved(false)}
        />

        <OfficerRemarksSection value={form.officerRemarks} onChange={form.setOfficerRemarks} />

        <VerificationResultSection
          value={form.verificationResult}
          onChange={form.setVerificationResult}
          correctionNotes={form.correctionNotes}
          onCorrectionNotesChange={form.setCorrectionNotes}
          requiredChanges={form.requiredChanges}
          onRequiredChangesChange={form.setRequiredChanges}
          rejectionReason={form.rejectionReason}
          onRejectionReasonChange={form.setRejectionReason}
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => void handleSaveDraft()} disabled={form.savingDraft}>
            <Text style={styles.secondaryButtonText}>{form.savingDraft ? 'Saving...' : 'Save Draft'}</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={form.submitting}>
            <Text style={styles.primaryButtonText}>{form.submitting ? 'Submitting...' : 'Submit Verification'}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              form.setVerificationResult('correction_required');
              navigation.navigate('OfficerFeedstockCorrection', {
                verificationId: data.id,
                initialNotes: form.correctionNotes,
                initialRequiredChanges: form.requiredChanges,
              });
            }}
          >
            <Text style={styles.secondaryButtonText}>Request Correction</Text>
          </Pressable>
          <Pressable style={[styles.secondaryButton, styles.rejectButton]} onPress={handleReject}>
            <Text style={[styles.secondaryButtonText, styles.rejectText]}>Reject Record</Text>
          </Pressable>
        </View>
      </ScrollView>

      <FeedstockVerificationModals
        draftSavedVisible={draftSavedVisible}
        successVisible={successVisible}
        rejectConfirmVisible={rejectConfirmVisible}
        verificationCode={data.verificationCode}
        farmerName={data.farmerName}
        statusLabel={data.verificationStatusLabel}
        verificationDateLabel={data.verificationDateLabel}
        onCloseDraftSaved={() => setDraftSavedVisible(false)}
        onCloseSuccess={() => setSuccessVisible(false)}
        onViewNextVerification={() => {
          setSuccessVisible(false);
          void form.reload();
        }}
        onGoDashboard={() => {
          setSuccessVisible(false);
          navigation.navigate('FieldOfficerTabs', { screen: 'Home' });
        }}
        onConfirmReject={() => void confirmReject()}
        onCancelReject={() => setRejectConfirmVisible(false)}
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
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: officerTheme.onSurfaceVariant,
    fontWeight: '500',
  },
  error: { color: officerTheme.error, fontSize: 14 },
  actions: { gap: 10, marginTop: 8 },
  primaryButton: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: officerTheme.surfaceLowest,
  },
  secondaryButtonText: { color: officerTheme.primaryContainer, fontWeight: '700', fontSize: 15 },
  rejectButton: { borderColor: officerTheme.error },
  rejectText: { color: officerTheme.error },
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
  emptyButton: {
    marginTop: 8,
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: officerTheme.onPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyLink: {
    paddingVertical: 8,
  },
  emptyLinkText: {
    color: officerTheme.primaryContainer,
    fontWeight: '600',
    fontSize: 14,
  },
});
