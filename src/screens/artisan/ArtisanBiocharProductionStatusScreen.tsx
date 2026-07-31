import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { getArtisanBiocharMixingEligibleBatches, getArtisanBiocharProduction } from '../../api/artisanApi';
import { getApiErrorMessage } from '../../api/authApi';
import { ScreenHeader } from '../../components/ScreenHeader';
import type { ArtisanStackParamList } from '../../navigation/types';
import {
  getOfflineSubmissionByUuid,
  type OfflineProductionSubmissionRow,
} from '../../storage/offlineBiocharProductionDb';
import {
  retryBiocharProductionSync,
  startBiocharProductionSyncListeners,
  subscribeBiocharProductionSync,
  syncPendingBiocharProductions,
} from '../../services/biocharProductionSyncService';
import { artisanTheme } from '../../theme/artisanTheme';
import { pickString, type ApiRecord } from '../../utils/apiHelpers';
import { getAuthUser } from '../../utils/authStorage';
import type { OfflineProductionPayload } from '../../utils/offlineBiocharProductionPayload';
import { safeNetInfoIsConnected } from '../../utils/safeNetInfo';

type Nav = NativeStackNavigationProp<ArtisanStackParamList, 'ArtisanBiocharProductionStatus'>;
type ScreenRoute = RouteProp<ArtisanStackParamList, 'ArtisanBiocharProductionStatus'>;

function statusTitle(status: string, offline: boolean): string {
  if (offline && (status === 'pending_sync' || status === 'syncing')) {
    return 'Biochar Production Saved Offline';
  }
  if (status === 'sync_failed') {
    return 'Biochar Production Sync Failed';
  }
  return 'Biochar Production Submitted Successfully';
}

function statusLabel(status: string): string {
  switch (status) {
    case 'pending_sync':
      return 'Pending Sync';
    case 'syncing':
      return 'Syncing';
    case 'sync_failed':
      return 'Sync Failed — Retry';
    case 'submitted_for_review':
      return 'Submitted for Review';
    case 'completed':
    case 'approved':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function ArtisanBiocharProductionStatusScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ScreenRoute>();
  const [row, setRow] = useState<OfflineProductionSubmissionRow | null>(null);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [mixingEnabled, setMixingEnabled] = useState(false);
  const [mixingHelper, setMixingHelper] = useState('Sync required before Biochar Mixing');
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const payload = useMemo(() => {
    if (!row?.payload_json) {
      return null;
    }
    try {
      return JSON.parse(row.payload_json) as OfflineProductionPayload;
    } catch {
      return null;
    }
  }, [row?.payload_json]);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const authUser = await getAuthUser();
      const artisanId = authUser?.artisan_profile?.id ?? null;
      startBiocharProductionSyncListeners(artisanId);

      if (route.params.submissionUuid) {
        const local = await getOfflineSubmissionByUuid(route.params.submissionUuid);
        setRow(local);
        if (local?.server_batch_id) {
          try {
            const response = (await getArtisanBiocharProduction(local.server_batch_id)) as ApiRecord;
            const batch = (response.batch ?? response.record ?? response) as ApiRecord;
            const status = pickString(batch, 'status');
            setServerStatus(status !== '-' ? status : null);
            if (status === 'completed' || status === 'approved') {
              const eligible = (await getArtisanBiocharMixingEligibleBatches({
                farm_id: local.farm_id,
              })) as ApiRecord;
              const batches = Array.isArray(eligible.batches) ? eligible.batches : [];
              const match = batches.find((item) => Number((item as ApiRecord).id) === local.server_batch_id);
              setMixingEnabled(Boolean(match));
              setMixingHelper(match ? 'Ready for Biochar Mixing' : 'Waiting for available quantity');
            } else if (status === 'rejected') {
              setMixingEnabled(false);
              setMixingHelper('Batch Rejected');
            } else {
              setMixingEnabled(false);
              setMixingHelper('Waiting for Admin Approval');
            }
          } catch {
            setMixingEnabled(false);
          }
        } else {
          setMixingEnabled(false);
          setMixingHelper(
            local?.status === 'sync_failed'
              ? 'Sync required before Biochar Mixing'
              : 'Sync required before Biochar Mixing',
          );
        }
      }
    } finally {
      setRefreshing(false);
    }
  }, [route.params.submissionUuid]);

  useFocusEffect(
    useCallback(() => {
      void load();
      void syncPendingBiocharProductions();
    }, [load]),
  );

  useEffect(() => {
    return subscribeBiocharProductionSync((progress) => {
      if (progress.submissionUuid === route.params.submissionUuid) {
        setProgressMessage(progress.message ?? null);
        void load();
      }
    });
  }, [load, route.params.submissionUuid]);

  const effectiveStatus = (serverStatus || row?.status || route.params.status || 'pending_sync') as string;
  const offline =
    !serverStatus &&
    (effectiveStatus === 'pending_sync' ||
      effectiveStatus === 'syncing' ||
      effectiveStatus === 'sync_failed');

  const goNewBatch = () => {
    navigation.replace('ArtisanBiocharProduction', {
      farmId: route.params.farmId,
      farmerId: route.params.farmerId,
      farmerName: route.params.farmerName,
      farmerCode: route.params.farmerCode,
      farmCode: route.params.farmCode,
      farmLabel: route.params.farmLabel,
      village: route.params.village,
      taluka: route.params.taluka,
      district: route.params.district,
      state: route.params.state,
      latitude: route.params.latitude,
      longitude: route.params.longitude,
    });
  };

  const goViewBatch = () => {
    navigation.navigate('ArtisanBiocharProduction', {
      farmId: route.params.farmId,
      farmerId: route.params.farmerId,
      farmerName: route.params.farmerName,
      farmerCode: route.params.farmerCode,
      farmCode: route.params.farmCode,
      farmLabel: route.params.farmLabel,
      village: route.params.village,
      taluka: route.params.taluka,
      district: route.params.district,
      state: route.params.state,
      latitude: route.params.latitude,
      longitude: route.params.longitude,
      batchId: row?.server_batch_id ?? undefined,
      submissionUuid: route.params.submissionUuid,
      viewOnly: true,
    });
  };

  const goMixing = async () => {
    if (!mixingEnabled || !row?.server_batch_id) {
      return;
    }
    navigation.navigate('ArtisanBiocharMixing', {
      farmId: route.params.farmId,
      farmerId: route.params.farmerId,
      farmerCode: route.params.farmerCode,
      farmerName: route.params.farmerName,
      farmCode: route.params.farmCode,
      farmLabel: route.params.farmLabel,
      village: route.params.village,
      taluka: route.params.taluka,
      district: route.params.district,
      state: route.params.state,
      recordId: undefined,
    });
  };

  const handleRetry = async () => {
    if (!route.params.submissionUuid) {
      return;
    }
    const online = await safeNetInfoIsConnected();
    if (!online) {
      Alert.alert('No internet', 'Connect to the internet to retry sync.');
      return;
    }
    try {
      await retryBiocharProductionSync(route.params.submissionUuid);
      await load();
    } catch (error) {
      Alert.alert('Retry failed', getApiErrorMessage(error, 'Unable to retry sync.'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Production Status"
        subtitle={route.params.batchCode || payload?.batch_code || 'Biochar Production'}
        showBrandLogo
        logoOnPress={() => navigation.navigate('ArtisanDashboard')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{statusTitle(effectiveStatus, offline)}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{statusLabel(effectiveStatus)}</Text>
          {offline ? (
            <Text style={styles.message}>
              This record will upload automatically when internet is available.
            </Text>
          ) : null}
          {progressMessage && progressMessage !== row?.last_error ? (
            <Text style={styles.progress}>{progressMessage}</Text>
          ) : null}
          {row?.last_error ? <Text style={styles.error}>{row.last_error}</Text> : null}
          <Text style={styles.summary}>Batch ID: {payload?.batch_code ?? route.params.batchCode ?? '—'}</Text>
          <Text style={styles.summary}>Farmer ID: {payload?.farmer_id ?? route.params.farmerId ?? '—'}</Text>
          <Text style={styles.summary}>Farm ID: {payload?.farm_id ?? route.params.farmId ?? '—'}</Text>
          <Text style={styles.summary}>Kiln ID: {payload?.kiln_id ?? '—'}</Text>
          <Text style={styles.summary}>
            Saved At: {row?.submitted_offline_at ?? route.params.savedAt ?? '—'}
          </Text>
          <Text style={styles.summary}>Sync Status: {statusLabel(row?.status ?? effectiveStatus)}</Text>
          <Text style={styles.summary}>Server Status: {serverStatus ? statusLabel(serverStatus) : '—'}</Text>
        </View>

        {(effectiveStatus === 'sync_failed' || effectiveStatus === 'pending_sync') && route.params.submissionUuid ? (
          <Pressable style={styles.primaryButton} onPress={() => void handleRetry()}>
            <Text style={styles.primaryButtonText}>Retry Sync</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={goNewBatch}>
          <Text style={styles.primaryButtonText}>Add New Biochar Production Batch</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={goViewBatch}>
          <Text style={styles.secondaryButtonText}>View Batch</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, !mixingEnabled && styles.disabledButton]}
          disabled={!mixingEnabled}
          onPress={() => void goMixing()}
        >
          <Text style={[styles.secondaryButtonText, !mixingEnabled && styles.disabledText]}>
            Continue to Biochar Mixing
          </Text>
        </Pressable>
        <Text style={styles.helper}>{mixingHelper}</Text>

        <Pressable
          style={styles.tertiaryButton}
          onPress={() => navigation.navigate('ArtisanDashboard')}
        >
          <Text style={styles.tertiaryButtonText}>Go to Dashboard</Text>
        </Pressable>

        <Pressable style={styles.tertiaryButton} onPress={() => void load()} disabled={refreshing}>
          <Text style={styles.tertiaryButtonText}>{refreshing ? 'Refreshing…' : 'Refresh Status'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: artisanTheme.creamBg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', color: artisanTheme.deepText, marginBottom: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(11,107,58,0.12)',
  },
  label: { fontSize: 12, fontWeight: '700', color: artisanTheme.secondaryText, textTransform: 'uppercase' },
  value: { fontSize: 18, fontWeight: '800', color: artisanTheme.actionGreen, marginBottom: 6 },
  message: { fontSize: 14, color: artisanTheme.secondaryText, lineHeight: 20 },
  progress: { fontSize: 13, color: artisanTheme.actionGreen, fontWeight: '600' },
  error: { fontSize: 13, color: artisanTheme.error, lineHeight: 18 },
  summary: { fontSize: 14, color: artisanTheme.deepText, fontWeight: '600' },
  primaryButton: {
    backgroundColor: artisanTheme.actionGreen,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, textAlign: 'center' },
  secondaryButton: {
    backgroundColor: artisanTheme.lightGreenSurface,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: { color: artisanTheme.actionGreen, fontWeight: '700', fontSize: 15, textAlign: 'center' },
  disabledButton: { opacity: 0.55 },
  disabledText: { color: artisanTheme.secondaryText },
  helper: { fontSize: 12, color: artisanTheme.secondaryText, marginTop: -4 },
  tertiaryButton: { paddingVertical: 12, alignItems: 'center' },
  tertiaryButtonText: { color: artisanTheme.secondaryText, fontWeight: '700', fontSize: 14 },
});
