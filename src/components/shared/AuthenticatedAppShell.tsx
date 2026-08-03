import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigationState, type NavigationState, type PartialState } from '@react-navigation/native';

import { FraudWarningMarquee } from './FraudWarningMarquee';
import { DeviceTimeWarningBanner } from './DeviceTimeWarningBanner';

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
  const showMarquee = useMemo(
    () => !(routeName && FRAUD_MARQUEE_HIDDEN_ROUTES.has(routeName)),
    [routeName],
  );

  return (
    <View style={styles.root}>
      <FraudWarningMarquee visible={showMarquee} />
      <DeviceTimeWarningBanner />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export const RoleAppLayout = memo(RoleAppLayoutComponent);

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1 },
});
