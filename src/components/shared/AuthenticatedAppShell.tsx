import { memo, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigationState, type NavigationState, type PartialState } from '@react-navigation/native';

import { FraudWarningMarquee } from './FraudWarningMarquee';
import { DeviceTimeWarningBanner } from './DeviceTimeWarningBanner';
import { AppUpdateModal } from '../updates/AppUpdateModal';
import { useAppUpdate } from '../../context/AppUpdateContext';

/** Routes where the fraud marquee would obstruct critical full-screen controls. */
export const FRAUD_MARQUEE_HIDDEN_ROUTES = new Set([
  'FullscreenImage',
  'OfficerFullscreenImage',
  'ArtisanLiveEvidenceCamera',
  'LiveEvidenceCamera',
  'FarmBoundaryCapture',
  'FarmBoundaryPreview',
  'FarmBoundaryManualDraw',
  'FarmBoundaryMap',
  'FarmBoundaryView',
  'FarmerFarmBoundaryView',
  'FarmBoundaryStart',
  'FarmBoundarySaveConfirm',
  'FarmBoundaryUploading',
  'OnboardingBoundaryCapture',
  'OnboardingBoundaryPreview',
  'OnboardingCameraBoundaryStart',
  'OnboardingCameraBoundaryLive',
  'OnboardingCameraBoundaryPoints',
  'OnboardingCameraBoundaryPreview',
  'OnboardingCameraBoundaryUploading',
  'CameraBoundaryStart',
  'CameraBoundaryLive',
  'CameraBoundaryPoints',
  'CameraBoundaryPreview',
  'CameraBoundaryUploading',
  'OfficerGpsVerificationMap',
  'FarmerFarmMapFull',
  'FarmerFarmMapFullScreen',
  'FieldOfficerNavigate',
  'BoundaryPhotoGallery',
]);

const UNSAFE_RELOAD_ROUTES = new Set([
  'FarmerOnboardingStart',
  'FarmerBasicDetails',
  'FarmerConsent',
  'FarmerAddress',
  'FarmerLandDetails',
  'FarmerGpsCapture',
  'FarmerProofUpload',
  'FarmerOnboardingReview',
  'FarmBoundaryStart',
  'FarmBoundaryCapture',
  'FarmBoundaryPreview',
  'FarmBoundarySaveConfirm',
  'FarmBoundaryUploading',
  'FarmVerificationActivity',
  'EvidenceVerification',
  'VisitEvidenceUpload',
  'ArtisanLiveEvidenceCamera',
  'LiveEvidenceCamera',
  'ArtisanBiocharProduction',
  'FieldOfficerBiocharMixing',
  'FieldOfficerBiocharApplication',
  'FarmerBiocharProduction',
  'FarmerBiocharMixing',
  'FarmerSubmitActivity',
  'StitchScreen',
]);

function getDeepestRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined,
): string | undefined {
  if (!state?.routes?.length) {
    return undefined;
  }

  let current: NavigationState | PartialState<NavigationState> | undefined = state;
  let name: string | undefined;

  while (current?.routes?.length) {
    const routes = current.routes;
    const routeIndex: number = typeof current.index === 'number' ? current.index : routes.length - 1;
    const route = routes[routeIndex] as
      | { name?: string; state?: NavigationState | PartialState<NavigationState> }
      | undefined;
    name = route?.name;
    current = route?.state;
  }

  return name;
}

type RoleAppLayoutProps = {
  children: ReactNode;
};

/**
 * Navigator `layout` wrapper — mounts the fraud marquee once per role app.
 * Nested navigators must not mount another copy.
 */
function RoleAppLayoutComponent({ children }: RoleAppLayoutProps) {
  const routeName = useNavigationState((state) => getDeepestRouteName(state));
  const { state, markAppReady, dismissUpdate, downloadUpdate, applyUpdateNow } = useAppUpdate();
  const [shouldOpenModal, setShouldOpenModal] = useState(false);
  const showMarquee = useMemo(
    () => !(routeName && FRAUD_MARQUEE_HIDDEN_ROUTES.has(routeName)),
    [routeName],
  );
  const unsafeToReload = Boolean(routeName && UNSAFE_RELOAD_ROUTES.has(routeName));

  useEffect(() => {
    markAppReady();
  }, [markAppReady]);

  useEffect(() => {
    if (state.status === 'available' || state.status === 'downloading' || state.status === 'downloaded') {
      setShouldOpenModal(true);
      return;
    }
    if (state.status === 'idle' || state.status === 'unavailable') {
      setShouldOpenModal(false);
    }
  }, [state.status]);

  useEffect(() => {
    if (state.status !== 'downloaded' || unsafeToReload) {
      return;
    }
    void applyUpdateNow();
  }, [applyUpdateNow, state.status, unsafeToReload]);

  return (
    <View style={styles.root}>
      <FraudWarningMarquee visible={showMarquee} />
      <DeviceTimeWarningBanner />
      <View style={styles.body}>{children}</View>
      <AppUpdateModal
        visible={shouldOpenModal}
        status={state.status}
        unsafeToReload={unsafeToReload}
        onLater={() => {
          void dismissUpdate();
        }}
        onUpdateNow={() => {
          void downloadUpdate();
        }}
        onRestartNow={() => {
          void applyUpdateNow();
        }}
      />
    </View>
  );
}

export const RoleAppLayout = memo(RoleAppLayoutComponent);

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});
