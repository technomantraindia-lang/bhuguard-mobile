import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmDetailHeader } from '../../components/farmer/farms/detail/FarmDetailHeader';
import { FarmSatelliteMapSection } from '../../components/farmer/farms/detail/FarmSatelliteMapSection';
import { useFarmDetailData } from '../../hooks/useFarmDetailData';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerFarmMapFullScreen'>;

export function FarmerFarmMapFullScreen({ navigation, route }: Props) {
  const { farmId } = route.params;
  const { detail, farmRecord, loading, error, reload } = useFarmDetailData(farmId);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <LoadingState message="Loading farm map..." />
      </SafeAreaView>
    );
  }

  if (error || !detail || !farmRecord) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ErrorState message={error ?? 'Farm map unavailable.'} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FarmDetailHeader
        farmName={detail.farmName}
        onBack={() => navigation.goBack()}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onEditPress={() => navigation.navigate('FarmerEditFarm', { farmId })}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <FarmSatelliteMapSection
          farmRecord={farmRecord}
          areaLabel={detail.areaLabel}
          center={detail.centerCoordinates}
          polygonCoordinatesLabel={detail.polygonCoordinatesLabel}
          onOpenFullScreen={() => navigation.goBack()}
          onRefresh={() => void reload()}
          mapHeight={520}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  content: {
    padding: dashboardTheme.marginMobile,
    minHeight: Dimensions.get('window').height * 0.72,
    paddingBottom: 32,
  },
});
