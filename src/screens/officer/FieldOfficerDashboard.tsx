import { Alert, Linking, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FieldOfficerLiveCheckInCard } from '../../components/officer/FieldOfficerLiveCheckInCard';
import { OfficerBiocharSummaryCards } from '../../components/officer/OfficerBiocharSummaryCards';
import { OfficerDashboardHeader } from '../../components/officer/OfficerDashboardHeader';
import { OfficerQuickAccessSection } from '../../components/officer/OfficerQuickAccessSection';
import {
  OfficerEmergencyActions,
  OfficerGreetingSection,
  OfficerMapCoverage,
  OfficerPerformanceSection,
  OfficerQuickActionCards,
  OfficerRecentActivity,
  OfficerStatsGrid,
  OfficerSummaryCard,
  OfficerTodaysVisits,
  OfficerVerificationPipeline,
} from '../../components/officer/OfficerDashboardSections';
import type { OfficerDashboardVisit } from '../../hooks/useFieldOfficerDashboardData';
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
  const { data, loading, error, reload } = useFieldOfficerDashboardData();
  const scrollBottomPadding = useScrollBottomPadding();

  const handleVisitPress = (visit: OfficerDashboardVisit) => {
    if (visit.assignmentId) {
      navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId: visit.assignmentId });
      return;
    }

    navigation.navigate('Visits');
  };

  const handleStartVerification = () => {
    const firstVisit = data?.visits.find((visit) => visit.assignmentId);
    if (firstVisit?.assignmentId) {
      navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId: firstVisit.assignmentId });
      return;
    }

    navigation.navigate('Visits');
  };

  const handleUploadEvidence = () => {
    const assignmentId = data?.visits.find((visit) => visit.assignmentId)?.assignmentId;
    if (assignmentId) {
      navigation.navigate('VisitEvidenceUpload', { assignmentId });
      return;
    }

    navigation.navigate('Visits');
  };

  const handleVerificationChecklist = () => {
    const assignmentId = data?.visits.find((visit) => visit.assignmentId)?.assignmentId;
    if (assignmentId) {
      navigation.navigate('VisitEvidenceUpload', { assignmentId });
      return;
    }

    navigation.navigate('Visits');
  };

  const handleOnboardFarmer = () => {
    navigation.navigate('FarmerOnboardingStart');
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
    openPrimaryAssignment((assignmentId) => navigation.navigate('VisitCheckIn', { assignmentId }));
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading field verification dashboard..." />
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

  const handleCallFarmer = () => {
    const phone =
      dashboard.visits.find((visit) => visit.farmerPhone)?.farmerPhone ?? dashboard.primaryFarmerPhone;

    if (!phone) {
      Alert.alert('Farmer mobile number is not available.');
      return;
    }

    void Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerDashboardHeader
        officerName={dashboard.officerName}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={officerTheme.primary} />
        }
      >
        <OfficerGreetingSection greeting={dashboard.greeting} officerName={dashboard.officerName} />
        <FieldOfficerLiveCheckInCard />
        <OfficerBiocharSummaryCards
          assignedFarmersCount={dashboard.assignedFarmersCount}
          dueBiocharCount={dashboard.dueBiocharCount}
          overdueFarmersCount={dashboard.overdueFarmersCount}
          draftBiocharCount={dashboard.draftBiocharCount}
          submittedBiocharCount={dashboard.submittedBiocharCount}
        />
        <OfficerSummaryCard dashboard={dashboard} />
        <OfficerStatsGrid dashboard={dashboard} />
        <OfficerQuickActionCards
          onStartVerification={handleStartVerification}
          onUploadEvidence={handleUploadEvidence}
          onOnboardFarmer={handleOnboardFarmer}
          onVerificationChecklist={handleVerificationChecklist}
          onFeedstockVerification={() => navigation.navigate('FieldOfficerFeedstockVerification')}
          onBiocharProduction={() => navigation.navigate('FieldOfficerBiocharProductionList')}
          onInventoryMovement={() => navigation.navigate('FieldOfficerInventoryMovement')}
        />
        <OfficerTodaysVisits
          visits={dashboard.visits}
          onVisitPress={handleVisitPress}
          onSeeSchedule={() => navigation.navigate('Visits')}
          onNewFarmer={handleOnboardFarmer}
        />
        <OfficerVerificationPipeline dashboard={dashboard} />
        <OfficerMapCoverage
          dashboard={dashboard}
          onViewFullMap={() => navigation.navigate('Map')}
          onVisitPress={(assignmentId) =>
            navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId })
          }
        />
        <OfficerPerformanceSection dashboard={dashboard} />
        <OfficerRecentActivity activities={dashboard.recentActivities} />
        <OfficerEmergencyActions
          onCallFarmer={handleCallFarmer}
          onNavigate={() => navigation.navigate('Map')}
          onNextVisit={() => {
            const first = dashboard.visits[0];
            if (first) {
              handleVisitPress(first);
            } else {
              navigation.navigate('Visits');
            }
          }}
          onReportIssue={() => navigation.navigate('FieldOfficerMonitoringReports')}
        />

        <OfficerQuickAccessSection
          onAssignedVisits={() => navigation.navigate('Visits')}
          onGpsCheckIn={handleGpsCheckIn}
          onEvidenceUpload={handleUploadEvidence}
          onReports={() => navigation.navigate('Reports')}
          onProfile={() => navigation.navigate('FieldOfficerProfile')}
          onSupport={() => navigation.navigate('ChatbotSupport', { supportRole: 'field_officer', sourceModule: 'officer_dashboard' })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: officerTheme.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: officerTheme.marginMobile,
    paddingTop: 16,
  },
});
