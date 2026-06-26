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
import { FarmerAddBiocharCard } from '../../components/farmer/activities/FarmerAddBiocharCard';
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
  if (status === 'draft' || status === 'correction_required') {
    return '#CA8A04';
  }

  if (status === 'submitted_for_review') {
    return dashboardTheme.primaryContainer;
  }

  return dashboardTheme.textMuted;
}

export function FarmerMyActivitiesScreen() {
  const navigation = useNavigation<Nav>();
  const navigateStack = useFarmerStackNavigation();
  const { services, biocharRecords, loading, error, reload } = useFarmerActivitiesHubData();

  const openAddBiochar = () => {
    navigateStack('FarmerBiocharProduction', {});
  };

  const openBiocharActivities = () => {
    navigateStack('FarmerBiocharActivities');
  };

  const handleServicePress = (serviceCode: string, canOpen: boolean) => {
    if (serviceCode === 'BIOCHAR' && canOpen) {
      openBiocharActivities();
      return;
    }

    Alert.alert('Coming soon', FARMER_UPCOMING_SERVICE_MESSAGE);
  };

  const renderBiocharRecord = (record: ApiRecord) => {
    const id = Number(record.id);
    const batchCode = pickString(record, 'batch_code', 'batchCode');
    const farmerName = pickString(record, 'farmer_name', 'farmerName');
    const status = pickString(record, 'status');
    const statusLabel = pickString(record, 'status_label', 'statusLabel');
    const canEdit = record.can_edit === true;

    return (
      <Pressable
        key={String(id)}
        style={[styles.recordCard, canEdit && styles.recordCardDraft]}
        onPress={() => navigateStack('FarmerBiocharProduction', { batchId: id })}
      >
        <View style={styles.recordHeader}>
          <Text style={styles.recordTitle}>{pickString(record, 'production_record_code', 'productionRecordCode')}</Text>
          <Text style={[styles.statusBadge, { color: statusTone(status) }]}>{statusLabel !== '-' ? statusLabel : status}</Text>
        </View>
        <Text style={styles.recordMeta}>
          Project: Biochar · {pickString(record, 'production_date_label', 'productionDateLabel')}
        </Text>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Batch ID</Text>
          <Text style={styles.fieldValue}>{batchCode !== '-' ? batchCode : `Record #${id}`}</Text>
        </View>
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Farmer Name</Text>
          <Text style={styles.fieldValue}>{farmerName !== '-' ? farmerName : '—'}</Text>
        </View>
        <Text style={styles.recordAction}>{canEdit ? 'Tap to continue draft' : 'Tap to view record'}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FarmerActivitiesHeader
        onNotificationsPress={() => navigateStack('FarmerNotifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={dashboardTheme.primary} />}
      >
        <Text style={styles.pageSubtitle}>Manage your Biochar activities. Other services are coming soon.</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((service) => (
            <FarmerActivityServiceCard
              key={service.code}
              service={service}
              onPress={() => handleServicePress(service.code, service.canOpen)}
              onActionPress={() => {
                if (service.code === 'BIOCHAR') {
                  openBiocharActivities();
                }
              }}
            />
          ))}
        </View>

        <FarmerAddBiocharCard onPress={openAddBiochar} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Biochar Activities</Text>
            <Pressable onPress={openBiocharActivities}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>

          {biocharRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Biochar activities yet</Text>
              <Text style={styles.emptyText}>Tap Add Biochar to create your first activity record.</Text>
            </View>
          ) : (
            biocharRecords.slice(0, 5).map(renderBiocharRecord)
          )}
        </View>
      </ScrollView>

      <FarmerActivitiesFab onPress={openAddBiochar} />
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
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: dashboardTheme.headingGreen,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '700',
    color: dashboardTheme.primaryContainer,
  },
  emptyCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    padding: 16,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
  },
  emptyText: {
    fontSize: 14,
    color: dashboardTheme.textMuted,
  },
  recordCard: {
    backgroundColor: dashboardTheme.surfaceLowest,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: dashboardTheme.outlineVariant,
    gap: 4,
  },
  recordCardDraft: {
    borderColor: '#CA8A04',
    backgroundColor: '#FFFBEB',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: dashboardTheme.onSurface,
    flex: 1,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  recordMeta: {
    fontSize: 13,
    color: dashboardTheme.textMuted,
  },
  fieldBlock: {
    marginTop: 4,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: dashboardTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.onSurface,
  },
  recordAction: {
    fontSize: 12,
    fontWeight: '600',
    color: dashboardTheme.primaryContainer,
    marginTop: 8,
  },
});
