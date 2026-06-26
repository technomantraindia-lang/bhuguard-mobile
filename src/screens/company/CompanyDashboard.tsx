import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import type { CompositeNavigationProp } from '@react-navigation/native';

import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { CompanyGlobalImpactCard } from '../../components/company/CompanyGlobalImpactCard';

import { CompanyOperationalOverview } from '../../components/company/CompanyOperationalOverview';

import { CompanyPendingApprovals } from '../../components/company/CompanyPendingApprovals';

import { CompanyQuickAccessSection } from '../../components/company/CompanyQuickAccessSection';

import { CompanyQuickStatsGrid } from '../../components/company/CompanyQuickStatsGrid';

import { CompanyTaskTracking } from '../../components/company/CompanyTaskTracking';

import { CompanyTopAppBar } from '../../components/company/CompanyTopAppBar';

import { ErrorState } from '../../components/ErrorState';

import { LoadingState } from '../../components/LoadingState';

import type { CompanyPendingApproval } from '../../hooks/useCompanyDashboardData';

import { useCompanyDashboardData } from '../../hooks/useCompanyDashboardData';

import type { CompanyStackParamList, CompanyTabParamList } from '../../navigation/types';

import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<CompanyTabParamList, 'Home'>,
  NativeStackNavigationProp<CompanyStackParamList>
>;

export function CompanyDashboard() {
  const navigation = useNavigation<Nav>();

  const { data, loading, error, reload } = useCompanyDashboardData();

  const handleReview = (item: CompanyPendingApproval) => {
    if (item.targetRoute === 'submission' && item.targetId) {
      navigation.navigate('CompanyServiceSubmissionDetail', { id: item.targetId });
      return;
    }

    navigation.navigate('StitchScreen', { screenKey: 'company_verification_status' });
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading company dashboard..." />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const dashboard = data!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <CompanyTopAppBar
        onMenuPress={() => navigation.navigate('StitchScreen', { screenKey: 'company_dmrv_hub' })}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />
        }
      >
        <CompanyGlobalImpactCard
          totalCarbonCredits={dashboard.totalCarbonCredits}
          activeProjects={dashboard.activeProjects}
          onDetailsPress={() => navigation.navigate('CompanyCarbonCalculations')}
        />

        <CompanyQuickStatsGrid
          sitesCount={dashboard.sitesCount}
          activeSubmissions={dashboard.activeProjects}
          wasteRecordsCount={dashboard.wasteRecordsCount}
          biocharRecordsCount={dashboard.biocharRecordsCount}
          industrialCarbonRecordsCount={dashboard.industrialCarbonRecordsCount}
          evidenceUploadsCount={dashboard.evidenceUploadsCount}
          pendingVerificationCount={dashboard.pendingVerificationCount}
          finalReportsCount={dashboard.finalReportsCount}
          onSitesPress={() => navigation.navigate('CompanySites')}
          onSubmissionsPress={() => navigation.navigate('CompanyServiceSubmissions')}
          onWastePress={() => navigation.navigate('CompanyWasteRecords')}
          onBiocharPress={() => navigation.navigate('CompanyBiocharRecords')}
          onIndustrialPress={() => navigation.navigate('CompanyIndustrialCarbonRecords')}
          onEvidencePress={() => navigation.navigate('CompanyEvidenceList')}
          onVerificationPress={() =>
            navigation.navigate('StitchScreen', { screenKey: 'company_verification_status' })
          }
          onReportsPress={() => navigation.navigate('CompanyFinalReports')}
        />

        <CompanyOperationalOverview stats={dashboard.operationalStats} />

        {dashboard.recentSubmissions.length > 0 ? (
          <View style={styles.recentWrap}>
            <Text style={styles.recentTitle}>Recent Submissions</Text>
            {dashboard.recentSubmissions.map((item) => (
              <View key={item.id} style={styles.recentCard}>
                <Text style={styles.recentItemTitle}>{item.title}</Text>
                <Text style={styles.recentItemSubtitle}>
                  {item.subtitle !== '-' ? item.subtitle : 'Company site'} • {item.status}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <CompanyPendingApprovals
          items={dashboard.pendingApprovals}
          onViewAll={() => navigation.navigate('Activities')}
          onReview={handleReview}
        />

        <CompanyTaskTracking
          progressPercent={dashboard.taskProgressPercent}
          completedCount={dashboard.tasksCompleted}
          totalCount={dashboard.tasksTotal}
        />

        <CompanyQuickAccessSection
          onSites={() => navigation.navigate('CompanySites')}
          onServiceSubmissions={() => navigation.navigate('CompanyServiceSubmissions')}
          onWasteRecords={() => navigation.navigate('CompanyWasteRecords')}
          onBiocharRecords={() => navigation.navigate('CompanyBiocharRecords')}
          onIndustrialCarbon={() => navigation.navigate('CompanyIndustrialCarbonRecords')}
          onEvidenceUpload={() => navigation.navigate('CompanyEvidenceUpload')}
          onReports={() => navigation.navigate('CompanyFinalReports')}
          onProfile={() => navigation.navigate('Profile')}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 20,
  },
  recentWrap: { gap: 8 },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  recentCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 12,
    gap: 4,
  },
  recentItemTitle: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurface },
  recentItemSubtitle: { fontSize: 12, color: dashboardTheme.onSurfaceVariant },
  bottomSpacer: {
    height: 8,
  },
});
