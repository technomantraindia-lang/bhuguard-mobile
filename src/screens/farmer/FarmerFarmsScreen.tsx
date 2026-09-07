import { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { FarmerFarmListCard } from '../../components/farmer/FarmerFarmListCard';
import { FarmerFarmsHeader } from '../../components/farmer/FarmerFarmsHeader';
import { FarmerFarmsMapOverview } from '../../components/farmer/FarmerFarmsMapOverview';
import { FarmerFarmsSummaryCard } from '../../components/farmer/FarmerFarmsSummaryCard';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import { useFarmerFarmsData } from '../../hooks/useFarmerFarmsData';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Farms'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

const FILTER_LABELS = {
  all: 'All farms',
  verified: 'Verified only',
  pending: 'Pending only',
  mapped: 'Mapped only',
  unmapped: 'Not mapped',
} as const;

export function FarmerFarmsScreen() {
  const navigation = useNavigation<Nav>();
  const { unreadCount } = useUnreadNotificationCount();
  const {
    farms,
    allFarms,
    farmerDisplayId,
    summary,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterMode,
    cycleFilter,
    reload,
  } = useFarmerFarmsData();
  const scrollBottomPadding = useScrollBottomPadding(24);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  if (loading && allFarms.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <LoadingState message="Loading your farms..." />
      </SafeAreaView>
    );
  }

  if (error && allFarms.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <FlatList
        data={farms}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <FarmerFarmsHeader
              unreadCount={unreadCount}
              onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
            />

            <View style={styles.paddedBlock}>
              <FarmerFarmsSummaryCard
                totalFarms={summary.totalFarms}
                totalLandLabel={summary.totalLandLabel}
                verifiedCount={summary.verifiedCount}
                pendingCount={summary.pendingCount}
              />

              <FarmerFarmsMapOverview
                farms={allFarms}
                farmerDisplayId={farmerDisplayId}
              />

              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={styles.searchIcon}>
                    <Path
                      d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3"
                      stroke={dashboardTheme.onSurfaceVariant}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search farm by name or village"
                    placeholderTextColor={dashboardTheme.outline}
                    style={styles.searchInput}
                  />
                </View>

                <Pressable style={styles.filterButton} onPress={cycleFilter}>
                  <BhuguardMaterialIcon name="menu" size={20} color={dashboardTheme.onSurfaceVariant} />
                </Pressable>
              </View>

              <Text style={styles.filterHint}>{FILTER_LABELS[filterMode]}</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.paddedItem}>
            <FarmerFarmListCard
              farm={item}
              onViewActivities={() =>
                navigation.navigate('FarmerFarmActivitiesList', { farmId: item.id, farmName: item.name })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={[styles.emptyWrap, styles.paddedItem]}>
            <EmptyState
              title={searchQuery.trim() || filterMode !== 'all' ? 'No farms found' : 'No farm linked'}
              message={
                searchQuery.trim() || filterMode !== 'all'
                  ? 'Try changing your search or filter.'
                  : 'No farm is linked with your account. Please contact your Field Officer.'
              }
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: dashboardTheme.background,
  },
  listContent: {
    gap: 12,
  },
  headerBlock: {
    gap: 0,
    paddingTop: 0,
    paddingBottom: 8,
  },
  paddedBlock: {
    paddingHorizontal: dashboardTheme.marginMobile,
    gap: 16,
    paddingTop: 16,
  },
  paddedItem: {
    paddingHorizontal: dashboardTheme.marginMobile,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: dashboardTheme.surfaceVariant,
    borderRadius: 8,
    backgroundColor: dashboardTheme.surfaceLowest,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: dashboardTheme.onSurface,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: dashboardTheme.surfaceVariant,
    backgroundColor: dashboardTheme.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterHint: {
    fontSize: 12,
    color: dashboardTheme.textMuted,
    marginTop: -8,
  },
  emptyWrap: {
    gap: 12,
    paddingVertical: 8,
  },
});
