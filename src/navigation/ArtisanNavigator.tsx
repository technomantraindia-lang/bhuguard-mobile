import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import type { ComponentType, ReactElement } from 'react';

import { ArtisanWorkSessionProvider } from '../context/ArtisanWorkSessionContext';
import { BoundaryCaptureProvider } from '../context/BoundaryCaptureContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import type { ArtisanStackParamList } from './types';
import { RoleAppLayout } from '../components/shared/AuthenticatedAppShell';

const Stack = createNativeStackNavigator<ArtisanStackParamList>();

function ScreenLoadError({ name }: { name: string }): ReactElement {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>Screen unavailable</Text>
      <Text style={{ textAlign: 'center', color: '#555' }}>
        {name} could not load on this app build. Restart the app. If this continues, rebuild the
        development client.
      </Text>
    </View>
  );
}

function safeScreen(
  exportName: string,
  requireFactory: () => Record<string, unknown>,
): ComponentType {
  try {
    const mod = requireFactory();
    const component = mod?.[exportName];
    if (typeof component === 'function') {
      return component as ComponentType;
    }
    throw new Error(`${exportName} export missing`);
  } catch (error) {
    console.error(`[Bhuguard] Failed to load screen ${exportName}`, error);
    return function FailedScreen() {
      return <ScreenLoadError name={exportName} />;
    };
  }
}

/**
 * Lazy-load artisan screens with per-screen error isolation so one missing
 * native module cannot crash the whole Artisan app shell.
 * FO onboarding / farm activity screens are reused (not duplicated).
 */
export function ArtisanNavigator() {
  return (
    <ArtisanWorkSessionProvider>
      <OnboardingProvider>
        <BoundaryCaptureProvider>
          <Stack.Navigator layout={({ children }) => <RoleAppLayout>{children}</RoleAppLayout>} screenOptions={{ headerShown: false }} initialRouteName="ArtisanDashboard">
            <Stack.Screen
              name="ArtisanDashboard"
              getComponent={() =>
                safeScreen('ArtisanDashboardScreen', () =>
                  require('../screens/artisan/ArtisanDashboardScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanNotifications"
              getComponent={() =>
                safeScreen('ArtisanNotificationsScreen', () =>
                  require('../screens/artisan/ArtisanNotificationsScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanFarmLookup"
              getComponent={() =>
                safeScreen('ArtisanFarmLookupScreen', () =>
                  require('../screens/artisan/ArtisanFarmLookupScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanBiocharProduction"
              getComponent={() =>
                safeScreen('ArtisanBiocharProductionScreen', () =>
                  require('../screens/artisan/ArtisanBiocharProductionScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanBiocharProductionStatus"
              getComponent={() =>
                safeScreen('ArtisanBiocharProductionStatusScreen', () =>
                  require('../screens/artisan/ArtisanBiocharProductionStatusScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanBiocharMixing"
              getComponent={() =>
                safeScreen('ArtisanBiocharMixingScreen', () =>
                  require('../screens/artisan/ArtisanBiocharMixingScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanBiocharApplication"
              getComponent={() =>
                safeScreen('ArtisanBiocharApplicationScreen', () =>
                  require('../screens/artisan/ArtisanBiocharApplicationScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanProductionRecords"
              getComponent={() =>
                safeScreen('ArtisanProductionRecordsScreen', () =>
                  require('../screens/artisan/ArtisanProductionRecordsScreen'),
                )
              }
            />
            <Stack.Screen
              name="FullscreenImage"
              getComponent={() =>
                safeScreen('FullscreenImageScreen', () =>
                  require('../screens/shared/FullscreenImageScreen'),
                )
              }
            />
            <Stack.Screen
              name="ArtisanProfile"
              getComponent={() =>
                safeScreen('ArtisanProfileScreen', () => require('../screens/artisan/ArtisanProfileScreen'))
              }
            />
            <Stack.Screen
              name="ArtisanSettings"
              getComponent={() =>
                safeScreen('ArtisanSettingsScreen', () =>
                  require('../screens/artisan/ArtisanSettingsScreen'),
                )
              }
            />

            {/* Reused Field Officer onboarding + farm activity screens */}
            <Stack.Screen
              name="FarmerOnboardingStart"
              getComponent={() =>
                safeScreen('FarmerOnboardingStartScreen', () =>
                  require('../screens/officer/onboarding/FarmerOnboardingStartScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerBasicDetails"
              getComponent={() =>
                safeScreen('FarmerBasicDetailsScreen', () =>
                  require('../screens/officer/onboarding/FarmerBasicDetailsScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerConsent"
              getComponent={() =>
                safeScreen('FarmerConsentScreen', () =>
                  require('../screens/officer/onboarding/FarmerConsentScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerAddress"
              getComponent={() =>
                safeScreen('FarmerAddressScreen', () =>
                  require('../screens/officer/onboarding/FarmerAddressScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerLandDetails"
              getComponent={() =>
                safeScreen('FarmerLandDetailsScreen', () =>
                  require('../screens/officer/onboarding/FarmerLandDetailsScreen'),
                )
              }
            />
            <Stack.Screen
              name="OnboardingBoundaryStart"
              getComponent={() =>
                safeScreen('OnboardingBoundaryStartScreen', () =>
                  require('../screens/officer/onboarding/OnboardingBoundaryStartScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmBoundaryMap"
              getComponent={() =>
                require('../screens/officer/onboarding/OnboardingBoundaryCaptureScreen').default
              }
            />
            <Stack.Screen
              name="OnboardingBoundaryCapture"
              getComponent={() =>
                require('../screens/officer/onboarding/OnboardingBoundaryCaptureScreen').default
              }
            />
            <Stack.Screen
              name="OnboardingBoundaryPreview"
              getComponent={() =>
                require('../screens/officer/onboarding/OnboardingBoundaryPreviewScreen').default
              }
            />
            <Stack.Screen
              name="OnboardingCameraBoundaryStart"
              getComponent={() =>
                safeScreen('CameraBoundaryStartScreen', () =>
                  require('../screens/farmer/boundary/camera/CameraBoundaryStartScreen'),
                )
              }
            />
            <Stack.Screen
              name="OnboardingCameraBoundaryLive"
              getComponent={() =>
                safeScreen('CameraBoundaryLiveScreen', () =>
                  require('../screens/farmer/boundary/camera/CameraBoundaryLiveScreen'),
                )
              }
            />
            <Stack.Screen
              name="OnboardingCameraBoundaryPoints"
              getComponent={() =>
                safeScreen('CameraBoundaryPointsScreen', () =>
                  require('../screens/farmer/boundary/camera/CameraBoundaryPointsScreen'),
                )
              }
            />
            <Stack.Screen
              name="OnboardingCameraBoundaryPreview"
              getComponent={() =>
                require('../screens/officer/onboarding/OnboardingBoundaryPreviewScreen').default
              }
            />
            <Stack.Screen
              name="FarmerGpsCapture"
              getComponent={() =>
                safeScreen('FarmerGpsCaptureScreen', () =>
                  require('../screens/officer/onboarding/FarmerGpsCaptureScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerProofUpload"
              getComponent={() =>
                safeScreen('FarmerProofUploadScreen', () =>
                  require('../screens/officer/onboarding/FarmerProofUploadScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerOnboardingReview"
              getComponent={() =>
                safeScreen('FarmerOnboardingReviewScreen', () =>
                  require('../screens/officer/onboarding/FarmerOnboardingReviewScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmerOnboardingSuccess"
              getComponent={() =>
                safeScreen('FarmerOnboardingSuccessScreen', () =>
                  require('../screens/officer/onboarding/FarmerOnboardingSuccessScreen'),
                )
              }
            />
            <Stack.Screen
              name="OnboardedFarmerView"
              getComponent={() =>
                safeScreen('OnboardedFarmerViewScreen', () =>
                  require('../screens/officer/onboarding/OnboardedFarmerViewScreen'),
                )
              }
            />
            <Stack.Screen
              name="BiocharAwareness"
              getComponent={() =>
                safeScreen('BiocharAwarenessScreen', () =>
                  require('../screens/officer/onboarding/BiocharAwarenessScreen'),
                )
              }
            />
            <Stack.Screen
              name="FieldOfficerFarmActivityStart"
              getComponent={() =>
                safeScreen('FieldOfficerFarmActivityStartScreen', () =>
                  require('../screens/officer/FieldOfficerFarmActivityStartScreen'),
                )
              }
            />
            <Stack.Screen
              name="FarmVerificationActivity"
              getComponent={() =>
                safeScreen('FarmVerificationActivityScreen', () =>
                  require('../screens/officer/FarmVerificationActivityScreen'),
                )
              }
            />
          </Stack.Navigator>
        </BoundaryCaptureProvider>
      </OnboardingProvider>
    </ArtisanWorkSessionProvider>
  );
}
