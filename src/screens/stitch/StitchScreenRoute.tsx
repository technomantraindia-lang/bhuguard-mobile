import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { StitchScreenView } from './StitchScreenView';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';

export type StitchRouteParams = {
  StitchScreen: { screenKey: string; itemId?: number };
};

type Props = NativeStackScreenProps<StitchRouteParams, 'StitchScreen'>;

type FarmerNav = CompositeNavigationProp<
  NativeStackNavigationProp<FarmerStackParamList>,
  BottomTabNavigationProp<FarmerTabParamList>
>;

export function StitchScreenRoute({ route, navigation }: Props) {
  const farmerNavigation = navigation as unknown as FarmerNav;
  const { screenKey, itemId } = route.params;

  useEffect(() => {
    if (screenKey === 'add_activity_log') {
      farmerNavigation.replace('FarmerSubmitActivity', itemId ? { farmId: itemId } : undefined);
    }

    if (screenKey === 'add_new_plot') {
      farmerNavigation.replace('FarmerAddFarm');
    }
  }, [farmerNavigation, itemId, screenKey]);

  if (screenKey === 'add_activity_log' || screenKey === 'add_new_plot') {
    return null;
  }

  return (
    <StitchScreenView screenKey={screenKey} itemId={itemId} stitchRouteName="StitchScreen" />
  );
}
