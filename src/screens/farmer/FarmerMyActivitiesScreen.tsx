import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FARMER_UPCOMING_SERVICE_MESSAGE } from '../../constants/farmerActivityServices';
import { FarmerActivitiesFab } from '../../components/farmer/activities/FarmerActivitiesFab';
import { FarmerActivitiesHeader } from '../../components/farmer/activities/FarmerActivitiesHeader';
import { FarmerActivityServiceCard } from '../../components/farmer/activities/FarmerActivityServiceCard';
import { useFarmerStackNavigation } from '../../hooks/useBrandedNavigation';
import { useFarmerActivitiesHubData } from '../../hooks/useFarmerActivitiesHubData';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Activities'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

function statusTone(status: string): string {
  if (status === 'draft') {
    return '#CA8A04';
  }

  if (status === 'submitted') {
    return dashboardTheme.primaryContainer;
  }

  return dashboardTheme.textMuted;
}

export function FarmerMyActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const navigateStack = useFarmerStackNavigation();
  const { services, farmActivities, loading, error, reload } = useFarmerActivitiesHubData();

  const openAddFarmActivity = () => {
    navigateStack('FarmerFarmSelection');
  };

  const handleServicePress = (serviceCode: string) => {
    if (serviceCode === 'BIOCHAR') {
      return;
    }

    Alert.alert('Coming soon', FARMER_UPCOMING_SERVICE_MESSAGE);
  };

  const renderFarmActivityRecord = (record: ApiRecord) => {
    const id = Number(record.id);
    const status = pickString(record, 'status');
    const statusLabel = status === 'draft' ? 'Draft' : 'Submitted';

    return (
      <Pressable
        key={String(id)}
        style={[styles.recordCard, status === 'draft' && styles.recordCardDraft]}
        onPress={() => navigateStack('FarmerFarmActivity', { activityId: id, farmId: Number(record.farm_id) })}
      >
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>{pickString(record, 'activity_code', 'activityCode')}</Text>
          <Text style={[styles.statusBadge, { color: statusTone(status) }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.recordMeta}>Farm: {pickString(record, 'farm_code', 'farmCode')}</Text>
        <Text style={styles.recordMeta}>Activity Date: {pickString(record, 'activity_date', 'activityDate')}</Text>
        <Text style={styles.recordMeta}>Next Farm Update: {pickString(record, 'next_farm_update_date', 'nextFarmUpdateDate')}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerActivitiesHeader
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('FarmerProfile')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((service) => (
            <FarmerActivityServiceCard
              key={service.code}
              service={service.code === 'BIOCHAR' ? { ...service, canOpen: false, statusLabel: 'Active' } : service}
              displayOnly={service.code === 'BIOCHAR'}
              onPress={() => handleServicePress(service.code)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Farm Activity</Text>
            <Pressable onPress={openAddFarmActivity}>
              <Text style={styles.linkText}>Add Farm Activity</Text>
            </Pressable>
          </View>

          {farmActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Farm Activity yet</Text>
              <Text style={styles.emptyText}>Submit your first farm activity photo to start the 20-day update cycle.</Text>
            </View>
          ) : (
            farmActivities.map(renderFarmActivityRecord)
          )}
        </View>
      </ScrollView>

      <FarmerActivitiesFab onPress={openAddFarmActivity} label="Add Farm Activity" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 20, paddingBottom: 120 },
  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  linkText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer },
  recordCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 6,
  },
  recordCardDraft: { borderColor: '#FDE68A' },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordTitle: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onSurface },
  statusBadge: { fontSize: 12, fontWeight: '700' },
  recordMeta: { fontSize: 13, color: dashboardTheme.textMuted },
  emptyCard: {
    backgroundColor: dashboardTheme.surfaceLow,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: dashboardTheme.onSurface },
  emptyText: { fontSize: 13, color: dashboardTheme.textMuted, lineHeight: 18 },
  errorText: { color: dashboardTheme.error, fontSize: 14 },
});
