import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../../components/AppButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FarmerStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Props = NativeStackScreenProps<FarmerStackParamList, 'FarmerEditFarm'>;

export function FarmerEditFarmScreen({ navigation, route }: Props) {
  const { farmId } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="Edit Farm" subtitle="Update farm location and land details" />
        <View style={styles.card}>
          <Text style={styles.copy}>
            Update GPS boundary, survey number, crop and irrigation details for this registered farm.
          </Text>
        </View>
        <AppButton label="Update GPS & Boundary" onPress={() => navigation.navigate('FarmerFarmGps', { farmId })} />
        <AppButton
          label="Back to Farm Details"
          variant="secondary"
          onPress={() => navigation.navigate('FarmerFarmDetail', { farmId })}
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
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
  },
  copy: {
    fontSize: 14,
    lineHeight: 22,
    color: dashboardTheme.onSurfaceVariant,
  },
});
