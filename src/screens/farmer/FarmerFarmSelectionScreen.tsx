import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useFarmerFarmActivityForm } from '../../hooks/useFarmerFarmActivityForm';
import { useTranslation } from '../../i18n/I18nContext';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmSelection'>;

export function FarmerFarmSelectionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const form = useFarmerFarmActivityForm();

  useEffect(() => {
    if (form.loading) {
      return;
    }
    if (form.farms.length === 0) {
      return;
    }

    const farmId = form.farms.length === 1 ? form.farms[0]?.farmId : undefined;
    navigation.replace('FarmerFarmActivity', farmId ? { farmId } : {});
  }, [form.farms, form.loading, navigation]);

  if (form.loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <LoadingState message={t('farmer.farmSelection.loading')} />
      </SafeAreaView>
    );
  }

  if (form.farms.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScreenHeader
          title={t('farmer.farmSelection.title')}
          subtitle={t('farmer.farmSelection.subtitle')}
          showBack
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.emptyWrap}>
          <EmptyState
            title={t('farmer.farmSelection.emptyTitle')}
            message={t('farmer.activity.noRegisteredFarm')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <LoadingState message={t('farmer.activity.loading')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: 24 },
});
