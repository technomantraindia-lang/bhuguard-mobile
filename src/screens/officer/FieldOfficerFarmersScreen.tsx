import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { createFieldOfficerVisit, getFieldOfficerFarmers } from '../../api/fieldOfficerApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { FieldOfficerStackParamList } from '../../navigation/types';
import { officerTheme } from '../../theme/officerDashboardTheme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';

type Nav = NativeStackNavigationProp<FieldOfficerStackParamList>;

function cycleTone(status: string): string {
  if (status === 'overdue' || status === 'due_today') {
    return officerTheme.error;
  }

  if (status === 'due_soon') {
    return '#CA8A04';
  }

  return officerTheme.primaryContainer;
}

export function FieldOfficerFarmersScreen() {
  const navigation = useNavigation<Nav>();
  const [farmers, setFarmers] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getFieldOfficerFarmers();
      setFarmers(extractList(data as ApiRecord, ['farmers']));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load farmers.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && farmers.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingState message="Loading farmers..." />
      </SafeAreaView>
    );
  }

  if (error && farmers.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="My Farmers" showBrandLogo={false} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={officerTheme.primary} />}
      >
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('FarmerOnboardingStart')}>
          <Text style={styles.addButtonText}>Register New Farmer</Text>
        </Pressable>

        {farmers.length === 0 ? (
          <Text style={styles.empty}>No farmers registered yet.</Text>
        ) : (
          farmers.map((farmer) => {
            const farmerId = Number(farmer.farmer_id ?? farmer.id);
            const cycleStatus = String(farmer.biochar_cycle_status ?? 'not_started');
            const overdue = Boolean(farmer.is_biochar_overdue);
            const statusLabel = String(farmer.biochar_cycle_status_label ?? 'Not Started');

            return (
              <View key={farmerId} style={[styles.card, overdue && styles.cardOverdue]}>
                <Text style={styles.name}>{pickString(farmer, 'name')}</Text>
                <Text style={styles.meta}>{pickString(farmer, 'village')} • {pickString(farmer, 'mobile')}</Text>
                {farmer.managed_without_mobile ? (
                  <Text style={styles.badge}>No Mobile / Managed by Field Officer</Text>
                ) : null}
                <Text style={[styles.status, { color: cycleTone(cycleStatus) }]}>
                  Biochar: {statusLabel}
                  {farmer.biochar_days_remaining !== null && farmer.biochar_days_remaining !== undefined
                    ? ` • ${farmer.biochar_days_remaining} days`
                    : ''}
                </Text>
                {overdue ? <Text style={styles.overdueText}>Biochar update is overdue. Please submit update.</Text> : null}
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('OnboardedFarmerView', { farmerId })}
                  >
                    <Text style={styles.actionText}>View Farmer</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('FieldOfficerCreateVisit', { farmerId })}
                  >
                    <Text style={styles.actionText}>Add Visit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtnPrimary}
                    onPress={() => navigation.navigate('FieldOfficerBiocharProduction', { farmerId })}
                  >
                    <Text style={styles.actionTextPrimary}>Biochar Production</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: officerTheme.background },
  content: { padding: officerTheme.marginMobile, gap: 12, paddingBottom: 120 },
  addButton: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: { color: officerTheme.onPrimary, fontWeight: '700', fontSize: 15 },
  empty: { textAlign: 'center', color: officerTheme.onSurfaceVariant, marginTop: 24 },
  card: {
    backgroundColor: officerTheme.surfaceLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    padding: 14,
    gap: 6,
  },
  cardOverdue: { borderColor: officerTheme.error, backgroundColor: '#FEF2F2' },
  name: { fontSize: 16, fontWeight: '700', color: officerTheme.onSurface },
  meta: { fontSize: 13, color: officerTheme.onSurfaceVariant },
  badge: { fontSize: 12, fontWeight: '600', color: officerTheme.primaryContainer },
  status: { fontSize: 13, fontWeight: '600' },
  overdueText: { fontSize: 12, color: officerTheme.error, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  actionBtn: {
    borderWidth: 1,
    borderColor: officerTheme.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionText: { fontSize: 12, fontWeight: '600', color: officerTheme.onSurface },
  actionBtnPrimary: {
    backgroundColor: officerTheme.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionTextPrimary: { fontSize: 12, fontWeight: '700', color: officerTheme.onPrimary },
});
