import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { OfficerVisitsHeader } from '../../components/officer/visits/OfficerVisitsHeader';
import {
  OfficerVisitCards,
  OfficerVisitsMapCard,
  OfficerVisitsQuickActions,
  OfficerVisitsRecentActivity,
  OfficerVisitsSearchFilter,
  OfficerVisitsSubtitle,
  OfficerVisitsSummaryCards,
} from '../../components/officer/visits/OfficerVisitsSections';
import type { OfficerAssignedVisit } from '../../hooks/useFieldOfficerVisitsData';
import { useFieldOfficerVisitsData } from '../../hooks/useFieldOfficerVisitsData';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Visits'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

export function FieldOfficerAssignedVisitsScreen() {
  const navigation = useNavigation<Nav>();
  const {
    data,
    loading,
    error,
    reload,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    filteredVisits,
    primaryAssignmentId,
  } = useFieldOfficerVisitsData();
  const scrollBottomPadding = useScrollBottomPadding();

  const openVisit = (visit: OfficerAssignedVisit) => {
    navigation.navigate('FieldOfficerAssignmentDetail', { assignmentId: visit.assignmentId });
  };

  const openNavigate = (_visit: OfficerAssignedVisit) => {
    navigation.navigate('Map');
  };

  const requireAssignmentId = (onReady: (assignmentId: number) => void) => {
    if (primaryAssignmentId) {
      onReady(primaryAssignmentId);
      return;
    }

    const first = data?.visits[0];
    if (first) {
      onReady(first.assignmentId);
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading assigned visits..." />
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

  const visitsData = data!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <OfficerVisitsHeader
        officerName={visitsData.officerName}
        onBackPress={() => navigation.navigate('Home')}
        onNotificationsPress={() => navigation.navigate('FieldOfficerNotifications')}
        onProfilePress={() => navigation.navigate('FieldOfficerProfile')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={officerTheme.primary} />
        }
      >
        <OfficerVisitsSubtitle subtitle="Manage and verify assigned farmer and company visits." />
        <OfficerVisitsSummaryCards summary={visitsData.summary} onFilterPress={setFilter} />
        <OfficerVisitsSearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
        />

        <OfficerVisitCards visits={filteredVisits} onOpenVisit={openVisit} onNavigate={openNavigate} />

        <OfficerVisitsQuickActions
          onGpsCheckIn={() => requireAssignmentId((id) => navigation.navigate('VisitCheckIn', { assignmentId: id }))}
          onFeedstockVerification={() => navigation.navigate('FieldOfficerFeedstockVerification')}
          onBiocharProduction={() => navigation.navigate('FieldOfficerBiocharProductionList')}
          onInventoryMovement={() => navigation.navigate('FieldOfficerInventoryMovement')}
          onUploadEvidence={() =>
            requireAssignmentId((id) => navigation.navigate('VisitEvidenceUpload', { assignmentId: id }))
          }
          onReportsQueue={() => navigation.navigate('FieldOfficerVerificationReports')}
        />

        <OfficerVisitsRecentActivity
          activities={visitsData.recentActivities}
          onActivityPress={(activity) => {
            if (activity.title.includes('GPS')) {
              requireAssignmentId((id) => navigation.navigate('VisitCheckIn', { assignmentId: id }));
              return;
            }

            if (activity.title.includes('Verification')) {
              requireAssignmentId((id) => navigation.navigate('VisitEvidenceUpload', { assignmentId: id }));
              return;
            }

            if (activity.title.includes('Evidence')) {
              requireAssignmentId((id) => navigation.navigate('VisitEvidenceUpload', { assignmentId: id }));
              return;
            }

            navigation.navigate('FieldOfficerVerificationReports');
          }}
        />
        <OfficerVisitsMapCard
          summary={visitsData.summary}
          onOpenFullMap={() => navigation.navigate('Map')}
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
