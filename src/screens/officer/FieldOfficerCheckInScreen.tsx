import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import {
  VisitGpsAlertBanner,
  VisitGpsDistanceVerificationCard,
  VisitGpsInsideRadiusCard,
  VisitGpsMapPreview,
  VisitGpsOutsideRadiusCard,
  VisitGpsPermissionDeniedCard,
  VisitGpsPoorAccuracyBanner,
  VisitGpsServiceDisabledCard,
  VisitGpsStatusCard,
  VisitGpsSummaryCard,
  VisitGpsTargetLocationCard,
} from '../../components/officer/gps/VisitGpsCheckInSections';
import { VisitVerificationProgressStepper } from '../../components/officer/VisitVerificationProgressStepper';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useVisitGpsCheckIn } from '../../hooks/useVisitGpsCheckIn';
import { useVisitVerificationProgress } from '../../hooks/useVisitVerificationProgress';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { openDeviceSettings, openLocationSettings } from '../../utils/locationUtils';
import { ensureVisitReadyForGpsCheckIn } from '../../utils/visitWorkflowHelpers';

type Props = NativeStackScreenProps<FieldOfficerStackParamList, 'VisitCheckIn'>;

export function FieldOfficerCheckInScreen({ route, navigation }: Props) {
  const { assignmentId, visitContext } = route.params;
  const { progress, reload: reloadProgress } = useVisitVerificationProgress(assignmentId, 'check_in');
  const gps = useVisitGpsCheckIn(assignmentId, visitContext);
  const [preparingVisit, setPreparingVisit] = useState(true);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const autoCaptureAttempted = useRef(false);
  const prepareStarted = useRef(false);

  const prepareVisit = useCallback(async () => {
    setPreparingVisit(true);
    setPrepareError(null);

    try {
      await ensureVisitReadyForGpsCheckIn(assignmentId);
      await reloadProgress();
      await gps.reload();
    } catch (err) {
      setPrepareError(err instanceof Error ? err.message : 'Unable to prepare visit for GPS check-in.');
    } finally {
      setPreparingVisit(false);
    }
  }, [assignmentId, gps.reload, reloadProgress]);

  useEffect(() => {
    if (prepareStarted.current) {
      return;
    }

    prepareStarted.current = true;
    void prepareVisit();
  }, [prepareVisit]);

  useEffect(() => {
    if (
      preparingVisit ||
      gps.loading ||
      !gps.context ||
      gps.capture ||
      gps.capturing ||
      autoCaptureAttempted.current
    ) {
      return;
    }

    if (gps.permissionStatus === 'granted' && gps.gpsServiceEnabled !== false) {
      autoCaptureAttempted.current = true;
      void gps.captureGps();
    }
  }, [
    preparingVisit,
    gps.loading,
    gps.context,
    gps.capture,
    gps.capturing,
    gps.permissionStatus,
    gps.gpsServiceEnabled,
    gps.captureGps,
  ]);

  const handleVerifyCheckIn = async () => {
    setPrepareError(null);

    try {
      await ensureVisitReadyForGpsCheckIn(assignmentId);
    } catch (err) {
      setPrepareError(err instanceof Error ? err.message : 'Unable to start visit before GPS check-in.');
      return;
    }

    const saved = await gps.submitCheckIn();

    if (!saved) {
      return;
    }

    await reloadProgress();
    Alert.alert('GPS check-in complete', 'You are verified inside the farm radius. Continue verification steps.', [
      {
        text: 'Continue',
        onPress: () =>
          navigation.replace('FieldOfficerVisitVerification', {
            assignmentId: Number(assignmentId),
          }),
      },
    ]);
  };

  const handleOutsideRadiusRequest = async () => {
    const saved = await gps.submitCheckIn({
      forceOverride: true,
      overrideReason,
    });

    if (!saved) {
      return;
    }

    Alert.alert(
      'Request submitted',
      'Your outside-radius check-in request was sent to admin for review.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  const visitSubtitle =
    visitContext?.visitId && visitContext.visitId !== '-'
      ? visitContext.visitId
      : gps.context?.visitId && gps.context.visitId !== '-'
        ? gps.context.visitId
        : `Visit #${assignmentId}`;

  if (preparingVisit) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="GPS Check-in" subtitle={visitSubtitle} />
        <LoadingState message="Preparing visit for GPS check-in..." />
      </SafeAreaView>
    );
  }

  if (gps.loading && !gps.context) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="GPS Check-in" subtitle={visitSubtitle} />
        <LoadingState message="Loading visit GPS details..." />
      </SafeAreaView>
    );
  }

  if (!gps.context) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="GPS Check-in" subtitle={visitSubtitle} />
        <ErrorState
          message={prepareError ?? gps.error ?? 'Unable to load visit GPS data.'}
          onRetry={() => {
            prepareStarted.current = false;
            autoCaptureAttempted.current = false;
            void prepareVisit();
          }}
        />
      </SafeAreaView>
    );
  }

  const isInsideRadius = Boolean(gps.verification?.insideVisitArea);
  const isPoorAccuracy = (gps.capture?.accuracyM ?? 0) > 100;
  const isOutsideRadius = Boolean(gps.verification && !gps.verification.insideVisitArea);
  const missingTargetCoordinates = Boolean(gps.context && !gps.context.hasTargetCoordinates);
  const needsFarmRegistration = Boolean(gps.context?.needsFarmCoordinates);
  const statusLabel = gps.context.checkinStatus.replace(/_/g, ' ');
  const captureTimedOut = Boolean(gps.error && /unable to capture location/i.test(gps.error));

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="GPS Check-in" subtitle={visitSubtitle} />
      <View style={styles.statusBadgeRow}>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{statusLabel}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <VisitVerificationProgressStepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />

        {prepareError ? <Text style={styles.error}>{prepareError}</Text> : null}
        {gps.error ? <Text style={styles.error}>{gps.error}</Text> : null}

        {needsFarmRegistration ? (
          <VisitGpsAlertBanner
            tone="warning"
            message="Farm GPS is not registered yet. Your current location will be saved as the farm GPS when you check in."
          />
        ) : missingTargetCoordinates ? (
          <VisitGpsAlertBanner
            tone="danger"
            message="Farm/Site GPS coordinates are missing. Please contact admin."
          />
        ) : null}

        {gps.offlineSaved ? (
          <VisitGpsAlertBanner tone="success" message="Saved offline. Will sync when internet is available." />
        ) : null}

        <VisitGpsSummaryCard context={gps.context} />
        <VisitGpsTargetLocationCard context={gps.context} />

        <VisitGpsPermissionDeniedCard
          visible={gps.permissionStatus === 'denied'}
          onAllowPermission={() => {
            autoCaptureAttempted.current = false;
            void gps.requestPermission().then((status) => {
              if (status === 'granted') {
                autoCaptureAttempted.current = true;
                void gps.captureGps();
              }
            });
          }}
          onOpenSettings={() => void openDeviceSettings()}
        />

        <VisitGpsServiceDisabledCard
          visible={gps.gpsServiceEnabled === false}
          onTurnOnGps={() => void openLocationSettings()}
        />

        {gps.capturing ? (
          <VisitGpsAlertBanner tone="warning" message="Capturing accurate GPS location..." />
        ) : null}

        {captureTimedOut && !gps.capturing ? (
          <VisitGpsAlertBanner
            tone="danger"
            message="Unable to capture location. Please move to an open area and try again."
          />
        ) : null}

        {isOutsideRadius ? (
          <VisitGpsAlertBanner
            tone="danger"
            message={`Out of Zone${gps.capture ? ` · ${gps.capture.latitude.toFixed(5)}, ${gps.capture.longitude.toFixed(5)}` : ''}`}
          />
        ) : null}

        <VisitGpsStatusCard
          permissionStatus={gps.permissionStatus}
          gpsServiceEnabled={gps.gpsServiceEnabled}
          capture={gps.capture}
          verification={gps.verification}
          allowedRadiusMeter={gps.context.allowedRadiusMeter}
          farmLatitude={gps.context.farmLatitude}
          farmLongitude={gps.context.farmLongitude}
        />

        <VisitGpsDistanceVerificationCard
          verification={gps.verification}
          allowedRadiusMeter={gps.context.allowedRadiusMeter}
          accuracyM={gps.capture?.accuracyM ?? null}
        />

        <VisitGpsPoorAccuracyBanner
          visible={isPoorAccuracy}
          onRetry={() => {
            autoCaptureAttempted.current = true;
            void gps.captureGps();
          }}
        />

        {isInsideRadius && !isPoorAccuracy ? <VisitGpsInsideRadiusCard /> : null}
        {isOutsideRadius ? (
          <VisitGpsOutsideRadiusCard
            verification={gps.verification}
            allowedRadiusMeter={gps.context.allowedRadiusMeter}
            accuracyM={gps.capture?.accuracyM ?? null}
            overrideReason={overrideReason}
            onOverrideReasonChange={setOverrideReason}
            onRefresh={() => {
              autoCaptureAttempted.current = true;
              void gps.captureGps();
            }}
            onRequestOverride={() => void handleOutsideRadiusRequest()}
            submitting={gps.submitting}
          />
        ) : null}

        <VisitGpsMapPreview
          capture={gps.capture}
          farmLatitude={gps.context.farmLatitude}
          farmLongitude={gps.context.farmLongitude}
        />

        <View style={styles.actions}>
          <AppButton
            label={gps.capturing ? 'Capturing…' : captureTimedOut || !gps.capture ? 'Retry' : 'Refresh Location'}
            variant="secondary"
            onPress={() => {
              autoCaptureAttempted.current = true;
              void gps.captureGps();
            }}
            disabled={gps.capturing || gps.permissionStatus === 'denied' || gps.gpsServiceEnabled === false}
          />
          <AppButton
            label={
              gps.submitting
                ? 'Verifying…'
                : needsFarmRegistration
                  ? 'Register Farm GPS & Check-in'
                  : 'Verify & Check-in'
            }
            onPress={() => void handleVerifyCheckIn()}
            loading={gps.submitting}
            disabled={!gps.canVerifyCheckIn || gps.submitting || (missingTargetCoordinates && !needsFarmRegistration)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  statusBadgeRow: { paddingHorizontal: 20, paddingBottom: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(173, 238, 195, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: officerTheme.primary,
    textTransform: 'capitalize',
  },
  container: { padding: 20, gap: 14, paddingBottom: 32, maxWidth: 390, width: '100%', alignSelf: 'center' },
  error: { color: officerTheme.error, fontSize: 13 },
  actions: { gap: 10, marginTop: 4 },
});
