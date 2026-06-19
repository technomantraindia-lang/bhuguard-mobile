import { Alert, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { OfficerDashboardHeader } from '../../components/officer/OfficerDashboardHeader';
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
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Home'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

export function FieldOfficerDashboard() {
  const navigation = useNavigation<Nav>();
  const { data, loading, error, reload } = useFieldOfficerDashboardData();

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

  const handleOnboardFarmer = () => {
    navigation.navigate('FarmerOnboardingStart');
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerDashboardHeader
        officerName={dashboard.officerName}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={officerTheme.primary} />
        }
      >
        <OfficerGreetingSection greeting={dashboard.greeting} officerName={dashboard.officerName} />
        <OfficerSummaryCard dashboard={dashboard} />
        <OfficerStatsGrid dashboard={dashboard} />
        <OfficerQuickActionCards
          onStartVerification={handleStartVerification}
          onUploadEvidence={handleUploadEvidence}
          onOnboardFarmer={handleOnboardFarmer}
          onFeedstockVerification={() => navigation.navigate('FieldOfficerFeedstockVerification')}
          onBiocharProduction={() => navigation.navigate('FieldOfficerBiocharProduction')}
          onInventoryMovement={() => navigation.navigate('FieldOfficerInventoryMovement')}
        />
        <OfficerTodaysVisits
          visits={dashboard.visits}
          onVisitPress={handleVisitPress}
          onSeeSchedule={() => navigation.navigate('Visits')}
          onNewFarmer={handleOnboardFarmer}
        />
        <OfficerVerificationPipeline dashboard={dashboard} />
        <OfficerMapCoverage dashboard={dashboard} onViewFullMap={() => navigation.navigate('Map')} />
        <OfficerPerformanceSection dashboard={dashboard} />
        <OfficerRecentActivity activities={dashboard.recentActivities} />
        <OfficerEmergencyActions
          onCallFarmer={() => Alert.alert('Call Farmer', 'Farmer contact will open from the visit detail screen.')}
          onNavigate={() => navigation.navigate('Map')}
          onNextVisit={() => handleVisitPress(dashboard.visits[0] ?? { id: 'none', farmerName: '', farmName: '', location: '', timeLabel: '', status: 'pending', statusLabel: 'Pending' })}
          onReportIssue={() => navigation.navigate('FieldOfficerMonitoringReports')}
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
    paddingBottom: 24,
  },
});
