import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerBiocharDashboardStats } from '../../components/farmer/FarmerBiocharDashboardStats';
import { FarmerDashboardHeader } from '../../components/farmer/FarmerDashboardHeader';
import { FarmerHeroSummaryCard } from '../../components/farmer/FarmerHeroSummaryCard';
import { FarmerQuickAccessSection } from '../../components/farmer/FarmerQuickAccessSection';
import { FarmerRecentActivitiesSection } from '../../components/farmer/FarmerRecentActivitiesSection';
import { useFarmerStackNavigation, useFarmerTabNavigation } from '../../hooks/useBrandedNavigation';
import { useFarmerDashboardData } from '../../hooks/useFarmerDashboardData';
import { useFocusSilentRefresh } from '../../hooks/useFocusSilentRefresh';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import { useTranslation } from '../../i18n/I18nContext';
import { RoleEnvironmentalBackground } from '../../components/shared/RoleEnvironmentalBackground';
import { farmerTheme } from '../../theme/farmerTheme';

export function FarmerDashboard() {
  const { t } = useTranslation();
  const navigateStack = useFarmerStackNavigation();
  const navigateTab = useFarmerTabNavigation();
  const { data, loading, refreshing, error, reload, refresh } = useFarmerDashboardData();
  const { unreadCount } = useUnreadNotificationCount();
  const scrollBottomPadding = useScrollBottomPadding(24);

  useFocusSilentRefresh(refresh, Boolean(data));

  const openProfile = () => navigateTab('Profile');
  const openNotifications = () => navigateStack('FarmerNotifications');
  const openFarms = () => navigateTab('Farms');
  const openFarmActivities = () => navigateTab('Activities');
  const openAddFarmActivity = () => navigateStack('FarmerFarmActivity');
  const openAddressDetails = () => navigateStack('FarmerAddressDetails');
  const openChatSupport = () => navigateStack('ChatbotSupport', { supportRole: 'farmer', sourceModule: 'farmer_dashboard' });
  const openServices = () => navigateStack('FarmerServices');
  const openBiocharUpdates = () => navigateStack('FarmerActivityLogs');
  const openWallet = () => navigateStack('FarmerWallet');
  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <LoadingState message={t('farmer.dashboard.loading')} />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  const dashboard = data!;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <RoleEnvironmentalBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={farmerTheme.actionGreen} />
        }
      >
        <FarmerDashboardHeader
          firstName={dashboard.firstName}
          fullName={dashboard.fullName}
          photoUrl={dashboard.photoUrl}
          unreadCount={unreadCount}
          onNotificationsPress={openNotifications}
          onProfilePress={openProfile}
        />

        <View style={styles.contentBlock}>
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
            nextUpdateLabel={
              dashboard.biocharNextUpdateLabel === 'Not Scheduled'
                ? t('farmer.dashboard.notScheduled')
                : dashboard.biocharNextUpdateLabel
            }
            cycleStatusLabel={t(`farmer.status.${dashboard.biocharCycleStatusKey}`)}
            cycleTone={dashboard.biocharCycleTone}
            walletAmountLabel={dashboard.walletAmountLabel}
            cycleLoading={dashboard.biocharCycleLoading}
            onServicePress={openServices}
            onUpdatesPress={openBiocharUpdates}
            onWalletPress={openWallet}
          />

          <FarmerQuickAccessSection
            onServices={openServices}
            onBiocharUpdates={openAddFarmActivity}
            onWallet={openWallet}
            onProfile={openProfile}
            onSupport={openChatSupport}
            onViewFarms={openFarms}
            onSubmitActivity={openAddFarmActivity}
          />

          <FarmerRecentActivitiesSection
            activities={dashboard.recentActivities}
            onViewAllPress={openFarmActivities}
          />
        </View>

        <View style={[styles.bottomSpacer, { height: scrollBottomPadding }]} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: { flex: 1 },
  container: {
    paddingTop: 0,
    paddingBottom: 8,
    gap: 16,
  },
  contentBlock: {
    paddingHorizontal: 16,
    gap: 24,
  },
  bottomSpacer: { height: 24 },
});
