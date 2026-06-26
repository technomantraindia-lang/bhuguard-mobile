import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { OfficerFieldMapOverview } from '../../components/officer/OfficerFieldMapOverview';
import { useFieldOfficerDashboardData } from '../../hooks/useFieldOfficerDashboardData';
import { LoadingState } from '../../components/LoadingState';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Map'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

export function OfficerMapTabScreen() {
  const navigation = useNavigation<Nav>();
  const { data, loading } = useFieldOfficerDashboardData();

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading visit GPS locations..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <OfficerFieldMapOverview
          markers={data?.mapMarkers ?? []}
          onMarkerPress={(marker) => {
            if (marker.assignmentId) {
              navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId: marker.assignmentId });
            }
          }}
        />
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
