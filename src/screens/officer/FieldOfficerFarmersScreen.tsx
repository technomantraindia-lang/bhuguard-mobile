import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getFieldOfficerFarmers } from '../../api/fieldOfficerApi';
import { OfficerListState } from '../../components/officer/OfficerListState';
import { OfficerScreenChrome } from '../../components/officer/OfficerScreenChrome';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BhuguardMaterialIcon } from '../../components/shared/BhuguardMaterialIcon';
import type { FieldOfficerStackParamList, FieldOfficerTabParamList } from '../../navigation/types';
import { officerCardShadow, officerTheme } from '../../theme/officerDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<FieldOfficerTabParamList, 'Farmers'>,
  NativeStackNavigationProp<FieldOfficerStackParamList>
>;

function formatDate(value: unknown): string {
  if (!value) {
    return '—';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FieldOfficerFarmersScreen() {
  const navigation = useNavigation<Nav>();
  const [farmers, setFarmers] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await getFieldOfficerFarmers();
      setFarmers(extractList(data as ApiRecord, ['farmers', 'data']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farmers.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  return (
    <OfficerScreenChrome edges={['top']}>
      <ScreenHeader
        title="My Farmers"
        showBrandLogo
        showBack={false}
        logoOnPress={() => navigation.navigate('Home')}
        rightAction={{
          label: 'Register',
          onPress: () => navigation.navigate('FarmerOnboardingStart'),
        }}
      />

      {loading && farmers.length === 0 ? (
        <OfficerListState kind="loading" message="Loading farmers…" />
      ) : error && farmers.length === 0 ? (
        <OfficerListState kind="error" message={error} onRetry={() => void load(false)} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={officerTheme.primary} />
          }
        >
          <Pressable
            style={[styles.registerCard, officerCardShadow]}
            onPress={() => navigation.navigate('FarmerOnboardingStart')}
          >
            <View style={styles.registerIcon}>
              <BhuguardMaterialIcon name="person_add" size={22} color={officerTheme.primary} filled />
            </View>
            <View style={styles.registerCopy}>
              <Text style={styles.registerTitle}>Register New Farmer</Text>
              <Text style={styles.registerSubtitle}>Start onboarding in your assigned working area</Text>
            </View>
            <BhuguardMaterialIcon name="chevron_right" size={20} color={officerTheme.primary} />
          </Pressable>

          {farmers.length === 0 ? (
            <OfficerListState kind="empty" title="No farmers yet" message="Registered farmers will appear here." />
          ) : (
            farmers.map((farmer) => {
              const farmerId = Number(farmer.farmer_id ?? farmer.id);
              const farmCount = Number(farmer.farm_count ?? farmer.farms_count ?? 0);
              const village = pickString(farmer, 'village');
              const taluka = pickString(farmer, 'taluka');
              const location = [village, taluka].filter((part) => part !== '-').join(' • ') || 'Location TBD';
              const verification = pickString(farmer, 'verification_status', 'onboarding_status');
              const farmActivity = pickString(farmer, 'farm_activity_status', 'biochar_cycle_status_label');
              const nextUpdate = formatDate(farmer.next_update_date ?? farmer.biochar_next_due_date);
              const overdue = Boolean(farmer.is_biochar_overdue);

              return (
                <View
                  key={`farmer-${farmerId}`}
                  style={[styles.card, officerCardShadow, overdue && styles.cardOverdue]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(pickString(farmer, 'name') || 'F').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.headerCopy}>
                      <Text style={styles.name}>{pickString(farmer, 'name')}</Text>
                      <Text style={styles.idText}>
                        ID: {pickString(farmer, 'farmer_code') !== '-' ? pickString(farmer, 'farmer_code') : farmerId}
                      </Text>
                    </View>
                    <View style={styles.farmCountPill}>
                      <Text style={styles.farmCountText}>{farmCount} farm{farmCount === 1 ? '' : 's'}</Text>
                    </View>
                  </View>

                  <Text style={styles.meta}>{location}</Text>

                  <View style={styles.statusRow}>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusLabel}>Verification</Text>
                      <Text style={styles.statusValue}>{verification.replace(/_/g, ' ')}</Text>
                    </View>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusLabel}>Farm activity</Text>
                      <Text style={styles.statusValue}>{farmActivity}</Text>
                    </View>
                  </View>

                  <Text style={styles.nextUpdate}>Next update: {nextUpdate}</Text>
                  {overdue ? <Text style={styles.overdueText}>Biochar update overdue</Text> : null}

                  <Pressable
                    style={styles.dashboardButton}
                    onPress={() => navigation.navigate('OnboardedFarmerView', { farmerId })}
                  >
                    <Text style={styles.dashboardButtonText}>Open Farmer Dashboard</Text>
                    <BhuguardMaterialIcon name="arrow_forward" size={16} color={officerTheme.onPrimary} />
                  </Pressable>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </OfficerScreenChrome>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: officerTheme.marginMobile,
    gap: 12,
    paddingBottom: 120,
  },
  registerCard: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  registerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(133, 201, 92, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerCopy: { flex: 1, gap: 2 },
  registerTitle: { fontSize: 15, fontWeight: '700', color: officerTheme.onSurface },
  registerSubtitle: { fontSize: 12, color: officerTheme.onSurfaceVariant },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 14,
    gap: 10,
  },
  cardOverdue: {
    borderColor: officerTheme.error,
    backgroundColor: '#FFF8F7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: officerTheme.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: officerTheme.onSecondaryContainer,
  },
  headerCopy: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  idText: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  farmCountPill: {
    backgroundColor: 'rgba(133, 201, 92, 0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  farmCountText: { fontSize: 11, fontWeight: '700', color: officerTheme.tertiary },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: {
    flex: 1,
    backgroundColor: officerTheme.neutral,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: officerTheme.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
    color: officerTheme.onSurface,
    textTransform: 'capitalize',
  },
  nextUpdate: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurfaceVariant },
  overdueText: { fontSize: 12, fontWeight: '700', color: officerTheme.error },
  dashboardButton: {
    marginTop: 4,
    backgroundColor: officerTheme.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashboardButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: officerTheme.onPrimary,
  },
});
