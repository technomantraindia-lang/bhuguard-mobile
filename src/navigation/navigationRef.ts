import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToLogin(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'MobileLogin' }],
    });
  }
}

export function navigateToApiServerSettings(): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ApiServerSettings');
  }
}

export function navigateToApiHealthCheck(): void {
  if (__DEV__ && navigationRef.isReady()) {
    navigationRef.navigate('ApiHealthCheck');
  }
}
