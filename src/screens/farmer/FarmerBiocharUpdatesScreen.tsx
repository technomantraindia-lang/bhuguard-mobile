import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { FarmerStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FarmerStackParamList, 'FarmerBiocharUpdates'>;

/** Legacy route kept for backward compatibility — opens the Biochar Activity flow. */
export function FarmerBiocharUpdatesScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    navigation.replace('FarmerBiocharActivities');
  }, [navigation]);

  return null;
}
