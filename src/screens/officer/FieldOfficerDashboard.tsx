import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { FieldOfficerLiveCheckInCard } from '../../components/officer/FieldOfficerLiveCheckInCard';
import { OfficerBiocharSummaryCards } from '../../components/officer/OfficerBiocharSummaryCards';
import { OfficerDashboardHeader } from '../../components/officer/OfficerDashboardHeader';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import {
  OfficerEmergencyActions,
  OfficerArtisanApprovalPipeline,
  OfficerFarmerOnboardingHero,
  OfficerGreetingSection,
  OfficerMapCoverage,
  OfficerPerformanceSection,
  OfficerQuickActionCards,
  OfficerRecentActivity,
} from '../../components/officer/OfficerDashboardSections';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerQuickAccessSection } from '../../components/officer/OfficerQuickAccessSection';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { useFieldOfficerDashboardData } from '../../hooks/useFieldOfficerDashboardData';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Home'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

export function FieldOfficerDashboard() {
  const navigation = useNavigation<Nav>();
  const { data, loading, refreshing, error, reload, refresh } = useFieldOfficerDashboardData();
  const { unreadCount } = useUnreadNotificationCount();
  const scrollBottomPadding = useScrollBottomPadding();
  const navLockRef = useRef(false);

  const guardedNavigate = (action: () => void) => {
    if (navLockRef.current) {
      return;
    }

    navLockRef.current = true;
    action();
    setTimeout(() => {
      navLockRef.current = false;
    }, 600);
  };

  const handleOnboardFarmer = () => {
    guardedNavigate(() => navigation.navigate('FarmerOnboardingStart'));
  };

  const openFarmActivity = () => {
    guardedNavigate(() => navigation.navigate('FieldOfficerFarmActivityStart'));
  };

  if (loading && !data) {
    return (
      <OfficerScreenChrome edges={[]}>
        <OfficerListState kind="loading" message="Loading field verification dashboard..." />
      </OfficerScreenChrome>
    );
  }

  if (error && !data) {
    return (
      <OfficerScreenChrome edges={[]}>
        <ErrorState message={error} onRetry={reload} />
      </OfficerScreenChrome>
    );
  }

  const dashboard = data!;

  const handleCallFarmer = () => {
    guardedNavigate(() => navigation.navigate('FieldOfficerCallFarmer'));
  };

  return (
    <OfficerScreenChrome edges={[]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={officerTheme.primary} />
        }
      >
        <OfficerDashboardHeader
          officerName={dashboard.officerName}
          photoUrl={dashboard.photoUrl}
          unreadCount={unreadCount}
          onProfilePress={() => guardedNavigate(() => navigation.navigate('Profile'))}
          onNotificationsPress={() =>
            guardedNavigate(() => navigation.navigate('FieldOfficerNotifications'))
          }
        />
        <View style={styles.container}>
          <OfficerGreetingSection greeting={dashboard.greeting} officerName={dashboard.officerName} />
          <FieldOfficerLiveCheckInCard />
          <OfficerFarmerOnboardingHero onOpenFarmerOnboarding={handleOnboardFarmer} />
          <OfficerBiocharSummaryCards
            assignedFarmersCount={dashboard.assignedFarmersCount}
            dueBiocharCount={dashboard.dueBiocharCount}
            overdueFarmersCount={dashboard.overdueFarmersCount}
            myArtisansCount={dashboard.myArtisansCount}
            totalVisitsCount={dashboard.totalVisitsCount}
            artisanBiocharBatchesCount={dashboard.artisanBiocharBatchesCount}
          />
          <OfficerQuickActionCards
            onOpenMyFarmers={() => guardedNavigate(() => navigation.navigate('Farmers'))}
            onOpenFarmActivity={openFarmActivity}
            onOpenInventory={() =>
              guardedNavigate(() => navigation.navigate('FieldOfficerInventoryMovement'))
            }
            onOpenMyArtisans={() =>
              guardedNavigate(() => navigation.navigate('FieldOfficerTabs', { screen: 'MyArtisans' }))
            }
            onOpenArtisanBiocharBatches={() =>
              guardedNavigate(() => navigation.navigate('ArtisanBiocharBatches'))
            }
            onOpenFarmerOnboarding={handleOnboardFarmer}
            onOpenScheduleVisit={() =>
              guardedNavigate(() => navigation.navigate('FieldOfficerSchedule'))
            }
          />
          <OfficerArtisanApprovalPipeline
            dashboard={dashboard}
            onPress={() =>
              guardedNavigate(() => navigation.navigate('FieldOfficerTabs', { screen: 'MyArtisans' }))
            }
          />
          <OfficerMapCoverage
            dashboard={dashboard}
            onViewFullMap={() => guardedNavigate(() => navigation.navigate('Map'))}
            onVisitPress={(assignmentId) =>
              guardedNavigate(() =>
                navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId }),
              )
            }
          />
          <OfficerPerformanceSection dashboard={dashboard} />
          <OfficerRecentActivity activities={dashboard.recentActivities} />
          <OfficerEmergencyActions
            onCallFarmer={handleCallFarmer}
            onNavigate={() => guardedNavigate(() => navigation.navigate('FieldOfficerNavigate'))}
          />

          <OfficerQuickAccessSection
            onProfile={() => guardedNavigate(() => navigation.navigate('FieldOfficerProfile'))}
            onSupport={() =>
              guardedNavigate(() =>
                navigation.navigate('ChatbotSupport', {
                  supportRole: 'field_officer',
                  sourceModule: 'officer_dashboard',
                }),
              )
            }
          />
        </View>
      </ScrollView>
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: officerTheme.marginMobile,
    paddingTop: 12,
    gap: 12,
  },
});
