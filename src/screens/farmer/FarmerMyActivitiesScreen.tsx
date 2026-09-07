import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FarmerActivitiesFab } from '../../components/farmer/activities/FarmerActivitiesFab';
import { FarmerActivitiesHeader } from '../../components/farmer/activities/FarmerActivitiesHeader';
import { useFarmerActivitiesHubData } from '../../hooks/useFarmerActivitiesHubData';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useScrollBottomPadding } from '../../hooks/useTabBarLayout';
import type { FarmerStackParamList, FarmerTabParamList } from '../../navigation/types';
import { dashboardTheme } from '../../theme/bhuguardDashboardTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { formatLocalizedDate } from '../../utils/localizedDate';
import { translateStatus } from '../../utils/translateStatus';
import { useTranslation } from '../../i18n/I18nContext';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FarmerTabParamList, 'Activities'>,
  NativeStackNavigationProp<FarmerStackParamList>
>;

function statusTone(status: string): string {
  if (status === 'submitted') {
    return dashboardTheme.primaryContainer;
  }

  return dashboardTheme.textMuted;
}

export function FarmerMyActivitiesScreen() {
  const { t, language } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { farmActivities, loading, error, reload } = useFarmerActivitiesHubData();
  const { unreadCount } = useUnreadNotificationCount();
  const scrollBottomPadding = useScrollBottomPadding(100);

  const openAddFarmActivity = () => {
    navigation.navigate('FarmerFarmActivity', {});
  };

  const openFarmActivity = (record: ApiRecord) => {
    const id = Number(record.id ?? record.activity_id);
    const farmId = Number(record.farm_id ?? record.farmId);
    navigation.navigate('FarmerFarmActivity', {
      ...(Number.isFinite(id) && id > 0 ? { activityId: id } : {}),
      ...(Number.isFinite(farmId) && farmId > 0 ? { farmId } : {}),
    });
  };

  const renderFarmActivityRecord = (record: ApiRecord) => {
    const id = Number(record.id);
    const status = pickString(record, 'status');
    const statusLabel = translateStatus(status, t);
    const activityDate = pickString(record, 'activity_date', 'activityDate');
    const farmName = pickString(record, 'farm_name', 'farmName');
    const farmUpdateStatus = pickString(record, 'farm_update_status', 'farmUpdateStatus');
    const dueLabel = pickString(record, 'farm_update_status_label', 'farmUpdateStatusLabel');
    const photoUploadDate = pickString(
      record,
      'submitted_at',
      'photo_uploaded_at',
      'farm_photo_upload_date',
      'created_at',
    );
    const nextFarmPhotoUploadDate = pickString(record, 'next_farm_update_date', 'nextFarmUpdateDate');
    const overdue =
      farmUpdateStatus === 'overdue'
      || dueLabel.toLowerCase().includes('overdue');
    const performedBy = pickString(record, 'created_by_role', 'performed_by_role');

    return (
      <Pressable
        key={String(id)}
        style={styles.recordCard}
        accessibilityRole="button"
        onPress={() => openFarmActivity(record)}
      >
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>Farm Activity</Text>
          <Text style={[styles.statusBadge, { color: overdue ? '#B91C1C' : statusTone(status) }]}>
            {overdue ? 'Overdue' : statusLabel}
          </Text>
        </View>
        <Text style={styles.recordMeta}>
          Farm Name: {farmName !== '-' ? farmName : '—'}
        </Text>
        <Text style={styles.recordMeta}>
          Farm ID: {pickString(record, 'farm_code', 'farmCode', 'farm_id')}
        </Text>
        <Text style={styles.recordMeta}>
          Activity Date: {formatLocalizedDate(activityDate, language)}
        </Text>
        {performedBy && performedBy !== '-' ? (
          <Text style={styles.recordMeta}>Performed by role: {performedBy}</Text>
        ) : null}
        {dueLabel && dueLabel !== '-' ? (
          <Text style={styles.recordMeta}>Due status: {dueLabel}</Text>
        ) : null}
        <Text style={styles.recordMeta}>
          Farm Photo Upload Date:{' '}
          {formatLocalizedDate(photoUploadDate || nextFarmPhotoUploadDate, language)}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        <FarmerActivitiesHeader
          unreadCount={unreadCount}
          onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
          onProfilePress={() => navigation.navigate('FarmerProfile')}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('farmer.activities.title')}</Text>
            <Pressable onPress={openAddFarmActivity}>
              <Text style={styles.linkText}>{t('farmer.activities.addActivity')}</Text>
            </Pressable>
          </View>

          {farmActivities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('farmer.activities.emptyTitle')}</Text>
              <Text style={styles.emptyText}>{t('farmer.activities.emptyMessage')}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionSubtitle}>
                {t('farmer.activities.submittedCount', { count: String(farmActivities.length) })}
              </Text>
              {farmActivities.map(renderFarmActivityRecord)}
            </>
          )}
        </View>
      </ScrollView>

      <FarmerActivitiesFab onPress={openAddFarmActivity} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { paddingHorizontal: dashboardTheme.marginMobile, gap: 20, paddingTop: 0 },
  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: dashboardTheme.onSurface },
  sectionSubtitle: { fontSize: 14, fontWeight: '700', color: dashboardTheme.onSurfaceVariant, marginTop: 4 },
  linkText: { fontSize: 13, fontWeight: '700', color: dashboardTheme.primaryContainer },
  recordCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 14,
    gap: 6,
  },
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
