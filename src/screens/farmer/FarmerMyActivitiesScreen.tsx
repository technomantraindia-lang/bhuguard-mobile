import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FARMER_UPCOMING_SERVICE_MESSAGE } from '../../constants/farmerActivityServices';
import { FarmerActivitiesHeader } from '../../components/farmer/activities/FarmerActivitiesHeader';
import { FarmerActivityServiceCard } from '../../components/farmer/activities/FarmerActivityServiceCard';
import { useFarmerActivitiesHubData } from '../../hooks/useFarmerActivitiesHubData';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
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
  const { services, farmActivities, loading, error, reload } = useFarmerActivitiesHubData();
  const { unreadCount } = useUnreadNotificationCount();

  const openFarmActivityStatus = () => {
    Alert.alert(
      'Farm Activity',
      'Your Field Officer completes Farm Activity visits. You can review status and history here.',
    );
  };

  const handleServicePress = (serviceCode: string) => {
    if (serviceCode === 'BIOCHAR') {
      return;
    }

    Alert.alert(t('farmer.activities.comingSoonTitle'), FARMER_UPCOMING_SERVICE_MESSAGE);
  };

  const renderFarmActivityRecord = (record: ApiRecord) => {
    const id = Number(record.id);
    const status = pickString(record, 'status');
    const statusLabel = translateStatus(status, t);
    const activityDate = pickString(record, 'activity_date', 'activityDate');
    const photoUploadDate = pickString(
      record,
      'submitted_at',
      'photo_uploaded_at',
      'farm_photo_upload_date',
      'created_at',
    );
    const nextFarmPhotoUploadDate = pickString(record, 'next_farm_update_date', 'nextFarmUpdateDate');

    return (
      <View key={String(id)} style={styles.recordCard} accessibilityRole="text">
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>
            Activity ID: {pickString(record, 'activity_code', 'activityCode', 'id')}
          </Text>
          <Text style={[styles.statusBadge, { color: statusTone(status) }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.recordMeta}>
          Farm ID: {pickString(record, 'farm_code', 'farmCode', 'farm_id')}
        </Text>
        <Text style={styles.recordMeta}>
          Activity Date: {formatLocalizedDate(activityDate, language)}
        </Text>
        <Text style={styles.recordMeta}>
          Farm Photo Upload Date:{' '}
          {formatLocalizedDate(photoUploadDate || nextFarmPhotoUploadDate, language)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerActivitiesHeader
        unreadCount={unreadCount}
        onNotificationsPress={() => navigation.navigate('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('FarmerProfile')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('farmer.activities.title')}</Text>
            <Pressable onPress={openFarmActivityStatus}>
              <Text style={styles.linkText}>View status</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('farmer.activities.servicesTitle')}</Text>
          {services.map((service) => (
            <FarmerActivityServiceCard
              key={service.code}
              service={service.code === 'BIOCHAR' ? { ...service, canOpen: false, statusLabel: 'Active' } : service}
              displayOnly={service.code === 'BIOCHAR'}
              onPress={() => handleServicePress(service.code)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: dashboardTheme.background },
  content: { padding: dashboardTheme.marginMobile, gap: 20, paddingBottom: 120 },
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
