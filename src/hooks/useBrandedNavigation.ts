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

/** Navigate to stack screens from farmer tab screens (Home, Activities, etc.). */
export function useFarmerStackNavigation() {
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>();

  return useCallback(
    (screen: FarmerStackRoute, params?: object) => {
      const stackNavigation = (navigation.getParent() ?? navigation) as NavigationProp<FarmerStackParamList>;
      (stackNavigation.navigate as (name: string, args?: object) => void)(screen, params);
    },
    [navigation],
  );
}

export function useFarmerTabNavigation() {
  const navigation = useNavigation<NavigationProp<FarmerStackParamList>>();

  return useCallback(
    <RouteName extends FarmerTabRoute>(screen: RouteName) => {
      const stackNavigation = (navigation.getParent() ?? navigation) as NavigationProp<FarmerStackParamList>;
      stackNavigation.navigate('FarmerTabs', { screen });
    },
    [navigation],
  );
}
