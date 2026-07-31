import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { FarmerStackParamList, FarmerTabParamList } from '../navigation/types';

type FarmerStackRoute = keyof FarmerStackParamList;
type FarmerTabRoute = keyof FarmerTabParamList;

export function useNavigateToFarmerDashboard() {
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>();

  return useCallback(() => {
    const parent = navigation.getParent();

    if (parent) {
      parent.navigate('FarmerTabs', { screen: 'Home' });
      return;
    }

    navigation.navigate('FarmerTabs', { screen: 'Home' });
  }, [navigation]);
}

export function useNavigateToFarmerReports() {
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>();

  return useCallback(() => {
    const stackNavigation = (navigation.getParent() ?? navigation) as NavigationProp<FarmerStackParamList>;
    stackNavigation.navigate('FarmerBiocharUpdates');
  }, [navigation]);
}

type AnyNavigation = NavigationProp<Record<string, object | undefined>> & {
  getParent: () => AnyNavigation | undefined;
  getState: () => { routeNames?: string[] } | undefined;
};

function findNavigatorWithRoute(navigation: AnyNavigation, routeName: string): AnyNavigation | null {
  let current: AnyNavigation | undefined = navigation;

  while (current) {
    const routeNames = current.getState?.()?.routeNames ?? [];

    if (routeNames.includes(routeName)) {
      return current;
    }

    current = current.getParent?.();
  }

  return null;
}

/** Navigate to stack screens from farmer tab screens (Home, Activities, etc.). */
export function useFarmerStackNavigation() {
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>() as unknown as AnyNavigation & {
    getParent: (id?: string) => AnyNavigation | undefined;
  };

  return useCallback(
    (screen: FarmerStackRoute, params?: object) => {
      const namedStack = navigation.getParent?.('FarmerRootStack');
      const stackNavigation =
        namedStack ??
        findNavigatorWithRoute(navigation, screen) ??
        findNavigatorWithRoute(navigation, 'FarmerTabs') ??
        (navigation.getParent() as AnyNavigation | undefined) ??
        navigation;

      (stackNavigation.navigate as (name: string, args?: object) => void)(screen, params);
    },
    [navigation],
  );
}

export function useFarmerTabNavigation() {
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>() as unknown as AnyNavigation;

  return useCallback(
    <RouteName extends FarmerTabRoute>(screen: RouteName) => {
      const stackNavigation =
        findNavigatorWithRoute(navigation, 'FarmerTabs') ??
        (navigation.getParent() as AnyNavigation | undefined) ??
        navigation;

      (stackNavigation.navigate as (name: string, args?: object) => void)('FarmerTabs', { screen });
    },
    [navigation],
  );
}
