import { CommonActions, type NavigationProp, type ParamListBase } from '@react-navigation/native';

import {
  getNextIncompleteFarmerOnboardingStep,
  type FarmerOnboardingRoute,
} from '../constants/onboardingSteps';
import type { OnboardingDraft, OnboardingResult } from '../context/OnboardingContext';

export type OnboardingContinueParams = {
  farmerId?: number;
  farmId?: number;
  farmerName?: string;
  farmName?: string;
  farmCode?: string;
  farmerCode?: string;
  village?: string;
  mappingStatus?: 'pending' | 'completed';
  source?: 'farmer-onboarding';
};

/**
 * Home route for the active FO / Artisan Pro stack.
 * Hardcoding FieldOfficerTabs breaks Artisan Pro after mapping save.
 */
export function resolveOnboardingHomeRouteName(
  navigation: NavigationProp<ParamListBase>,
): 'FieldOfficerTabs' | 'ArtisanDashboard' {
  const names = navigation.getState()?.routeNames ?? [];

  if (names.includes('ArtisanDashboard')) {
    return 'ArtisanDashboard';
  }

  return 'FieldOfficerTabs';
}

/**
 * After mapping save or Skip for Now, advance to the next incomplete onboarding
 * step without treating mapping as final submission.
 */
export function continueFarmerOnboardingAfterLandMapping(
  navigation: NavigationProp<ParamListBase>,
  draft: OnboardingDraft,
  result: OnboardingResult | null,
  params: OnboardingContinueParams = {},
): void {
  const nextStep = getNextIncompleteFarmerOnboardingStep(draft, result);
  const route: FarmerOnboardingRoute = nextStep?.route ?? 'FarmerProofUpload';
  const home = resolveOnboardingHomeRouteName(navigation);
  const screenParams = {
    ...params,
    source: 'farmer-onboarding' as const,
  };

  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [
        home === 'ArtisanDashboard'
          ? { name: 'ArtisanDashboard' }
          : {
              name: 'FieldOfficerTabs',
              state: {
                index: 0,
                routes: [{ name: 'Home' }],
              },
            },
        {
          name: route,
          params: screenParams,
        },
      ],
    }),
  );
}

export function resetToOnboardingHome(navigation: NavigationProp<ParamListBase>): void {
  const home = resolveOnboardingHomeRouteName(navigation);

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        home === 'ArtisanDashboard'
          ? { name: 'ArtisanDashboard' }
          : {
              name: 'FieldOfficerTabs',
              state: {
                index: 0,
                routes: [{ name: 'Home' }],
              },
            },
      ],
    }),
  );
}
