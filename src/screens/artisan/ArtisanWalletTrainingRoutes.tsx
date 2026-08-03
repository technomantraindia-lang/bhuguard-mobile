import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { ArtisanStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ArtisanStackParamList>;

/**
 * Named Phase 14 routes that resolve to the controlled unavailable module screen.
 * Keeps ArtisanWallet / ArtisanTraining as unique registered names without duplicate UI.
 */
export function ArtisanWalletScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    navigation.replace('ArtisanModuleUnavailable', { module: 'wallet' });
  }, [navigation]);

  return null;
}

export function ArtisanTrainingScreen() {
  const navigation = useNavigation<Nav>();

  useEffect(() => {
    navigation.replace('ArtisanModuleUnavailable', { module: 'training' });
  }, [navigation]);

  return null;
}
