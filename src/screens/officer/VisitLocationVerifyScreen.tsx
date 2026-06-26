import { useState } from 'react';

import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { captureLivePhotoEvidence } from '../../utils/liveEvidenceCapture';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';



import { AppButton } from '../../components/AppButton';

import {

  VisitGpsAlertBanner,

  VisitGpsMapPreview,

  VisitGpsOverrideSection,

  VisitGpsPoorAccuracyConfirmSection,

  VisitGpsStatusCard,

  VisitLocationVerifyResultCard,

} from '../../components/officer/gps/VisitGpsCheckInSections';

import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';

import { LoadingState } from '../../components/LoadingState';

import { ScreenHeader } from '../../components/ScreenHeader';

import { useVisitGpsCheckIn } from '../../hooks/useVisitGpsCheckIn';

import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';

import type { FieldOfficerStackParamList } from '../../navigation/types';

import { colors } from '../../theme/colors';

import { officerTheme } from '../../theme/officerDashboardTheme';

import { openGoogleMaps } from '../../utils/officerGpsCapture';

import { MAX_ALLOWED_ACCURACY_METERS } from '../../utils/locationUtils';



type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitLocationVerify'>;



export function VisitLocationVerifyScreen({ route, navigation }: Props) {

  const { assignmentId, capture, verification: initialVerification } = route.params;

  const { progress, reload } = useVisitVerificationProgress(assignmentId, 'check_in');

  const gps = useVisitGpsCheckIn(assignmentId);



  const [overrideReason, setOverrideReason] = useState('');

  const [overridePhotoUri, setOverridePhotoUri] = useState<string | null>(null);



  const context = gps.context;

  const verification = initialVerification;

  const isVerified = verification.insideVisitArea;

  const isPoorAccuracy = capture.accuracyM > MAX_ALLOWED_ACCURACY_METERS;



  const handleCaptureOverridePhoto = async () => {
    const result = await captureLivePhotoEvidence({
      defaultName: 'override-proof.jpg',
      allowsEditing: true,
    });

    if (!result.ok) {
      if (!result.cancelled && result.error) {
        if (result.error.includes('permission')) {
          Alert.alert('Camera permission required', 'Allow camera access to capture override proof photo.');
        } else {
          Alert.alert('Capture failed', result.error);
        }
      }

      return;
    }

    setOverridePhotoUri(result.evidence.uri);
  };



  const handleSaveCheckIn = async () => {

    const saved = isVerified

      ? await gps.submitCheckIn()

      : await gps.submitCheckIn({

          forceOverride: true,

          overrideReason,

          overridePhotoUri: overridePhotoUri ?? undefined,

        });



    if (!saved) {

      return;

    }



    await reload();



    if (isVerified) {

      navigation.replace('VisitEvidenceUpload', { assignmentId });

      return;

    }



    Alert.alert('Request submitted', 'Outside-radius check-in request sent to admin for review.', [

      { text: 'OK', onPress: () => navigation.goBack() },

    ]);

  };



  const canSaveVerified = isVerified && !isPoorAccuracy && !gps.submitting;

  const canSaveOverride =

    !isVerified && overrideReason.trim().length >= 8 && !isPoorAccuracy && !gps.submitting;



  if (gps.loading) {

    return (

      <SafeAreaView style={styles.safe}>

        <ScreenHeader title="Location Verify" subtitle={`Assignment #${assignmentId}`} />

        <LoadingState message="Loading visit context…" />

      </SafeAreaView>

    );

  }



  if (!context) {

    return (

      <SafeAreaView style={styles.safe}>

        <ScreenHeader title="Location Verify" subtitle={`Assignment #${assignmentId}`} />

        <View style={styles.center}>

          <Text style={styles.loadingText}>Loading visit context…</Text>

        </View>

      </SafeAreaView>

    );

  }



  return (

    <SafeAreaView style={styles.safe}>

      <ScreenHeader title="Location Verify" subtitle={context.visitId} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <VisitVerificationProgressStepper

          currentStep={progress.currentStep}

          completedSteps={progress.completedSteps}

        />



        <VisitLocationVerifyResultCard

          verification={verification}

          allowedRadiusMeter={context.allowedRadiusMeter}

        />



        <VisitGpsStatusCard

          permissionStatus={gps.permissionStatus}

          gpsServiceEnabled={gps.gpsServiceEnabled}

          capture={capture}

          verification={verification}

          allowedRadiusMeter={context.allowedRadiusMeter}

          farmLatitude={context.farmLatitude}

          farmLongitude={context.farmLongitude}

        />



        <VisitGpsMapPreview

          capture={capture}

          farmLatitude={context.farmLatitude}

          farmLongitude={context.farmLongitude}

        />



        <VisitGpsPoorAccuracyConfirmSection

          visible={isPoorAccuracy}

          reason=""

          onReasonChange={() => undefined}

        />



        {!isVerified ? (

          <VisitGpsOverrideSection

            reason={overrideReason}

            photoUri={overridePhotoUri}

            onReasonChange={setOverrideReason}

            onCapturePhoto={() => void handleCaptureOverridePhoto()}

          />

        ) : null}



        {gps.error ? <Text style={styles.error}>{gps.error}</Text> : null}



        {gps.offlineSaved ? (

          <VisitGpsAlertBanner tone="success" message="Saved offline. Will sync when internet is available." />

        ) : null}



        <View style={styles.actions}>

          <AppButton

            label="Open in Google Maps"

            variant="secondary"

            onPress={() => void openGoogleMaps(capture.latitude, capture.longitude)}

          />

          <AppButton

            label={gps.submitting ? 'Saving…' : 'Save Check-In'}

            onPress={() => void handleSaveCheckIn()}

            loading={gps.submitting}

            disabled={isVerified ? !canSaveVerified : !canSaveOverride}

          />

          <AppButton

            label="Back to GPS Check-In"

            variant="ghost"

            onPress={() => navigation.goBack()}

          />

        </View>

      </ScrollView>

    </SafeAreaView>

  );

}



const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: colors.background },

  container: { padding: 20, gap: 14, paddingBottom: 32 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  loadingText: { color: officerTheme.outline, fontSize: 14 },

  error: { color: officerTheme.error, fontSize: 13 },

  actions: { gap: 10, marginTop: 4 },

});


