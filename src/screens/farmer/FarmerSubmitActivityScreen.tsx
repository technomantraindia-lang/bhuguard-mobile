import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { LoadingState } from '../../components/LoadingState';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerSubmitActivity'>;

/** Legacy entry alias — all Farmer Farm Activity actions open the canonical Farm Activity module. */
export function FarmerSubmitActivityScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const farmId = route.params?.farmId;

  useEffect(() => {
    navigation.replace('FarmerFarmActivity', farmId ? { farmId } : {});
  }, [farmId, navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <LoadingState message={t('farmer.activity.loading')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
