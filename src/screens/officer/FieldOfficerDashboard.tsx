import { useRef } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
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
  OfficerGreetingSection,
  OfficerMapCoverage,
  OfficerPerformanceSection,
  OfficerQuickActionCards,
  OfficerRecentActivity,
  OfficerStatsGrid,
  OfficerSummaryCard,
  OfficerTodaysVisits,
} from '../../components/officer/OfficerDashboardSections';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerQuickAccessSection } from '../../components/officer/OfficerQuickAccessSection';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { useFieldOfficerDashboardData } from '../../hooks/useFieldOfficerDashboardData';
import type { OfficerDashboardVisit } from '../../hooks/useFieldOfficerDashboardData';
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

  const handleVisitPress = (visit: OfficerDashboardVisit) => {
    guardedNavigate(() => {
      if (visit.assignmentId) {
        navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId: visit.assignmentId });
        return;
      }

      navigation.navigate('Visits');
    });
  };

  const handleOnboardFarmer = () => {
    guardedNavigate(() => navigation.navigate('FarmerOnboardingStart'));
  };

  const openFarmActivity = () => {
    guardedNavigate(() => navigation.navigate('FieldOfficerFarmActivityStart'));
  };

  const primaryAssignmentId = data?.visits.find((visit) => visit.assignmentId)?.assignmentId;

  const openPrimaryAssignment = (onReady: (assignmentId: number) => void) => {
    if (primaryAssignmentId) {
      onReady(primaryAssignmentId);
      return;
    }

    navigation.navigate('Visits');
  };

  const handleGpsCheckIn = () => {
    guardedNavigate(() => {
      openPrimaryAssignment((assignmentId) => navigation.navigate('VisitCheckIn', { assignmentId }));
    });
  };

  if (loading && !data) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <OfficerListState kind="loading" message="Loading field verification dashboard..." />
      </OfficerScreenChrome>
    );
  }

  if (error && !data) {
    return (
      <OfficerScreenChrome edges={['top']}>
        <ErrorState message={error} onRetry={reload} />
      </OfficerScreenChrome>
    );
  }

  const dashboard = data!;

  const handleCallFarmer = () => {
    guardedNavigate(() => navigation.navigate('FieldOfficerCallFarmer'));
  };

  return (
    <OfficerScreenChrome edges={['top']}>
      <OfficerDashboardHeader
        officerName={dashboard.officerName}
        photoUrl={dashboard.photoUrl}
        unreadCount={unreadCount}
        onProfilePress={() => guardedNavigate(() => navigation.navigate('Profile'))}
        onNotificationsPress={() =>
          guardedNavigate(() => navigation.navigate('FieldOfficerNotifications'))
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={officerTheme.primary} />
        }
      >
        <OfficerGreetingSection greeting={dashboard.greeting} officerName={dashboard.officerName} />
        <FieldOfficerLiveCheckInCard />
        <OfficerBiocharSummaryCards
          assignedFarmersCount={dashboard.assignedFarmersCount}
          dueBiocharCount={dashboard.dueBiocharCount}
          overdueFarmersCount={dashboard.overdueFarmersCount}
          myArtisansCount={dashboard.myArtisansCount}
          artisanBiocharBatchesCount={dashboard.artisanBiocharBatchesCount}
        />
        <OfficerSummaryCard dashboard={dashboard} />
        <OfficerStatsGrid dashboard={dashboard} />
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
        <OfficerTodaysVisits
          visits={dashboard.visits}
          onVisitPress={handleVisitPress}
          onSeeSchedule={() => guardedNavigate(() => navigation.navigate('FieldOfficerSchedule'))}
          onNewFarmer={handleOnboardFarmer}
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
          onAssignedVisits={() => guardedNavigate(() => navigation.navigate('Visits'))}
          onGpsCheckIn={handleGpsCheckIn}
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
    paddingTop: 16,
  },
});
