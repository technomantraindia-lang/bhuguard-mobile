import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerActivitiesFab } from '../../components/farmer/activities/FarmerActivitiesFab';
import { FarmerActivitiesFilterChips } from '../../components/farmer/activities/FarmerActivitiesFilterChips';
import { FarmerActivitiesHeader } from '../../components/farmer/activities/FarmerActivitiesHeader';
import { FarmerActivitiesQuickActionCard } from '../../components/farmer/activities/FarmerActivitiesQuickActionCard';
import { FarmerActivitiesSummaryGrid } from '../../components/farmer/activities/FarmerActivitiesSummaryGrid';
import { FarmerActivityProgressSection } from '../../components/farmer/activities/FarmerActivityProgressSection';
import { FarmerActivitySearchBar } from '../../components/farmer/activities/FarmerActivitySearchBar';
import { FarmerActivityListCard } from '../../components/farmer/activities/FarmerActivityListCard';
import { FarmerActivityVerificationCard } from '../../components/farmer/activities/FarmerActivityVerificationCard';
import { FarmerEvidenceSummarySection } from '../../components/farmer/activities/FarmerEvidenceSummarySection';
import { useFarmerActivitiesData } from '../../hooks/useFarmerActivitiesData';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Activities'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

export function FarmerMyActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const {
    activities,
    summary,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    reload,
  } = useFarmerActivitiesData();

  const openSubmitActivity = () => {
    navigation.navigate('FarmerSubmitActivity');
  };

  const openActivityDetail = (activityId: number) => {
    navigation.navigate('FarmerActivityDetail', { activityId });
  };

  const openCaptureEvidence = () => {
    navigation.navigate('StitchScreen', { screenKey: 'add_farmer_evidence' });
  };

  const openActivityReport = () => {
    navigation.navigate('Reports');
  };

  const openEditActivity = (farmId: number) => {
    navigation.navigate('FarmerSubmitActivity', { farmId });
  };

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading your activities..." />
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

  const activitySummary = summary!;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerActivitiesHeader
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
        <Text style={styles.pageSubtitle}>Track, manage and submit your farming activities.</Text>

        <FarmerActivitiesSummaryGrid summary={activitySummary} />

        <FarmerActivitiesQuickActionCard onPress={openSubmitActivity} />

        <FarmerActivitiesFilterChips selected={filter} onSelect={setFilter} />

        <FarmerActivitySearchBar value={searchQuery} onChangeText={setSearchQuery} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>

          {activities.length === 0 ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                title="No activities found"
                message="Submit your first farming activity to start verification."
              />
            </View>
          ) : (
            <View style={styles.timeline}>
              {activities.map((activity) => (
                <FarmerActivityListCard
                  key={activity.id}
                  activity={activity}
                  onViewDetails={() => openActivityDetail(activity.id)}
                  onDownloadReport={
                    activity.status === 'approved' ? () => openActivityReport() : undefined
                  }
                  onEditActivity={activity.status === 'draft' ? () => openEditActivity(activity.farmId) : undefined}
                  onResubmit={
                    activity.status === 'correction_required'
                      ? () => openEditActivity(activity.farmId)
                      : undefined
                  }
                />
              ))}
            </View>
          )}
        </View>

        <FarmerActivityProgressSection summary={activitySummary} />
        <FarmerEvidenceSummarySection summary={activitySummary} onCaptureEvidence={openCaptureEvidence} />
        <FarmerActivityVerificationCard
          summary={activitySummary}
          onViewReport={() => navigation.navigate('FarmerVerificationStatus')}
        />
      </ScrollView>

      <FarmerActivitiesFab onPress={openSubmitActivity} />
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
    paddingBottom: 140,
    gap: 16,
  },
  pageSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: dashboardTheme.textMuted,
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  timeline: {
    gap: 4,
  },
  emptyWrap: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
  },
});
