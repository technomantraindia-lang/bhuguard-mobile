import type { NavigationProp, ParamListBase } from '@react-navigation/native';

import type { RootStackParamList } from './types';
import { safeNavigationReset } from './safeNavigationReset';

type AuthBackNavigation = Pick<
  NavigationProp<ParamListBase>,
  'canGoBack' | 'goBack'
> & {
  reset?: (state: {
    index: number;
    routes: Array<{ name: keyof RootStackParamList; params?: object }>;
  }) => void;
  navigate?: (name: keyof RootStackParamList, params?: object) => void;
};

/**
 * Avoid React Navigation "GO_BACK was not handled" on single-route auth stacks
 * created by `navigation.reset`.
 */
export function safeAuthGoBack(
  navigation: AuthBackNavigation,
  fallback: keyof RootStackParamList = 'MobileLogin',
): void {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (typeof navigation.reset === 'function') {
    safeNavigationReset(navigation, {
      index: 0,
      routes: [{ name: fallback }],
    });
    return;
  }

  if (typeof navigation.navigate === 'function') {
    navigation.navigate(fallback);
  }
}
