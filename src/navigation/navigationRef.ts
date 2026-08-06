import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { InteractionManager } from 'react-native';

import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Auth-flow screens where a 401 must not wipe the stack back to MobileLogin. */
const AUTH_FLOW_ROUTES = new Set<keyof RootStackParamList | string>([
  'LanguageSelection',
  'MobileLogin',
  'OtpVerification',
  'CreateMpin',
  'SetPattern',
  'PatternLogin',
  'BiometricSetup',
  'MpinLogin',
  'ResetPassword',
  'FarmerOtpLogin',
  'PasswordLogin',
  'FarmerLoginOptions',
  'FieldOfficerLogin',
  'ArtisanLogin',
  'ArtisanProLogin',
]);

/**
 * Returns false when the user is already on an unauthenticated / pre-session
 * auth screen. Stale-token /auth/me races must not force a login reset there.
 */
export function shouldForceLoginOnUnauthorized(): boolean {
  if (!navigationRef.isReady()) {
    return false;
  }

  const routeName = navigationRef.getCurrentRoute()?.name;
  if (!routeName) {
    return false;
  }

  return !AUTH_FLOW_ROUTES.has(routeName);
}

export function navigateToLogin(): void {
  if (!navigationRef.isReady()) {
    return;
  }

  if (navigationRef.getCurrentRoute()?.name === 'MobileLogin') {
    return;
  }

  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(() => {
      try {
        navigationRef.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MobileLogin' }],
          }),
        );
      } catch (error) {
        if (__DEV__) {
          console.warn('[Bhuguard] navigateToLogin failed:', error);
        }

        try {
          navigationRef.navigate('MobileLogin');
        } catch (fallbackError) {
          if (__DEV__) {
            console.warn('[Bhuguard] navigateToLogin fallback failed:', fallbackError);
          }
        }
      }
    });
  });
}

export function navigateToApiHealthCheck(): void {
  if (__DEV__ && navigationRef.isReady()) {
    navigationRef.navigate('ApiHealthCheck');
  }
}
