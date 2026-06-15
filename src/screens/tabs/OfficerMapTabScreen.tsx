import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfficerFieldMapOverview } from '../../components/officer/OfficerFieldMapOverview';
import { useFieldOfficerDashboardData } from '../../hooks/useFieldOfficerDashboardData';
import { LoadingState } from '../../components/LoadingState';
import { officerTheme } from '../../theme/officerDashboardTheme';

export function OfficerMapTabScreen() {
  const { data, loading } = useFieldOfficerDashboardData();

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading field map..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <OfficerFieldMapOverview markers={data?.mapMarkers ?? []} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: officerTheme.marginMobile,
    paddingTop: 16,
  },
});

