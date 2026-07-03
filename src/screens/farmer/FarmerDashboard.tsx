import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerActivitiesFab } from '../../components/farmer/activities/FarmerActivitiesFab';
import { FarmerBiocharDashboardStats } from '../../components/farmer/FarmerBiocharDashboardStats';
import { FarmerDashboardHeader } from '../../components/farmer/FarmerDashboardHeader';
import { FarmerHeroSummaryCard } from '../../components/farmer/FarmerHeroSummaryCard';
import { FarmerQuickAccessSection } from '../../components/farmer/FarmerQuickAccessSection';
import { FarmerRecentActivitiesSection } from '../../components/farmer/FarmerRecentActivitiesSection';
import { useFarmerStackNavigation, useFarmerTabNavigation } from '../../hooks/useBrandedNavigation';
import { useFarmerDashboardData } from '../../hooks/useFarmerDashboardData';
import { useFocusSilentRefresh } from '../../hooks/useFocusSilentRefresh';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

export function FarmerDashboard() {
  const navigateStack = useFarmerStackNavigation();
  const navigateTab = useFarmerTabNavigation();
  const { data, loading, refreshing, error, reload, refresh } = useFarmerDashboardData();
  const scrollBottomPadding = useScrollBottomPadding(24);

  useFocusSilentRefresh(refresh, Boolean(data));

  const openProfile = () => navigateTab('Profile');
  const openNotifications = () => navigateStack('FarmerNotifications');
  const openFarms = () => navigateTab('Farms');
  const openActivities = () => navigateTab('Activities');
  const openAddBiochar = () => navigateStack('FarmerBiocharProduction', {});
  const openAddressDetails = () => navigateStack('FarmerAddressDetails');
  const openChatSupport = () => navigateStack('ChatbotSupport', { supportRole: 'farmer', sourceModule: 'farmer_dashboard' });
  const openSupport = () => navigateStack('SupportThreads', { supportRole: 'farmer' });
  const openServices = () => navigateStack('FarmerServices');
  const openBiocharUpdates = () => navigateStack('FarmerBiocharActivities');
  const openEvidence = () => navigateStack('FarmerEvidenceList');
  const openUploadEvidence = () => navigateStack('FarmerUploadEvidence');
  const openWallet = () => navigateStack('FarmerWallet');
  const openActivityDetail = (activityId: number) => navigateStack('FarmerActivityDetail', { activityId });

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading your dashboard..." />
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
      <FarmerDashboardHeader
        firstName={dashboard.firstName}
        fullName={dashboard.fullName}
        photoUrl={dashboard.photoUrl}
        onNotificationsPress={openNotifications}
        onProfilePress={openProfile}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={dashboardTheme.primary} />
        }
      >
        <FarmerHeroSummaryCard
          farmerCode={dashboard.farmerCode}
          fullName={dashboard.fullName}
          mobile={dashboard.mobile}
          location={dashboard.location}
          projectName="Biochar"
          landInfo={dashboard.landInfo}
          isVerified={dashboard.isVerified}
          totalFarms={dashboard.totalFarmsCount}
          mappedFarms={dashboard.mappedFarmsCount}
          activitiesCount={dashboard.activitiesSubmittedCount}
          verificationStatusLabel={dashboard.biocharServiceStatusLabel}
          onProfilePress={openProfile}
          onLocationPress={openAddressDetails}
          onProjectPress={openServices}
          onTotalLandPress={openFarms}
        />

        <FarmerBiocharDashboardStats
          serviceStatusLabel={dashboard.biocharServiceStatusLabel}
          daysRemainingLabel={dashboard.biocharDaysRemainingLabel}
          cycleStatusLabel={dashboard.biocharCycleStatusLabel}
          cycleTone={dashboard.biocharCycleTone}
          walletAmountLabel={dashboard.walletAmountLabel}
          evidenceCount={dashboard.evidenceUploadedCount}
          onServicePress={openServices}
          onUpdatesPress={openBiocharUpdates}
          onWalletPress={openWallet}
          onEvidencePress={openEvidence}
        />

        <FarmerQuickAccessSection
          onServices={openServices}
          onBiocharUpdates={openBiocharUpdates}
          onEvidenceUpload={openUploadEvidence}
          onWallet={openWallet}
          onProfile={openProfile}
          onSupport={openChatSupport}
          onViewFarms={openFarms}
          onSubmitActivity={openAddBiochar}
        />

        <FarmerRecentActivitiesSection
          activities={dashboard.recentActivities}
          onActivityPress={openActivityDetail}
          onViewAllPress={openActivities}
        />

        <View style={[styles.bottomSpacer, { height: scrollBottomPadding }]} />
      </ScrollView>

      <FarmerActivitiesFab onPress={openAddBiochar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  scroll: { flex: 1 },
  container: {
    paddingHorizontal: dashboardTheme.marginMobile,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 24,
  },
  bottomSpacer: { height: 24 },
});
