import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../../api/authApi';
import { getArtisanBiocharProductionRecords } from '../../api/artisanApi';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import {
  listOfflineSubmissionsForArtisan,
  type OfflineProductionSubmissionRow,
} from '../../storage/offlineBiocharProductionDb';
import { syncPendingBiocharProductions, startBiocharProductionSyncListeners } from '../../services/biocharProductionSyncService';
import { artisanTheme } from '../../theme/artisanTheme';
import { spacing } from '../../theme';
import { extractList, pickString, type ApiRecord } from '../../utils/apiHelpers';
import { getAuthUser } from '../../utils/authStorage';
import type { OfflineProductionPayload } from '../../utils/offlineBiocharProductionPayload';
import { Pressable } from 'react-native';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanProductionRecords'>;

export function ArtisanProductionRecordsScreen() {
  const navigation = useNavigation<Nav>();
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [pendingLocal, setPendingLocal] = useState<OfflineProductionSubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const authUser = await getAuthUser();
      const artisanId = authUser?.artisan_profile?.id ?? null;
      startBiocharProductionSyncListeners(artisanId);
      void syncPendingBiocharProductions(artisanId);

      const data = await getArtisanBiocharProductionRecords('submitted');
      const serverRecords = extractList(data as ApiRecord, ['items', 'records', 'batches']);
      setRecords(serverRecords);

      if (artisanId) {
        const local = await listOfflineSubmissionsForArtisan(artisanId, [
          'pending_sync',
          'syncing',
          'sync_failed',
        ]);
        const serverIds = new Set(
          serverRecords
            .map((item) => Number(item.id))
            .filter((id) => Number.isFinite(id) && id > 0),
        );
        setPendingLocal(local.filter((row) => !row.server_batch_id || !serverIds.has(row.server_batch_id)));
      } else {
        setPendingLocal([]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load production records.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading && records.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <LoadingState message="Loading submitted production records..." />
      </SafeAreaView>
    );
  }

  if (error && records.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ErrorState message={error} onRetry={load} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Submitted Production"
        subtitle="Status tracking only"
        showBrandLogo
        logoOnPress={() => navigation.navigate('ArtisanDashboard')}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
      >
        {pendingLocal.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Pending Sync</Text>
            {pendingLocal.map((row) => {
              let batchCode = row.batch_code_local ?? '—';
              try {
                const payload = JSON.parse(row.payload_json) as OfflineProductionPayload;
                batchCode = payload.batch_code || batchCode;
              } catch {
                // ignore
              }

              return (
                <Pressable
                  key={row.submission_uuid}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('ArtisanBiocharProductionStatus', {
                      submissionUuid: row.submission_uuid,
                      farmId: row.farm_id,
                      farmerId: row.farmer_id,
                      batchCode,
                      status: row.status,
                      savedAt: row.submitted_offline_at,
                    })
                  }
                >
                  <Text style={styles.fieldLabel}>Batch ID</Text>
                  <Text style={styles.fieldValue}>{batchCode}</Text>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.statusValue}>
                    {row.status === 'sync_failed'
                      ? 'Sync Failed'
                      : row.status === 'syncing'
                        ? 'Syncing'
                        : 'Pending Sync'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {records.length === 0 && pendingLocal.length === 0 ? (
          <Text style={styles.empty}>No submitted production records yet.</Text>
        ) : (
          records.map((record) => {
            const id = Number(record.id);
            const batchId = pickString(record, 'batch_id', 'batch_code', 'batchCode');
            const statusLabel = pickString(record, 'status_label');

            return (
              <View key={id} style={styles.card} accessibilityRole="text">
                <Text style={styles.fieldLabel}>Batch ID</Text>
                <Text style={styles.fieldValue}>{batchId !== '-' ? batchId : `Record #${id}`}</Text>

                <Text style={styles.fieldLabel}>Farm</Text>
                <Text style={styles.fieldValue}>{pickString(record, 'farm_name', 'farmName')}</Text>

                <Text style={styles.fieldLabel}>Farmer Name</Text>
                <Text style={styles.fieldValue}>{pickString(record, 'farmer_name', 'farmerName')}</Text>

                <Text style={styles.fieldLabel}>Status</Text>
                <Text style={styles.statusValue}>{statusLabel !== '-' ? statusLabel : 'Pending'}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: artisanTheme.actionGreen },
  empty: { color: artisanTheme.secondaryText, textAlign: 'center', marginTop: spacing.xl },
  card: {
    backgroundColor: artisanTheme.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: artisanTheme.softBorder,
    gap: 2,
    ...artisanTheme.cardShadow,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: artisanTheme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  fieldValue: { fontSize: 15, fontWeight: '700', color: artisanTheme.deepText },
  statusValue: { fontSize: 15, fontWeight: '800', color: artisanTheme.actionGreen },
});
