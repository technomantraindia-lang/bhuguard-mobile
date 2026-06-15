import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import type { FarmerStackParamList } from '../navigation/types';

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
    const parent = navigation.getParent();

    if (parent) {
      parent.navigate('FarmerTabs', { screen: 'Reports' });
      return;
    }

    navigation.navigate('FarmerTabs', { screen: 'Reports' });
  }, [navigation]);
}
