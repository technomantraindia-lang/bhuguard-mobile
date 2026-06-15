import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DashboardCard } from '../../components/DashboardCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { CompanyStackParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

export function CompanyActivitiesTabScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenHeader title="Activities" subtitle="Submissions, records and verification" />
        <DashboardCard
          title="Service Submissions"
          subtitle="Review and manage submitted services"
          onPress={() => navigation.navigate('CompanyServiceSubmissions')}
        />
        <DashboardCard
          title="Waste Records"
          subtitle="Waste management data"
          onPress={() => navigation.navigate('CompanyWasteRecords')}
        />
        <DashboardCard
          title="Industrial Carbon"
          subtitle="Emission records"
          onPress={() => navigation.navigate('CompanyIndustrialCarbonRecords')}
        />
        <DashboardCard
          title="Biochar Records"
          subtitle="Biochar production"
          onPress={() => navigation.navigate('CompanyBiocharRecords')}
        />
        <DashboardCard
          title="Verification Status"
          subtitle="Site verification progress"
          onPress={() => navigation.navigate('StitchScreen', { screenKey: 'company_verification_status' })}
        />
        <DashboardCard
          title="Final Reports"
          subtitle="Issued carbon reports"
          onPress={() => navigation.navigate('CompanyFinalReports')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  container: { padding: dashboardTheme.marginMobile, gap: 12, paddingBottom: 32 },
});
