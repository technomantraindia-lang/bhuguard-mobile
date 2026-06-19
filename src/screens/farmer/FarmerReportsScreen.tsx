import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerAvailableReportCard } from '../../components/farmer/FarmerAvailableReportCard';
import { FarmerBenefitsSummaryCard } from '../../components/farmer/FarmerBenefitsSummaryCard';
import { FarmerCarbonProgressCard } from '../../components/farmer/FarmerCarbonProgressCard';
import { FarmerReportHistorySection } from '../../components/farmer/FarmerReportHistorySection';
import { FarmerReportsHeader } from '../../components/farmer/FarmerReportsHeader';
import { useFarmerReportsData } from '../../hooks/useFarmerReportsData';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import type { FarmerReportItem } from '../../utils/farmerReportHelpers';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Reports'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

export function FarmerReportsScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, history, summary, loading, error, reload } = useFarmerReportsData();

  const handleViewReport = (report: FarmerReportItem) => {
    switch (report.catalogId) {
      case 'baseline':
        navigation.navigate('FarmerBaselineAssessments');
        return;
      case 'monitoring':
        if (report.sourceId > 0) {
          navigation.navigate('FarmerCarbonCalculationDetail', { id: report.sourceId });
          return;
        }
        navigation.navigate('FarmerCarbonCalculations');
        return;
      case 'verification':
        navigation.navigate('FarmerVerificationStatus');
        return;
      default:
        if (report.sourceType === 'final_report' && report.sourceId > 0) {
          navigation.navigate('FarmerFinalReportDetail', { id: report.sourceId });
          return;
        }
        navigation.navigate('FarmerFinalReports');
    }
  };

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading reports..." />
      </SafeAreaView>
    );
  }

  if (error && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const reportSummary = summary!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerReportsHeader
        onBack={() => navigation.navigate('Home')}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />
        }
      >
        <Text style={styles.pageTitle}>Reports</Text>
        <Text style={styles.subtitle}>View your key farm verification reports.</Text>

        <FarmerCarbonProgressCard
          summary={reportSummary}
          onViewSummary={() => navigation.navigate('FarmerCarbonCalculations')}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
        </View>

        <View style={styles.reportList}>
          {reports.map((report) => (
            <FarmerAvailableReportCard
              key={report.id}
              report={report}
              onView={() => handleViewReport(report)}
            />
          ))}
        </View>

        <FarmerReportHistorySection items={history} />

        <FarmerBenefitsSummaryCard
          summary={reportSummary}
          onViewDetails={() => navigation.navigate('FarmerCarbonCalculations')}
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
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingBottom: 120,
    gap: 16,
  },
  pageTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: dashboardTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: dashboardTheme.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  reportList: {
    gap: 12,
  },
});
